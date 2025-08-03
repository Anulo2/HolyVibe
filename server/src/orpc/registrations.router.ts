import { ORPCError, os } from "@orpc/server";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod";
import { db } from "../db";
import {
	authorizedPersons,
	children,
	eventRegistrations,
	events,
	families,
	familyMembers,
	organizationMember,
	registrationAuthorizedPersons,
	registrationLocationAuthorizations,
	user as userTable,
} from "../db/schema";
import { SuccessResponse } from "./helpers";
import { withAuth } from "./middleware";
import { RegistrationWithDetails } from "./schemas";

export const registrationsRouter = os.router({
	// List registrations with filtering
	list: withAuth
		.input(
			z.object({
				eventId: z.string().optional(),
				childId: z.string().optional(),
				status: z
					.enum(["pending", "confirmed", "cancelled", "waitlist"])
					.optional(),
				page: z.number().min(1).default(1),
				limit: z.number().min(1).max(100).default(20),
			}),
		)
		.output(
			SuccessResponse(
				z.object({
					registrations: z.array(RegistrationWithDetails),
					total: z.number(),
					page: z.number(),
					limit: z.number(),
				}),
			),
		)
		.handler(async ({ input, context }) => {
			try {
				const offset = (input.page - 1) * input.limit;

				// Build where conditions
				const whereConditions = [];
				if (input.eventId) {
					whereConditions.push(eq(eventRegistrations.eventId, input.eventId));
				}
				if (input.childId) {
					whereConditions.push(eq(eventRegistrations.childId, input.childId));
				}
				if (input.status) {
					whereConditions.push(eq(eventRegistrations.status, input.status));
				}

				const whereClause =
					whereConditions.length > 0 ? and(...whereConditions) : undefined;

				// Get registrations with related data
				const registrations = await db
					.select({
						registration: eventRegistrations,
						event: events,
						child: children,
						parent: userTable,
						family: families,
					})
					.from(eventRegistrations)
					.leftJoin(events, eq(eventRegistrations.eventId, events.id))
					.leftJoin(children, eq(eventRegistrations.childId, children.id))
					.leftJoin(userTable, eq(eventRegistrations.parentId, userTable.id))
					.leftJoin(familyMembers, eq(userTable.id, familyMembers.userId))
					.leftJoin(families, eq(familyMembers.familyId, families.id))
					.where(whereClause)
					.orderBy(desc(eventRegistrations.registrationDate))
					.limit(input.limit)
					.offset(offset);

				// Get total count
				const [{ count }] = await db
					.select({ count: sql<number>`count(*)` })
					.from(eventRegistrations)
					.where(whereClause);

				// Get authorized persons for each registration
				const registrationIds = registrations.map((r) => r.registration.id);
				const authorizedPersonsData =
					registrationIds.length > 0
						? await db
								.select({
									registrationId: registrationAuthorizedPersons.registrationId,
									person: authorizedPersons,
								})
								.from(registrationAuthorizedPersons)
								.leftJoin(
									authorizedPersons,
									eq(
										registrationAuthorizedPersons.authorizedPersonId,
										authorizedPersons.id,
									),
								)
								.where(
									inArray(
										registrationAuthorizedPersons.registrationId,
										registrationIds,
									),
								)
						: [];

				const authorizedPersonsMap = new Map<string, any[]>();
				authorizedPersonsData.forEach((item) => {
					if (!authorizedPersonsMap.has(item.registrationId)) {
						authorizedPersonsMap.set(item.registrationId, []);
					}
					if (item.person) {
						authorizedPersonsMap.get(item.registrationId)!.push({
							id: item.person.id,
							fullName: item.person.fullName,
							relationship: item.person.relationship,
							phone: item.person.phone,
							email: item.person.email,
						});
					}
				});

				return {
					success: true,
					data: {
						registrations: registrations.map((item) => ({
							id: item.registration.id,
							eventId: item.registration.eventId,
							status: item.registration.status,
							paymentStatus: item.registration.paymentStatus,
							registrationDate: new Date(
								item.registration.registrationDate,
							).toISOString(),
							notes: item.registration.notes,
							createdAt: new Date(item.registration.createdAt).toISOString(),
							updatedAt: new Date(item.registration.updatedAt).toISOString(),
							child: item.child
								? {
										id: item.child.id,
										firstName: item.child.firstName,
										lastName: item.child.lastName,
										birthDate: new Date(item.child.birthDate).toISOString(),
										allergies: item.child.allergies,
										medicalNotes: item.child.medicalNotes,
									}
								: {
										id: "",
										firstName: "",
										lastName: "",
										birthDate: "",
										allergies: null,
										medicalNotes: null,
									},
							parent: item.parent
								? {
										id: item.parent.id,
										name: item.parent.name || "",
										email: item.parent.email,
										phoneNumber: item.parent.phoneNumber,
									}
								: {
										id: "",
										name: "",
										email: "",
										phoneNumber: null,
									},
							event: item.event
								? {
										id: item.event.id,
										title: item.event.title,
										startDate: new Date(item.event.startDate).toISOString(),
										endDate: item.event.endDate
											? new Date(item.event.endDate).toISOString()
											: null,
										price: item.event.price,
									}
								: {
										id: "",
										title: "",
										startDate: "",
										endDate: null,
										price: null,
									},
							family: item.family
								? {
										id: item.family.id,
										name: item.family.name,
									}
								: {
										id: "",
										name: "",
									},
							authorizedPersons:
								authorizedPersonsMap.get(item.registration.id) || [],
						})),
						total: count,
						page: input.page,
						limit: input.limit,
					},
				};
			} catch (error) {
				console.error("Error fetching registrations:", error);
				throw new ORPCError("INTERNAL_SERVER_ERROR", {
					message: "Failed to fetch registrations",
				});
			}
		}),

	// Get single registration
	get: withAuth
		.input(z.object({ id: z.string() }))
		.output(SuccessResponse(RegistrationWithDetails))
		.handler(async ({ input }) => {
			try {
				// Get registration with related data
				const registration = await db
					.select({
						registration: eventRegistrations,
						event: events,
						child: children,
						parent: userTable,
						family: families,
					})
					.from(eventRegistrations)
					.leftJoin(events, eq(eventRegistrations.eventId, events.id))
					.leftJoin(children, eq(eventRegistrations.childId, children.id))
					.leftJoin(userTable, eq(eventRegistrations.parentId, userTable.id))
					.leftJoin(familyMembers, eq(userTable.id, familyMembers.userId))
					.leftJoin(families, eq(familyMembers.familyId, families.id))
					.where(eq(eventRegistrations.id, input.id))
					.limit(1);

				if (!registration[0]) {
					throw new ORPCError("NOT_FOUND", {
						message: "Registration not found",
					});
				}

				const item = registration[0];

				// Get authorized persons for this registration
				const authorizedPersonsData = await db
					.select({
						person: authorizedPersons,
					})
					.from(registrationAuthorizedPersons)
					.leftJoin(
						authorizedPersons,
						eq(
							registrationAuthorizedPersons.authorizedPersonId,
							authorizedPersons.id,
						),
					)
					.where(eq(registrationAuthorizedPersons.registrationId, input.id));

				return {
					success: true,
					data: {
						id: item.registration.id,
						eventId: item.registration.eventId,
						status: item.registration.status,
						paymentStatus: item.registration.paymentStatus,
						registrationDate: new Date(
							item.registration.registrationDate,
						).toISOString(),
						notes: item.registration.notes,
						createdAt: new Date(item.registration.createdAt).toISOString(),
						updatedAt: new Date(item.registration.updatedAt).toISOString(),
						child: item.child
							? {
									id: item.child.id,
									firstName: item.child.firstName,
									lastName: item.child.lastName,
									birthDate: new Date(item.child.birthDate).toISOString(),
									allergies: item.child.allergies,
									medicalNotes: item.child.medicalNotes,
								}
							: {
									id: "",
									firstName: "",
									lastName: "",
									birthDate: "",
									allergies: null,
									medicalNotes: null,
								},
						parent: item.parent
							? {
									id: item.parent.id,
									name: item.parent.name || "",
									email: item.parent.email,
									phoneNumber: item.parent.phoneNumber,
								}
							: {
									id: "",
									name: "",
									email: "",
									phoneNumber: null,
								},
						event: item.event
							? {
									id: item.event.id,
									title: item.event.title,
									startDate: new Date(item.event.startDate).toISOString(),
									endDate: item.event.endDate
										? new Date(item.event.endDate).toISOString()
										: null,
									price: item.event.price,
								}
							: {
									id: "",
									title: "",
									startDate: "",
									endDate: null,
									price: null,
								},
						family: item.family
							? {
									id: item.family.id,
									name: item.family.name,
								}
							: {
									id: "",
									name: "",
								},
						authorizedPersons: authorizedPersonsData
							.filter((item) => item.person)
							.map((item) => ({
								id: item.person!.id,
								fullName: item.person!.fullName,
								relationship: item.person!.relationship,
								phone: item.person!.phone,
								email: item.person!.email,
							})),
					},
				};
			} catch (error) {
				console.error("Error fetching registration:", error);
				if (error instanceof ORPCError) throw error;
				throw new ORPCError("INTERNAL_SERVER_ERROR", {
					message: "Failed to fetch registration",
				});
			}
		}),

	// Create registration
	create: withAuth
		.input(
			z.object({
				eventId: z.string(),
				childId: z.string(),
				notes: z.string().optional(),
				photoPrivacyConsent: z.boolean().default(true),
				dataPrivacyConsent: z.boolean().default(true),
				canExitAlone: z.boolean().default(false),
				allowedExitLocations: z.array(z.string()).optional(),
				authorizedPersonIds: z.array(z.string()).optional(),
				locationAuthorizations: z
					.array(
						z.object({
							authorizedPersonId: z.string(),
							location: z.string(),
							canPickup: z.boolean().default(true),
						}),
					)
					.optional(),
			}),
		)
		.output(
			SuccessResponse(
				z.object({
					id: z.string(),
					eventId: z.string(),
					childId: z.string(),
				}),
			),
		)
		.handler(async ({ input, context }) => {
			const registrationId = nanoid();
			const userId = context.user.id;

			try {
				// Verify child belongs to user's family
				const childFamily = await db
					.select()
					.from(children)
					.leftJoin(
						familyMembers,
						eq(children.familyId, familyMembers.familyId),
					)
					.where(
						and(
							eq(children.id, input.childId),
							eq(familyMembers.userId, userId),
						),
					)
					.limit(1);

				if (!childFamily[0]) {
					throw new ORPCError("FORBIDDEN", {
						message: "Child not found or not accessible",
					});
				}

				await db.insert(eventRegistrations).values({
					id: registrationId,
					eventId: input.eventId,
					childId: input.childId,
					parentId: userId,
					status: "pending",
					notes: input.notes || null,
					photoPrivacyConsent: input.photoPrivacyConsent,
					dataPrivacyConsent: input.dataPrivacyConsent,
					canExitAlone: input.canExitAlone,
					allowedExitLocations: input.allowedExitLocations
						? JSON.stringify(input.allowedExitLocations)
						: null,
					registrationDate: new Date(),
				});

				// Handle authorized persons for pickup
				if (input.authorizedPersonIds && input.authorizedPersonIds.length > 0) {
					const authorizedPersonsData = input.authorizedPersonIds.map(
						(personId) => ({
							id: nanoid(),
							registrationId,
							authorizedPersonId: personId,
						}),
					);
					await db
						.insert(registrationAuthorizedPersons)
						.values(authorizedPersonsData);
				}

				// Handle location-specific authorizations
				if (
					input.locationAuthorizations &&
					input.locationAuthorizations.length > 0
				) {
					const locationAuthData = input.locationAuthorizations.map((auth) => ({
						id: nanoid(),
						registrationId,
						authorizedPersonId: auth.authorizedPersonId,
						location: auth.location,
						canPickup: auth.canPickup,
					}));
					await db
						.insert(registrationLocationAuthorizations)
						.values(locationAuthData);
				}

				return {
					success: true,
					data: {
						id: registrationId,
						eventId: input.eventId,
						childId: input.childId,
					},
				};
			} catch (error) {
				console.error("Error creating registration:", error);
				if (error instanceof ORPCError) throw error;
				throw new ORPCError("INTERNAL_SERVER_ERROR", {
					message: "Failed to create registration",
				});
			}
		}),

	// Update registration status
	updateStatus: withAuth
		.input(
			z.object({
				id: z.string(),
				status: z
					.enum(["pending", "confirmed", "cancelled", "waitlist"])
					.optional(),
				paymentStatus: z
					.enum(["pending", "completed", "failed", "refunded"])
					.optional(),
				notes: z.string().optional(),
				photoPrivacyConsent: z.boolean().optional(),
				dataPrivacyConsent: z.boolean().optional(),
			}),
		)
		.output(
			SuccessResponse(
				z.object({
					id: z.string(),
					status: z.enum(["pending", "confirmed", "cancelled", "waitlist"]),
					paymentStatus: z.enum(["pending", "completed", "failed", "refunded"]),
				}),
			),
		)
		.handler(async ({ input }) => {
			try {
				const updateData: any = {
					updatedAt: new Date(),
				};

				if (input.status !== undefined) {
					updateData.status = input.status;
				}

				if (input.paymentStatus !== undefined) {
					updateData.paymentStatus = input.paymentStatus;
				}

				if (input.notes !== undefined) {
					updateData.notes = input.notes;
				}

				if (input.photoPrivacyConsent !== undefined) {
					updateData.photoPrivacyConsent = input.photoPrivacyConsent;
				}

				if (input.dataPrivacyConsent !== undefined) {
					updateData.dataPrivacyConsent = input.dataPrivacyConsent;
				}

				const [updatedRegistration] = await db
					.update(eventRegistrations)
					.set(updateData)
					.where(eq(eventRegistrations.id, input.id))
					.returning();

				return {
					success: true,
					data: {
						id: input.id,
						status: updatedRegistration.status,
						paymentStatus: updatedRegistration.paymentStatus,
					},
				};
			} catch (error) {
				console.error("Error updating registration:", error);
				throw new ORPCError("INTERNAL_SERVER_ERROR", {
					message: "Failed to update registration",
				});
			}
		}),

	// Admin endpoint to manually create registration with optional family/child creation
	adminCreate: withAuth
		.input(
			z.object({
				eventId: z.string(),
				// Parent/Family data
				parentEmail: z.string().email(),
				parentName: z.string().min(1),
				parentPhone: z.string().optional(),
				// Family data (if new family needs to be created)
				familyName: z.string().optional(),
				createNewFamily: z.boolean().default(false),
				familyId: z.string().optional(), // If adding to existing family
				// Child data
				childFirstName: z.string().min(1),
				childLastName: z.string().min(1),
				childBirthDate: z.string(), // ISO date string
				childBirthPlace: z.string().optional(),
				childFiscalCode: z.string().min(1, "Codice fiscale è obbligatorio"),
				childGender: z.enum(["M", "F"]).optional(),
				childAllergies: z.string().optional(),
				childMedicalNotes: z.string().optional(),
				// Registration data
				notes: z.string().optional(),
				photoPrivacyConsent: z.boolean().default(true),
				dataPrivacyConsent: z.boolean().default(true),
				status: z
					.enum(["pending", "confirmed", "cancelled", "waitlist"])
					.default("confirmed"),
				paymentStatus: z
					.enum(["pending", "completed", "failed", "refunded"])
					.default("pending"),
			}),
		)
		.output(
			SuccessResponse(
				z.object({
					registrationId: z.string(),
					familyId: z.string(),
					childId: z.string(),
					parentId: z.string(),
					created: z.object({
						user: z.boolean(),
						family: z.boolean(),
						child: z.boolean(),
					}),
				}),
			),
		)
		.handler(async ({ input, context }) => {
			try {
				// Check if user is admin
				const membership = await db
					.select()
					.from(organizationMember)
					.where(eq(organizationMember.userId, context.user.id))
					.limit(1);

				const isAdmin =
					membership.length > 0 &&
					["amministratore", "editor", "animatore"].includes(
						membership[0].role,
					);

				if (!isAdmin) {
					throw new ORPCError("FORBIDDEN", {
						message: "Access denied. Admin privileges required.",
					});
				}

				const registrationId = nanoid();
				let parentId: string;
				let familyId: string;
				let childId: string;
				const created = {
					user: false,
					family: false,
					child: true, // Child is always created
				};

				// 1. Check if parent user exists, create if not
				const existingUser = await db
					.select()
					.from(userTable)
					.where(eq(userTable.email, input.parentEmail))
					.limit(1);

				if (existingUser.length > 0) {
					parentId = existingUser[0].id;
				} else {
					// Create new user
					parentId = nanoid();
					await db.insert(userTable).values({
						id: parentId,
						name: input.parentName,
						email: input.parentEmail,
						phoneNumber: input.parentPhone || null,
						emailVerified: false,
					});
					created.user = true;
				}

				// 2. Handle family creation/selection
				if (input.createNewFamily || !input.familyId) {
					// Create new family
					familyId = nanoid();
					const memberId = nanoid();

					await db.insert(families).values({
						id: familyId,
						name: input.familyName || `Famiglia ${input.childLastName}`,
						createdBy: context.user.id,
					});

					// Add parent to family
					await db.insert(familyMembers).values({
						id: memberId,
						familyId,
						userId: parentId,
						role: "parent",
						isAdmin: false,
					});

					created.family = true;
				} else {
					// Use existing family
					familyId = input.familyId;

					// Check if parent is already a member of this family
					const existingMembership = await db
						.select()
						.from(familyMembers)
						.where(
							and(
								eq(familyMembers.familyId, familyId),
								eq(familyMembers.userId, parentId),
							),
						)
						.limit(1);

					if (existingMembership.length === 0) {
						// Add parent to family
						const memberId = nanoid();
						await db.insert(familyMembers).values({
							id: memberId,
							familyId,
							userId: parentId,
							role: "parent",
							isAdmin: false,
						});
					}
				}

				// 3. Create child
				childId = nanoid();
				await db.insert(children).values({
					id: childId,
					familyId,
					firstName: input.childFirstName,
					lastName: input.childLastName,
					birthDate: input.childBirthDate,
					birthPlace: input.childBirthPlace || null,
					fiscalCode: input.childFiscalCode,
					gender: input.childGender || null,
					allergies: input.childAllergies || null,
					medicalNotes: input.childMedicalNotes || null,
				});

				// 4. Create registration
				await db.insert(eventRegistrations).values({
					id: registrationId,
					eventId: input.eventId,
					childId,
					parentId,
					status: input.status,
					paymentStatus: input.paymentStatus,
					notes: input.notes || null,
					photoPrivacyConsent: input.photoPrivacyConsent,
					dataPrivacyConsent: input.dataPrivacyConsent,
					registrationDate: new Date(),
				});

				// 5. Update event participant count if confirmed
				if (input.status === "confirmed") {
					await db
						.update(events)
						.set({
							currentParticipants: sql`${events.currentParticipants} + 1`,
							updatedAt: new Date(),
						})
						.where(eq(events.id, input.eventId));
				}

				return {
					success: true,
					data: {
						registrationId,
						familyId,
						childId,
						parentId,
						created,
					},
				};
			} catch (error) {
				console.error("Error creating admin registration:", error);
				if (error instanceof ORPCError) throw error;
				throw new ORPCError("INTERNAL_SERVER_ERROR", {
					message: "Failed to create registration",
				});
			}
		}),
});
