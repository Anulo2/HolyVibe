import { ORPCError, os } from "@orpc/server";
import { and, desc, eq, gte, inArray, like, lte, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod";
import { auth } from "../auth";
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
	user as userTable,
} from "../db/schema";

// Auth middleware for oRPC
const withAuth = os.use(async ({ context, next }) => {
	const request = context.request as Request;

	try {
		const session = await auth.api.getSession({
			headers: request.headers,
		});

		if (!session?.user) {
			throw new ORPCError("UNAUTHORIZED", "Authentication required");
		}

		return next({
			context: {
				user: session.user,
				session: session.session,
			},
		});
	} catch (error) {
		console.error("Auth middleware error:", error);
		throw new ORPCError("UNAUTHORIZED", "Authentication failed");
	}
});

// Helper to check if user is member of family
const checkFamilyMembership = async (familyId: string, userId: string) => {
	const membership = await db
		.select()
		.from(familyMembers)
		.where(
			and(
				eq(familyMembers.familyId, familyId),
				eq(familyMembers.userId, userId),
			),
		)
		.limit(1);

	if (membership.length === 0) {
		throw new ORPCError("FORBIDDEN", "Access denied to this family");
	}

	return membership[0];
};

// Success response helper
const SuccessResponse = <T extends z.ZodType>(data: T) =>
	z.object({
		success: z.boolean(),
		data,
	});

// Schema definitions
const Family = z.object({
	id: z.string(),
	name: z.string(),
	description: z.string().nullable(),
	createdBy: z.string(),
	createdAt: z.string(),
	updatedAt: z.string(),
});

const Child = z.object({
	id: z.string(),
	familyId: z.string(),
	firstName: z.string(),
	lastName: z.string(),
	birthDate: z.string(),
	birthPlace: z.string().nullable(),
	fiscalCode: z.string().nullable(),
	gender: z.enum(["M", "F", "O"]).nullable(),
	allergies: z.string().nullable(),
	medicalNotes: z.string().nullable(),
	avatarUrl: z.string().nullable(),
	createdAt: z.string(),
	updatedAt: z.string(),
});

const AuthorizedPerson = z.object({
	id: z.string(),
	familyId: z.string(),
	fullName: z.string(),
	relationship: z.string(),
	phone: z.string().nullable(),
	email: z.string().nullable(),
	avatarUrl: z.string().nullable(),
	isActive: z.boolean(),
	createdAt: z.string(),
	updatedAt: z.string(),
});

const Event = z.object({
	id: z.string(),
	title: z.string(),
	description: z.string().nullable(),
	startDate: z.string(),
	endDate: z.string().nullable(),
	location: z.string().nullable(),
	minAge: z.number().nullable(),
	maxAge: z.number().nullable(),
	maxParticipants: z.number().nullable(),
	currentParticipants: z.number(),
	price: z.string().nullable(),
	status: z.enum(["draft", "open", "closed", "full", "cancelled"]),
	imageUrl: z.string().nullable(),
	createdBy: z.string(),
	createdAt: z.string(),
	updatedAt: z.string(),
});

const User = z.object({
	id: z.string(),
	name: z.string(),
	email: z.string(),
	phone: z.string().nullable(),
	birthDate: z.string().nullable(),
	avatarUrl: z.string().nullable(),
	createdAt: z.string(),
	updatedAt: z.string(),
});

const Registration = z.object({
	id: z.string(),
	eventId: z.string(),
	childId: z.string(),
	parentId: z.string(),
	status: z.enum(["pending", "confirmed", "cancelled", "waitlist"]),
	paymentStatus: z.enum(["pending", "completed", "failed", "refunded"]),
	registrationDate: z.string(),
	notes: z.string().nullable(),
	createdAt: z.string(),
	updatedAt: z.string(),
});

const RegistrationWithDetails = z.object({
	id: z.string(),
	eventId: z.string(),
	status: z.enum(["pending", "confirmed", "cancelled", "waitlist"]),
	paymentStatus: z.enum(["pending", "completed", "failed", "refunded"]),
	registrationDate: z.string(),
	notes: z.string().nullable(),
	createdAt: z.string(),
	updatedAt: z.string(),
	child: z.object({
		id: z.string(),
		firstName: z.string(),
		lastName: z.string(),
		birthDate: z.string(),
		allergies: z.string().nullable(),
		medicalNotes: z.string().nullable(),
	}),
	parent: z.object({
		id: z.string(),
		name: z.string(),
		email: z.string(),
		phoneNumber: z.string().nullable(),
	}),
	event: z.object({
		id: z.string(),
		title: z.string(),
		startDate: z.string(),
		endDate: z.string().nullable(),
		price: z.string().nullable(),
	}),
	family: z.object({
		id: z.string(),
		name: z.string(),
	}),
	authorizedPersons: z.array(
		z.object({
			id: z.string(),
			fullName: z.string(),
			relationship: z.string(),
			phone: z.string().nullable(),
			email: z.string().nullable(),
		}),
	),
});

const Invitation = z.object({
	id: z.string(),
	familyId: z.string(),
	email: z.string(),
	invitedBy: z.string(),
	message: z.string().nullable(),
	status: z.enum(["pending", "accepted", "rejected", "expired"]),
	token: z.string(),
	expiresAt: z.string(),
	acceptedAt: z.string().nullable(),
	createdAt: z.string(),
	updatedAt: z.string(),
});

// Create oRPC router using proper structure
export const router = os.router({
	family: os.router({
		// Get user's families
		list: withAuth
			.output(
				SuccessResponse(
					z.array(
						z.object({
							family: Family.extend({
								_count: z.object({
									children: z.number(),
									authorizedPersons: z.number(),
								}),
							}),
							member: z.object({
								id: z.string(),
								familyId: z.string(),
								userId: z.string(),
								role: z.enum(["parent", "guardian"]),
								isAdmin: z.boolean(),
								joinedAt: z.string(),
								createdAt: z.string(),
								updatedAt: z.string(),
							}),
						}),
					),
				),
			)
			.handler(async ({ context }) => {
				try {
					const userFamilies = await db
						.select({
							family: families,
							member: familyMembers,
						})
						.from(familyMembers)
						.leftJoin(families, eq(familyMembers.familyId, families.id))
						.where(eq(familyMembers.userId, context.user.id));

					// Get counts for each family
					const familyIds = userFamilies.map((item) => item.family!.id);

					let childrenCounts: { familyId: string; count: number }[] = [];
					let authorizedPersonsCounts: { familyId: string; count: number }[] =
						[];

					if (familyIds.length > 0) {
						childrenCounts = await db
							.select({
								familyId: children.familyId,
								count: sql<number>`count(*)`.as("count"),
							})
							.from(children)
							.where(inArray(children.familyId, familyIds))
							.groupBy(children.familyId);

						authorizedPersonsCounts = await db
							.select({
								familyId: authorizedPersons.familyId,
								count: sql<number>`count(*)`.as("count"),
							})
							.from(authorizedPersons)
							.where(inArray(authorizedPersons.familyId, familyIds))
							.groupBy(authorizedPersons.familyId);
					}

					// Create count maps for quick lookup
					const childrenCountMap = new Map(
						childrenCounts.map((item) => [item.familyId, item.count]),
					);
					const personsCountMap = new Map(
						authorizedPersonsCounts.map((item) => [item.familyId, item.count]),
					);

					return {
						success: true,
						data: userFamilies.map((item) => ({
							family: {
								...item.family!,
								_count: {
									children: childrenCountMap.get(item.family!.id) || 0,
									authorizedPersons: personsCountMap.get(item.family!.id) || 0,
								},
								createdAt: new Date(item.family!.createdAt).toISOString(),
								updatedAt: new Date(item.family!.updatedAt).toISOString(),
							},
							member: {
								...item.member,
								joinedAt: new Date(item.member.joinedAt).toISOString(),
								createdAt: new Date(item.member.createdAt).toISOString(),
								updatedAt: new Date(item.member.updatedAt).toISOString(),
							},
						})),
					};
				} catch (error) {
					console.error("Error fetching families:", error);
					throw new ORPCError(
						"INTERNAL_SERVER_ERROR",
						"Failed to fetch families",
					);
				}
			}),

		// Create family
		create: withAuth
			.input(
				z.object({
					name: z.string().min(1).max(100),
					description: z.string().max(500).optional(),
				}),
			)
			.output(
				SuccessResponse(
					z.object({
						id: z.string(),
						name: z.string(),
					}),
				),
			)
			.handler(async ({ input, context }) => {
				const userId = context.user.id;
				const familyId = nanoid();
				const memberId = nanoid();

				try {
					await db.insert(families).values({
						id: familyId,
						name: input.name,
						description: input.description || null,
						createdBy: userId,
					});

					await db.insert(familyMembers).values({
						id: memberId,
						familyId,
						userId,
						role: "parent",
						isAdmin: true,
					});

					return {
						success: true,
						data: { id: familyId, name: input.name },
					};
				} catch (error) {
					console.error("Error creating family:", error);
					throw new ORPCError(
						"INTERNAL_SERVER_ERROR",
						"Failed to create family",
					);
				}
			}),

		// Get children in family
		getChildren: withAuth
			.input(
				z.object({
					familyId: z.string(),
				}),
			)
			.output(SuccessResponse(z.array(Child)))
			.handler(async ({ input, context }) => {
				await checkFamilyMembership(input.familyId, context.user.id);

				try {
					const familyChildren = await db
						.select()
						.from(children)
						.where(eq(children.familyId, input.familyId));

					return {
						success: true,
						data: familyChildren.map((child) => ({
							...child,
							createdAt: new Date(child.createdAt).toISOString(),
							updatedAt: new Date(child.updatedAt).toISOString(),
						})),
					};
				} catch (error) {
					console.error("Error fetching children:", error);
					throw new ORPCError(
						"INTERNAL_SERVER_ERROR",
						"Failed to fetch children",
					);
				}
			}),

		// Add child to family
		addChild: withAuth
			.input(
				z.object({
					familyId: z.string(),
					firstName: z.string().min(1).max(50),
					lastName: z.string().min(1).max(50),
					birthDate: z.string(), // ISO date string
					birthPlace: z.string().max(100).optional(),
					fiscalCode: z.string().max(16).optional(),
					gender: z.enum(["M", "F", "O"]).optional(),
					allergies: z.string().max(1000).optional(),
					medicalNotes: z.string().max(1000).optional(),
				}),
			)
			.output(SuccessResponse(Child))
			.handler(async ({ input, context }) => {
				await checkFamilyMembership(input.familyId, context.user.id);

				const childId = nanoid();

				try {
					await db.insert(children).values({
						id: childId,
						familyId: input.familyId,
						firstName: input.firstName,
						lastName: input.lastName,
						birthDate: input.birthDate,
						birthPlace: input.birthPlace || null,
						fiscalCode: input.fiscalCode || null,
						gender: input.gender || null,
						allergies: input.allergies || null,
						medicalNotes: input.medicalNotes || null,
						avatarUrl: null,
					});

					const newChild = await db
						.select()
						.from(children)
						.where(eq(children.id, childId))
						.limit(1);

					return {
						success: true,
						data: {
							...newChild[0],
							createdAt: new Date(newChild[0].createdAt).toISOString(),
							updatedAt: new Date(newChild[0].updatedAt).toISOString(),
						},
					};
				} catch (error) {
					console.error("Error adding child:", error);
					throw new ORPCError("INTERNAL_SERVER_ERROR", "Failed to add child");
				}
			}),

		// Get authorized persons in family
		getAuthorizedPersons: withAuth
			.input(
				z.object({
					familyId: z.string(),
				}),
			)
			.output(SuccessResponse(z.array(AuthorizedPerson)))
			.handler(async ({ input, context }) => {
				await checkFamilyMembership(input.familyId, context.user.id);

				try {
					const persons = await db
						.select()
						.from(authorizedPersons)
						.where(eq(authorizedPersons.familyId, input.familyId));

					return {
						success: true,
						data: persons.map((person) => ({
							...person,
							createdAt: new Date(person.createdAt).toISOString(),
							updatedAt: new Date(person.updatedAt).toISOString(),
						})),
					};
				} catch (error) {
					console.error("Error fetching authorized persons:", error);
					throw new ORPCError(
						"INTERNAL_SERVER_ERROR",
						"Failed to fetch authorized persons",
					);
				}
			}),

		// Add authorized person to family
		addAuthorizedPerson: withAuth
			.input(
				z.object({
					familyId: z.string(),
					fullName: z.string().min(1).max(100),
					relationship: z.string().min(1).max(50),
					phone: z.string().max(20).optional(),
					email: z.preprocess(
						(val) =>
							typeof val === "string" && val.trim() === "" ? undefined : val,
						z.string().email().max(100).optional(),
					),
				}),
			)
			.output(SuccessResponse(AuthorizedPerson))
			.handler(async ({ input, context }) => {
				await checkFamilyMembership(input.familyId, context.user.id);

				const personId = nanoid();

				try {
					await db.insert(authorizedPersons).values({
						id: personId,
						familyId: input.familyId,
						fullName: input.fullName,
						relationship: input.relationship,
						phone: input.phone || null,
						email: input.email || null,
						avatarUrl: null,
						isActive: true,
					});

					const newPerson = await db
						.select()
						.from(authorizedPersons)
						.where(eq(authorizedPersons.id, personId))
						.limit(1);

					return {
						success: true,
						data: {
							...newPerson[0],
							createdAt: new Date(newPerson[0].createdAt).toISOString(),
							updatedAt: new Date(newPerson[0].updatedAt).toISOString(),
						},
					};
				} catch (error) {
					console.error("Error adding authorized person:", error);
					throw new ORPCError(
						"INTERNAL_SERVER_ERROR",
						"Failed to add authorized person",
					);
				}
			}),

		// Update authorized person
		updateAuthorizedPerson: withAuth
			.input(
				z.object({
					id: z.string(),
					fullName: z.string().min(1).max(100).optional(),
					relationship: z.string().min(1).max(50).optional(),
					phone: z.string().max(20).optional(),
					email: z.preprocess(
						(val) =>
							typeof val === "string" && val.trim() === "" ? undefined : val,
						z.string().email().max(100).optional(),
					),
				}),
			)
			.output(SuccessResponse(AuthorizedPerson))
			.handler(async ({ input, context }) => {
				// First, get the authorized person to check family membership
				const person = await db
					.select()
					.from(authorizedPersons)
					.where(eq(authorizedPersons.id, input.id))
					.limit(1);

				if (person.length === 0) {
					throw new ORPCError("NOT_FOUND", "Authorized person not found");
				}

				await checkFamilyMembership(person[0].familyId, context.user.id);

				try {
					const updateData: any = {
						updatedAt: new Date(),
					};

					// Only include fields that are explicitly provided
					if (input.fullName !== undefined) {
						updateData.fullName = input.fullName;
					}
					if (input.relationship !== undefined) {
						updateData.relationship = input.relationship;
					}
					if (input.phone !== undefined) {
						updateData.phone = input.phone || null;
					}
					if (input.email !== undefined) {
						updateData.email = input.email || null;
					}

					await db
						.update(authorizedPersons)
						.set(updateData)
						.where(eq(authorizedPersons.id, input.id));

					const updatedPerson = await db
						.select()
						.from(authorizedPersons)
						.where(eq(authorizedPersons.id, input.id))
						.limit(1);

					if (updatedPerson.length === 0) {
						throw new ORPCError(
							"NOT_FOUND",
							"Authorized person not found after update",
						);
					}

					return {
						success: true,
						data: {
							...updatedPerson[0],
							createdAt: new Date(updatedPerson[0].createdAt).toISOString(),
							updatedAt: new Date(updatedPerson[0].updatedAt).toISOString(),
						},
					};
				} catch (error) {
					console.error("Error updating authorized person:", error);
					throw new ORPCError(
						"INTERNAL_SERVER_ERROR",
						"Failed to update authorized person",
					);
				}
			}),

		// Update family
		updateFamily: withAuth
			.input(
				z.object({
					id: z.string(),
					name: z.string().min(1).max(100).optional(),
					description: z.string().max(500).optional(),
				}),
			)
			.output(SuccessResponse(Family))
			.handler(async ({ input, context }) => {
				await checkFamilyMembership(input.id, context.user.id);

				try {
					const updateData: any = {
						updatedAt: new Date(),
					};

					if (input.name !== undefined) {
						updateData.name = input.name;
					}
					if (input.description !== undefined) {
						updateData.description = input.description;
					}

					await db
						.update(families)
						.set(updateData)
						.where(eq(families.id, input.id));

					const updatedFamily = await db
						.select()
						.from(families)
						.where(eq(families.id, input.id))
						.limit(1);

					return {
						success: true,
						data: {
							...updatedFamily[0],
							createdAt: new Date(updatedFamily[0].createdAt).toISOString(),
							updatedAt: new Date(updatedFamily[0].updatedAt).toISOString(),
						},
					};
				} catch (error) {
					console.error("Error updating family:", error);
					throw new ORPCError(
						"INTERNAL_SERVER_ERROR",
						"Failed to update family",
					);
				}
			}),

		// Update child
		updateChild: withAuth
			.input(
				z.object({
					id: z.string(),
					firstName: z.string().min(1).max(50).optional(),
					lastName: z.string().min(1).max(50).optional(),
					birthDate: z.string().optional(), // ISO date string
					birthPlace: z.string().max(100).optional(),
					fiscalCode: z.string().max(16).optional(),
					gender: z.enum(["M", "F", "O"]).optional(),
					allergies: z.string().max(1000).optional(),
					medicalNotes: z.string().max(1000).optional(),
				}),
			)
			.output(SuccessResponse(Child))
			.handler(async ({ input, context }) => {
				// First, get the child to check family membership
				const child = await db
					.select()
					.from(children)
					.where(eq(children.id, input.id))
					.limit(1);

				if (child.length === 0) {
					throw new ORPCError("NOT_FOUND", "Child not found");
				}

				await checkFamilyMembership(child[0].familyId, context.user.id);

				try {
					const updateData: any = {
						updatedAt: new Date(),
					};

					// Only include fields that are explicitly provided
					if (input.firstName !== undefined) {
						updateData.firstName = input.firstName;
					}
					if (input.lastName !== undefined) {
						updateData.lastName = input.lastName;
					}
					if (input.birthDate !== undefined) {
						updateData.birthDate = input.birthDate;
					}
					if (input.birthPlace !== undefined) {
						updateData.birthPlace = input.birthPlace || null;
					}
					if (input.fiscalCode !== undefined) {
						updateData.fiscalCode = input.fiscalCode || null;
					}
					if (input.gender !== undefined) {
						updateData.gender = input.gender || null;
					}
					if (input.allergies !== undefined) {
						updateData.allergies = input.allergies || null;
					}
					if (input.medicalNotes !== undefined) {
						updateData.medicalNotes = input.medicalNotes || null;
					}

					console.log("Updating child with data:", updateData);

					await db
						.update(children)
						.set(updateData)
						.where(eq(children.id, input.id));

					const updatedChild = await db
						.select()
						.from(children)
						.where(eq(children.id, input.id))
						.limit(1);

					if (updatedChild.length === 0) {
						throw new ORPCError("NOT_FOUND", "Child not found after update");
					}

					return {
						success: true,
						data: {
							...updatedChild[0],
							createdAt: new Date(updatedChild[0].createdAt).toISOString(),
							updatedAt: new Date(updatedChild[0].updatedAt).toISOString(),
						},
					};
				} catch (error) {
					console.error("Error updating child:", error);
					console.error("Update data was:", input);
					throw new ORPCError(
						"INTERNAL_SERVER_ERROR",
						`Failed to update child: ${error.message}`,
					);
				}
			}),

		// Send family invitation
		sendInvitation: withAuth
			.input(
				z.object({
					familyId: z.string(),
					email: z.string().email(),
					message: z.string().max(500).optional(),
				}),
			)
			.output(
				SuccessResponse(
					z.object({
						id: z.string(),
						email: z.string(),
						expiresAt: z.string(),
					}),
				),
			)
			.handler(async ({ input, context }) => {
				await checkFamilyMembership(input.familyId, context.user.id);

				try {
					// Check if user is already invited and pending
					const existingInvitation = await db
						.select()
						.from(invitations)
						.where(
							and(
								eq(invitations.familyId, input.familyId),
								eq(invitations.email, input.email),
								eq(invitations.status, "pending"),
							),
						)
						.limit(1);

					if (existingInvitation.length > 0) {
						throw new ORPCError(
							"CONFLICT",
							"User already has a pending invitation to this family",
						);
					}

					// Check if user is already a member of the family
					const existingUser = await db
						.select()
						.from(userTable)
						.where(eq(userTable.email, input.email))
						.limit(1);

					if (existingUser.length > 0) {
						const existingMember = await db
							.select()
							.from(familyMembers)
							.where(
								and(
									eq(familyMembers.familyId, input.familyId),
									eq(familyMembers.userId, existingUser[0].id),
								),
							)
							.limit(1);

						if (existingMember.length > 0) {
							throw new ORPCError(
								"CONFLICT",
								"User is already a member of this family",
							);
						}
					}

					const invitationId = nanoid();
					const token = nanoid(32);
					const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

					await db.insert(invitations).values({
						id: invitationId,
						familyId: input.familyId,
						email: input.email,
						invitedBy: context.user.id,
						message: input.message || null,
						token,
						expiresAt,
					});

					return {
						success: true,
						data: {
							id: invitationId,
							email: input.email,
							expiresAt: expiresAt.toISOString(),
						},
					};
				} catch (error) {
					console.error("Error sending invitation:", error);
					throw new ORPCError(
						"INTERNAL_SERVER_ERROR",
						"Failed to send invitation",
					);
				}
			}),

		// Get family invitations
		getInvitations: withAuth
			.input(
				z.object({
					familyId: z.string(),
				}),
			)
			.output(SuccessResponse(z.array(Invitation)))
			.handler(async ({ input, context }) => {
				await checkFamilyMembership(input.familyId, context.user.id);

				try {
					const familyInvitations = await db
						.select()
						.from(invitations)
						.where(eq(invitations.familyId, input.familyId))
						.orderBy(desc(invitations.createdAt));

					return {
						success: true,
						data: familyInvitations.map((invitation) => ({
							...invitation,
							expiresAt: new Date(invitation.expiresAt).toISOString(),
							acceptedAt: invitation.acceptedAt
								? new Date(invitation.acceptedAt).toISOString()
								: null,
							createdAt: new Date(invitation.createdAt).toISOString(),
							updatedAt: new Date(invitation.updatedAt).toISOString(),
						})),
					};
				} catch (error) {
					console.error("Error fetching invitations:", error);
					throw new ORPCError(
						"INTERNAL_SERVER_ERROR",
						"Failed to fetch invitations",
					);
				}
			}),

		// Accept family invitation
		acceptInvitation: withAuth
			.input(
				z.object({
					token: z.string(),
				}),
			)
			.output(
				SuccessResponse(
					z.object({
						familyId: z.string(),
						familyName: z.string(),
					}),
				),
			)
			.handler(async ({ input, context }) => {
				try {
					// Find invitation by token
					const invitation = await db
						.select({
							invitation: invitations,
							family: families,
						})
						.from(invitations)
						.leftJoin(families, eq(invitations.familyId, families.id))
						.where(
							and(
								eq(invitations.token, input.token),
								eq(invitations.status, "pending"),
							),
						)
						.limit(1);

					if (invitation.length === 0) {
						throw new ORPCError("NOT_FOUND", "Invalid or expired invitation");
					}

					const invitationData = invitation[0].invitation;
					const familyData = invitation[0].family!;

					// Check if invitation is expired
					if (new Date() > new Date(invitationData.expiresAt)) {
						// Mark as expired
						await db
							.update(invitations)
							.set({ status: "expired", updatedAt: new Date() })
							.where(eq(invitations.id, invitationData.id));

						throw new ORPCError("GONE", "Invitation has expired");
					}

					// Check if invited email matches current user
					if (invitationData.email !== context.user.email) {
						throw new ORPCError(
							"FORBIDDEN",
							"This invitation is for a different email address",
						);
					}

					// Check if user is already a member
					const existingMember = await db
						.select()
						.from(familyMembers)
						.where(
							and(
								eq(familyMembers.familyId, invitationData.familyId),
								eq(familyMembers.userId, context.user.id),
							),
						)
						.limit(1);

					if (existingMember.length > 0) {
						throw new ORPCError("CONFLICT", "Already a member of this family");
					}

					// Add user to family
					const memberId = nanoid();
					await db.insert(familyMembers).values({
						id: memberId,
						familyId: invitationData.familyId,
						userId: context.user.id,
						role: "parent",
						isAdmin: false,
					});

					// Mark invitation as accepted
					await db
						.update(invitations)
						.set({
							status: "accepted",
							acceptedAt: new Date(),
							updatedAt: new Date(),
						})
						.where(eq(invitations.id, invitationData.id));

					return {
						success: true,
						data: {
							familyId: invitationData.familyId,
							familyName: familyData.name,
						},
					};
				} catch (error) {
					console.error("Error accepting invitation:", error);
					throw new ORPCError(
						"INTERNAL_SERVER_ERROR",
						"Failed to accept invitation",
					);
				}
			}),

		// Cancel family invitation (for family admins)
		cancelInvitation: withAuth
			.input(
				z.object({
					invitationId: z.string(),
				}),
			)
			.output(SuccessResponse(z.boolean()))
			.handler(async ({ input, context }) => {
				try {
					// Find invitation
					const invitation = await db
						.select()
						.from(invitations)
						.where(eq(invitations.id, input.invitationId))
						.limit(1);

					if (invitation.length === 0) {
						throw new ORPCError("NOT_FOUND", "Invitation not found");
					}

					// Check if user is member of the family (and can cancel invitations)
					await checkFamilyMembership(invitation[0].familyId, context.user.id);

					// Cancel invitation
					await db
						.delete(invitations)
						.where(eq(invitations.id, input.invitationId));

					return {
						success: true,
						data: true,
					};
				} catch (error) {
					console.error("Error canceling invitation:", error);
					throw new ORPCError(
						"INTERNAL_SERVER_ERROR",
						"Failed to cancel invitation",
					);
				}
			}),
	}),

	events: os.router({
		// Get events list
		list: withAuth
			.input(
				z.object({
					limit: z.number().min(1).max(100).default(20),
					offset: z.number().min(0).default(0),
					minAge: z.number().min(0).optional(),
					maxAge: z.number().min(0).max(100).optional(),
					search: z.string().max(100).optional(),
				}),
			)
			.output(SuccessResponse(z.array(Event)))
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

					let query = db.select().from(events);
					const conditions = [];

					// Show only open events to non-admin users
					if (!isAdmin) {
						conditions.push(eq(events.status, "open"));
					}

					// Add search filter
					if (input.search) {
						conditions.push(like(events.title, `%${input.search}%`));
					}

					// Add age filters
					if (input.minAge !== undefined) {
						conditions.push(gte(events.maxAge, input.minAge));
					}

					if (input.maxAge !== undefined) {
						conditions.push(lte(events.minAge, input.maxAge));
					}

					// Apply all conditions
					if (conditions.length > 0) {
						query = query.where(and(...conditions)) as any;
					}

					const eventsList = await query
						.orderBy(desc(events.startDate))
						.limit(input.limit)
						.offset(input.offset);

					return {
						success: true,
						data: eventsList.map((event) => ({
							...event,
							createdAt: new Date(event.createdAt).toISOString(),
							updatedAt: new Date(event.updatedAt).toISOString(),
							startDate: new Date(event.startDate).toISOString(),
							endDate: event.endDate
								? new Date(event.endDate).toISOString()
								: null,
						})),
					};
				} catch (error) {
					console.error("Error fetching events:", error);
					throw new ORPCError(
						"INTERNAL_SERVER_ERROR",
						"Failed to fetch events",
					);
				}
			}),

		// Get single event
		get: withAuth
			.input(
				z.object({
					id: z.string(),
				}),
			)
			.output(SuccessResponse(Event))
			.handler(async ({ input }) => {
				try {
					const event = await db
						.select()
						.from(events)
						.where(eq(events.id, input.id))
						.limit(1);

					if (event.length === 0) {
						throw new ORPCError("NOT_FOUND", "Event not found");
					}

					return {
						success: true,
						data: {
							...event[0],
							createdAt: new Date(event[0].createdAt).toISOString(),
							updatedAt: new Date(event[0].updatedAt).toISOString(),
							startDate: new Date(event[0].startDate).toISOString(),
							endDate: event[0].endDate
								? new Date(event[0].endDate).toISOString()
								: null,
						},
					};
				} catch (error) {
					console.error("Error fetching event:", error);
					throw new ORPCError("INTERNAL_SERVER_ERROR", "Failed to fetch event");
				}
			}),

		// Create event
		create: withAuth
			.input(
				z.object({
					title: z.string().min(1).max(200),
					description: z.string().max(2000).optional(),
					startDate: z.string(), // ISO date string
					endDate: z.string().optional(), // ISO date string
					location: z.string().max(200).optional(),
					minAge: z.number().min(6).max(100).optional(),
					maxAge: z.number().min(6).max(100).optional(),
					maxParticipants: z.number().min(1).max(1000).optional(),
					price: z.string().max(20).optional(),
				}),
			)
			.output(SuccessResponse(Event))
			.handler(async ({ input, context }) => {
				const eventId = nanoid();

				try {
					await db.insert(events).values({
						id: eventId,
						title: input.title,
						description: input.description || null,
						startDate: input.startDate,
						endDate: input.endDate || null,
						location: input.location || null,
						minAge: input.minAge || null,
						maxAge: input.maxAge || null,
						maxParticipants: input.maxParticipants || null,
						currentParticipants: 0,
						price: input.price || null,
						status: "draft",
						imageUrl: null,
						createdBy: context.user.id,
					});

					const newEvent = await db
						.select()
						.from(events)
						.where(eq(events.id, eventId))
						.limit(1);

					return {
						success: true,
						data: {
							...newEvent[0],
							createdAt: new Date(newEvent[0].createdAt).toISOString(),
							updatedAt: new Date(newEvent[0].updatedAt).toISOString(),
							startDate: new Date(newEvent[0].startDate).toISOString(),
							endDate: newEvent[0].endDate
								? new Date(newEvent[0].endDate).toISOString()
								: null,
						},
					};
				} catch (error) {
					console.error("Error creating event:", error);
					throw new ORPCError(
						"INTERNAL_SERVER_ERROR",
						"Failed to create event",
					);
				}
			}),

		// Update event
		update: withAuth
			.input(
				z.object({
					id: z.string(),
					title: z.string().min(1).max(200).optional(),
					description: z.string().max(2000).optional(),
					startDate: z.string().optional(), // ISO date string
					endDate: z.string().nullable().optional(), // ISO date string or null
					location: z.string().max(200).optional(),
					minAge: z.number().min(6).max(100).optional(),
					maxAge: z.number().min(6).max(100).optional(),
					maxParticipants: z.number().min(1).max(1000).optional(),
					price: z.string().max(20).optional(),
					status: z
						.enum(["draft", "open", "closed", "full", "cancelled"])
						.optional(),
				}),
			)
			.output(SuccessResponse(Event))
			.handler(async ({ input, context }) => {
				try {
					// Check if event exists and user has permission to update it
					const existingEvent = await db
						.select()
						.from(events)
						.where(eq(events.id, input.id))
						.limit(1);

					if (existingEvent.length === 0) {
						throw new ORPCError("NOT_FOUND", "Event not found");
					}

					// Check if user is admin or event creator
					const membership = await db
						.select()
						.from(organizationMember)
						.where(eq(organizationMember.userId, context.user.id))
						.limit(1);

					const isAdmin =
						membership.length > 0 &&
						["amministratore", "editor"].includes(membership[0].role);
					const isCreator = existingEvent[0].createdBy === context.user.id;

					if (!isAdmin && !isCreator) {
						throw new ORPCError("FORBIDDEN", "Access denied");
					}

					// Prepare update data
					const updateData: any = {
						updatedAt: new Date(),
					};

					if (input.title !== undefined) updateData.title = input.title;
					if (input.description !== undefined)
						updateData.description = input.description;
					if (input.startDate !== undefined)
						updateData.startDate = new Date(input.startDate);
					if (input.endDate !== undefined)
						updateData.endDate = input.endDate ? new Date(input.endDate) : null;
					if (input.location !== undefined)
						updateData.location = input.location;
					if (input.minAge !== undefined) updateData.minAge = input.minAge;
					if (input.maxAge !== undefined) updateData.maxAge = input.maxAge;
					if (input.maxParticipants !== undefined)
						updateData.maxParticipants = input.maxParticipants;
					if (input.price !== undefined) updateData.price = input.price;
					if (input.status !== undefined) updateData.status = input.status;

					// Update the event
					await db
						.update(events)
						.set(updateData)
						.where(eq(events.id, input.id));

					// Fetch updated event
					const updatedEvent = await db
						.select()
						.from(events)
						.where(eq(events.id, input.id))
						.limit(1);

					return {
						success: true,
						data: {
							...updatedEvent[0],
							createdAt: new Date(updatedEvent[0].createdAt).toISOString(),
							updatedAt: new Date(updatedEvent[0].updatedAt).toISOString(),
							startDate: new Date(updatedEvent[0].startDate).toISOString(),
							endDate: updatedEvent[0].endDate
								? new Date(updatedEvent[0].endDate).toISOString()
								: null,
						},
					};
				} catch (error) {
					console.error("Error updating event:", error);
					throw new ORPCError(
						"INTERNAL_SERVER_ERROR",
						"Failed to update event",
					);
				}
			}),
	}),

	user: os.router({
		// Get current user role
		getCurrentUserRole: withAuth
			.output(
				SuccessResponse(
					z.object({
						role: z.string().nullable(),
						organizationId: z.string().nullable(),
					}),
				),
			)
			.handler(async ({ context }) => {
				try {
					// Get user's organization membership and role
					const membership = await db
						.select()
						.from(organizationMember)
						.where(eq(organizationMember.userId, context.user.id))
						.limit(1);

					if (membership.length === 0) {
						return {
							success: true,
							data: {
								role: null,
								organizationId: null,
							},
						};
					}

					return {
						success: true,
						data: {
							role: membership[0].role,
							organizationId: membership[0].organizationId,
						},
					};
				} catch (error) {
					console.error("Error fetching user role:", error);
					throw new ORPCError(
						"INTERNAL_SERVER_ERROR",
						"Failed to fetch user role",
					);
				}
			}),

		// Update user profile
		updateProfile: withAuth
			.input(
				z.object({
					name: z.string().min(1).max(100).optional(),
					email: z.preprocess(
						(val) =>
							typeof val === "string" && val.trim() === "" ? undefined : val,
						z.string().email().max(100).optional(),
					),
					phoneNumber: z.string().max(20).optional(),
					birthDate: z.string().optional(), // ISO date string
				}),
			)
			.output(SuccessResponse(User))
			.handler(async ({ input, context }) => {
				try {
					// Update the user in the database
					await db
						.update(userTable)
						.set({
							name: input.name || context.user.name,
							email: input.email || context.user.email,
							phoneNumber: input.phoneNumber || context.user.phoneNumber,
							birthDate: input.birthDate || context.user.birthDate,
							updatedAt: Date.now(),
						})
						.where(eq(userTable.id, context.user.id));

					// Fetch the updated user
					const updatedUser = await db
						.select()
						.from(userTable)
						.where(eq(userTable.id, context.user.id))
						.limit(1);

					return {
						success: true,
						data: {
							...updatedUser[0],
							createdAt: new Date(updatedUser[0].createdAt).toISOString(),
							updatedAt: new Date(updatedUser[0].updatedAt).toISOString(),
							birthDate: updatedUser[0].birthDate || null,
						},
					};
				} catch (error) {
					console.error("Error updating user profile:", error);
					throw new ORPCError(
						"INTERNAL_SERVER_ERROR",
						"Failed to update profile",
					);
				}
			}),

		// List all users (admin only)
		list: withAuth
			.input(
				z.object({
					search: z.string().optional(),
					role: z.string().optional(),
					limit: z.number().min(1).max(100).default(50).optional(),
					offset: z.number().min(0).default(0).optional(),
				}),
			)
			.output(
				SuccessResponse(
					z.object({
						users: z.array(
							z.object({
								id: z.string(),
								name: z.string().nullable(),
								email: z.string(),
								phoneNumber: z.string().nullable(),
								birthDate: z.string().nullable(),
								createdAt: z.string(),
								updatedAt: z.string(),
								role: z.string().nullable(),
								organizationId: z.string().nullable(),
								joinedAt: z.string().nullable(),
							}),
						),
						total: z.number(),
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

					if (
						membership.length === 0 ||
						!["amministratore"].includes(membership[0].role)
					) {
						throw new ORPCError("FORBIDDEN", "Access denied");
					}

					const organizationId = membership[0].organizationId;

					// Build query conditions
					const conditions = [];

					if (input.search) {
						const searchTerm = `%${input.search}%`;
						conditions.push(
							sql`(${userTable.name} LIKE ${searchTerm} OR ${userTable.email} LIKE ${searchTerm})`,
						);
					}

					if (input.role) {
						conditions.push(eq(organizationMember.role, input.role));
					}

					// Get users with their organization membership
					const usersQuery = db
						.select({
							user: userTable,
							membership: organizationMember,
						})
						.from(userTable)
						.leftJoin(
							organizationMember,
							and(
								eq(organizationMember.userId, userTable.id),
								eq(organizationMember.organizationId, organizationId),
							),
						)
						.where(conditions.length > 0 ? and(...conditions) : undefined)
						.orderBy(desc(userTable.createdAt))
						.limit(input.limit || 50)
						.offset(input.offset || 0);

					const users = await usersQuery;

					// Count total users
					const totalQuery = db
						.select({ count: sql`count(*)` })
						.from(userTable)
						.leftJoin(
							organizationMember,
							and(
								eq(organizationMember.userId, userTable.id),
								eq(organizationMember.organizationId, organizationId),
							),
						)
						.where(conditions.length > 0 ? and(...conditions) : undefined);

					const totalResult = await totalQuery;
					const total = Number(totalResult[0].count);

					// Get authorized persons for each registration
					const registrationIds = users.map((row) => row.user.id);
					const authorizedPersonsData =
						registrationIds.length > 0
							? await db
									.select({
										registrationId:
											registrationAuthorizedPersons.registrationId,
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

					// Group authorized persons by registration
					const authorizedPersonsByRegistration = new Map();
					authorizedPersonsData.forEach((item) => {
						if (!authorizedPersonsByRegistration.has(item.registrationId)) {
							authorizedPersonsByRegistration.set(item.registrationId, []);
						}
						if (item.person) {
							authorizedPersonsByRegistration
								.get(item.registrationId)
								.push(item.person);
						}
					});

					// Format response
					const formattedUsers = users.map((row) => ({
						id: row.user.id,
						name: row.user.name,
						email: row.user.email,
						phoneNumber: row.user.phoneNumber,
						birthDate: row.user.birthDate,
						createdAt: new Date(row.user.createdAt).toISOString(),
						updatedAt: new Date(row.user.updatedAt).toISOString(),
						role: row.membership?.role || null,
						organizationId: row.membership?.organizationId || null,
						joinedAt: row.membership
							? new Date(row.membership.createdAt).toISOString()
							: null,
					}));

					return {
						success: true,
						data: {
							users: formattedUsers,
							total,
						},
					};
				} catch (error) {
					console.error("Error fetching users:", error);
					throw new ORPCError("INTERNAL_SERVER_ERROR", "Failed to fetch users");
				}
			}),

		// Update user role (admin only)
		updateRole: withAuth
			.input(
				z.object({
					userId: z.string(),
					role: z.enum(["amministratore", "editor", "animatore", "genitore"]),
				}),
			)
			.output(SuccessResponse(z.boolean()))
			.handler(async ({ input, context }) => {
				try {
					// Check if user is admin
					const membership = await db
						.select()
						.from(organizationMember)
						.where(eq(organizationMember.userId, context.user.id))
						.limit(1);

					if (
						membership.length === 0 ||
						membership[0].role !== "amministratore"
					) {
						throw new ORPCError("FORBIDDEN", "Access denied");
					}

					const organizationId = membership[0].organizationId;

					// Check if target user exists
					const targetUser = await db
						.select()
						.from(userTable)
						.where(eq(userTable.id, input.userId))
						.limit(1);

					if (targetUser.length === 0) {
						throw new ORPCError("NOT_FOUND", "User not found");
					}

					// Check if user is already member of organization
					const existingMembership = await db
						.select()
						.from(organizationMember)
						.where(
							and(
								eq(organizationMember.userId, input.userId),
								eq(organizationMember.organizationId, organizationId),
							),
						)
						.limit(1);

					if (existingMembership.length > 0) {
						// Update existing membership
						await db
							.update(organizationMember)
							.set({
								role: input.role,
								updatedAt: Date.now(),
							})
							.where(eq(organizationMember.id, existingMembership[0].id));
					} else {
						// Create new membership
						await db.insert(organizationMember).values({
							id: nanoid(),
							organizationId,
							userId: input.userId,
							role: input.role,
							createdAt: Date.now(),
							updatedAt: Date.now(),
						});
					}

					return {
						success: true,
						data: true,
					};
				} catch (error) {
					console.error("Error updating user role:", error);
					throw new ORPCError(
						"INTERNAL_SERVER_ERROR",
						"Failed to update user role",
					);
				}
			}),

		// Remove user from organization (admin only)
		removeFromOrganization: withAuth
			.input(
				z.object({
					userId: z.string(),
				}),
			)
			.output(SuccessResponse(z.boolean()))
			.handler(async ({ input, context }) => {
				try {
					// Check if user is admin
					const membership = await db
						.select()
						.from(organizationMember)
						.where(eq(organizationMember.userId, context.user.id))
						.limit(1);

					if (
						membership.length === 0 ||
						membership[0].role !== "amministratore"
					) {
						throw new ORPCError("FORBIDDEN", "Access denied");
					}

					const organizationId = membership[0].organizationId;

					// Prevent admin from removing themselves
					if (input.userId === context.user.id) {
						throw new ORPCError(
							"BAD_REQUEST",
							"Cannot remove yourself from organization",
						);
					}

					// Remove user from organization
					await db
						.delete(organizationMember)
						.where(
							and(
								eq(organizationMember.userId, input.userId),
								eq(organizationMember.organizationId, organizationId),
							),
						);

					return {
						success: true,
						data: true,
					};
				} catch (error) {
					console.error("Error removing user from organization:", error);
					throw new ORPCError(
						"INTERNAL_SERVER_ERROR",
						"Failed to remove user from organization",
					);
				}
			}),
	}),

	registrations: os.router({
		// Create registration for user's child
		create: withAuth
			.input(
				z.object({
					eventId: z.string(),
					childId: z.string(),
					authorizedPersonIds: z.array(z.string()).optional(),
					notes: z.string().max(500).optional(),
				}),
			)
			.output(SuccessResponse(Registration))
			.handler(async ({ input, context }) => {
				try {
					// Verify the child belongs to user's family
					const child = await db
						.select({ id: children.id, familyId: children.familyId })
						.from(children)
						.where(eq(children.id, input.childId))
						.limit(1);

					if (child.length === 0) {
						throw new ORPCError("NOT_FOUND", "Child not found");
					}

					// Check if user is member of the child's family
					await checkFamilyMembership(child[0].familyId, context.user.id);

					// Verify the event exists and is open
					const event = await db
						.select()
						.from(events)
						.where(eq(events.id, input.eventId))
						.limit(1);

					if (event.length === 0) {
						throw new ORPCError("NOT_FOUND", "Event not found");
					}

					if (event[0].status !== "open") {
						throw new ORPCError(
							"BAD_REQUEST",
							"Event is not open for registrations",
						);
					}

					// Check if child is already registered for this event
					const existingRegistration = await db
						.select()
						.from(eventRegistrations)
						.where(
							and(
								eq(eventRegistrations.eventId, input.eventId),
								eq(eventRegistrations.childId, input.childId),
							),
						)
						.limit(1);

					if (existingRegistration.length > 0) {
						throw new ORPCError(
							"BAD_REQUEST",
							"Child is already registered for this event",
						);
					}

					// Check if event is full
					if (
						event[0].maxParticipants &&
						event[0].currentParticipants >= event[0].maxParticipants
					) {
						throw new ORPCError("BAD_REQUEST", "Event is full");
					}

					// Verify authorized persons belong to the same family (if provided)
					if (
						input.authorizedPersonIds &&
						input.authorizedPersonIds.length > 0
					) {
						const authorizedPersons = await db
							.select()
							.from(authorizedPersons)
							.where(
								and(
									inArray(authorizedPersons.id, input.authorizedPersonIds),
									eq(authorizedPersons.familyId, child[0].familyId),
								),
							);

						if (authorizedPersons.length !== input.authorizedPersonIds.length) {
							throw new ORPCError(
								"BAD_REQUEST",
								"Some authorized persons not found or not in the same family",
							);
						}
					}

					const registrationId = nanoid();

					// Create registration
					await db.insert(eventRegistrations).values({
						id: registrationId,
						eventId: input.eventId,
						childId: input.childId,
						parentId: context.user.id,
						status: "pending",
						paymentStatus: "pending",
						registrationDate: new Date().toISOString(),
						notes: input.notes || null,
					});

					// Link authorized persons to registration
					if (
						input.authorizedPersonIds &&
						input.authorizedPersonIds.length > 0
					) {
						const authorizedPersonsLinks = input.authorizedPersonIds.map(
							(personId) => ({
								id: nanoid(),
								registrationId,
								authorizedPersonId: personId,
							}),
						);

						await db
							.insert(registrationAuthorizedPersons)
							.values(authorizedPersonsLinks);
					}

					// Update event participant count
					await db
						.update(events)
						.set({
							currentParticipants: event[0].currentParticipants + 1,
							updatedAt: new Date(),
						})
						.where(eq(events.id, input.eventId));

					// Fetch the created registration
					const newRegistration = await db
						.select()
						.from(eventRegistrations)
						.where(eq(eventRegistrations.id, registrationId))
						.limit(1);

					return {
						success: true,
						data: {
							...newRegistration[0],
							registrationDate: new Date(
								newRegistration[0].registrationDate,
							).toISOString(),
							createdAt: new Date(newRegistration[0].createdAt).toISOString(),
							updatedAt: new Date(newRegistration[0].updatedAt).toISOString(),
						},
					};
				} catch (error) {
					console.error("Error creating registration:", error);
					throw new ORPCError(
						"INTERNAL_SERVER_ERROR",
						"Failed to create registration",
					);
				}
			}),

		// Get all registrations (admin only)
		list: withAuth
			.input(
				z.object({
					limit: z.number().min(1).max(100).default(50),
					offset: z.number().min(0).default(0),
					status: z
						.enum(["pending", "confirmed", "cancelled", "waitlist"])
						.optional(),
					paymentStatus: z
						.enum(["pending", "completed", "failed", "refunded"])
						.optional(),
					eventId: z.string().optional(),
				}),
			)
			.output(
				SuccessResponse(
					z.object({
						registrations: z.array(RegistrationWithDetails),
						total: z.number(),
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

					if (
						membership.length === 0 ||
						!["amministratore", "editor", "animatore"].includes(
							membership[0].role,
						)
					) {
						throw new ORPCError("FORBIDDEN", "Access denied");
					}

					// Build query
					let query = db
						.select({
							registration: eventRegistrations,
							child: children,
							parent: userTable,
							event: events,
							family: families,
						})
						.from(eventRegistrations)
						.leftJoin(children, eq(eventRegistrations.childId, children.id))
						.leftJoin(userTable, eq(eventRegistrations.parentId, userTable.id))
						.leftJoin(events, eq(eventRegistrations.eventId, events.id))
						.leftJoin(families, eq(children.familyId, families.id));

					// Apply filters
					const conditions = [];
					if (input.status) {
						conditions.push(eq(eventRegistrations.status, input.status));
					}
					if (input.paymentStatus) {
						conditions.push(
							eq(eventRegistrations.paymentStatus, input.paymentStatus),
						);
					}
					if (input.eventId) {
						conditions.push(eq(eventRegistrations.eventId, input.eventId));
					}

					if (conditions.length > 0) {
						query = query.where(and(...conditions)) as any;
					}

					// Execute query with pagination
					const results = await query
						.orderBy(desc(eventRegistrations.registrationDate))
						.limit(input.limit)
						.offset(input.offset);

					// Get total count
					let countQuery = db
						.select({ count: sql<number>`count(*)`.as("count") })
						.from(eventRegistrations);

					if (conditions.length > 0) {
						countQuery = countQuery.where(and(...conditions)) as any;
					}

					const totalResult = await countQuery;
					const total = totalResult[0]?.count || 0;

					// Get authorized persons for each registration
					const registrationIds = results.map((r) => r.registration.id);
					const authorizedPersonsData =
						registrationIds.length > 0
							? await db
									.select({
										registrationId:
											registrationAuthorizedPersons.registrationId,
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

					// Group authorized persons by registration
					const authorizedPersonsByRegistration = new Map();
					authorizedPersonsData.forEach((item) => {
						if (!authorizedPersonsByRegistration.has(item.registrationId)) {
							authorizedPersonsByRegistration.set(item.registrationId, []);
						}
						if (item.person) {
							authorizedPersonsByRegistration
								.get(item.registrationId)
								.push(item.person);
						}
					});

					// Format response
					const formattedRegistrations = results.map((result) => ({
						id: result.registration.id,
						eventId: result.registration.eventId,
						status: result.registration.status,
						paymentStatus: result.registration.paymentStatus,
						registrationDate: new Date(
							result.registration.registrationDate,
						).toISOString(),
						notes: result.registration.notes,
						createdAt: new Date(result.registration.createdAt).toISOString(),
						updatedAt: new Date(result.registration.updatedAt).toISOString(),
						child: {
							id: result.child!.id,
							firstName: result.child!.firstName,
							lastName: result.child!.lastName,
							birthDate: result.child!.birthDate,
							allergies: result.child!.allergies,
							medicalNotes: result.child!.medicalNotes,
						},
						parent: {
							id: result.parent!.id,
							name: result.parent!.name!,
							email: result.parent!.email,
							phoneNumber: result.parent!.phoneNumber,
						},
						event: {
							id: result.event!.id,
							title: result.event!.title,
							startDate: new Date(result.event!.startDate).toISOString(),
							endDate: result.event!.endDate
								? new Date(result.event!.endDate).toISOString()
								: null,
							price: result.event!.price,
						},
						family: {
							id: result.family!.id,
							name: result.family!.name,
						},
						authorizedPersons:
							authorizedPersonsByRegistration.get(result.registration.id) || [],
					}));

					return {
						success: true,
						data: {
							registrations: formattedRegistrations,
							total,
						},
					};
				} catch (error) {
					console.error("Error fetching registrations:", error);
					throw new ORPCError(
						"INTERNAL_SERVER_ERROR",
						"Failed to fetch registrations",
					);
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
				}),
			)
			.output(SuccessResponse(Registration))
			.handler(async ({ input, context }) => {
				try {
					// Check if user is admin
					const membership = await db
						.select()
						.from(organizationMember)
						.where(eq(organizationMember.userId, context.user.id))
						.limit(1);

					if (
						membership.length === 0 ||
						!["amministratore", "editor", "animatore"].includes(
							membership[0].role,
						)
					) {
						throw new ORPCError("FORBIDDEN", "Access denied");
					}

					// Update registration
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

					await db
						.update(eventRegistrations)
						.set(updateData)
						.where(eq(eventRegistrations.id, input.id));

					// Fetch updated registration
					const updatedRegistration = await db
						.select()
						.from(eventRegistrations)
						.where(eq(eventRegistrations.id, input.id))
						.limit(1);

					if (updatedRegistration.length === 0) {
						throw new ORPCError("NOT_FOUND", "Registration not found");
					}

					return {
						success: true,
						data: {
							...updatedRegistration[0],
							registrationDate: new Date(
								updatedRegistration[0].registrationDate,
							).toISOString(),
							createdAt: new Date(
								updatedRegistration[0].createdAt,
							).toISOString(),
							updatedAt: new Date(
								updatedRegistration[0].updatedAt,
							).toISOString(),
						},
					};
				} catch (error) {
					console.error("Error updating registration:", error);
					throw new ORPCError(
						"INTERNAL_SERVER_ERROR",
						"Failed to update registration",
					);
				}
			}),

		// Get registration details
		get: withAuth
			.input(z.object({ id: z.string() }))
			.output(SuccessResponse(RegistrationWithDetails))
			.handler(async ({ input, context }) => {
				try {
					// Check if user is admin
					const membership = await db
						.select()
						.from(organizationMember)
						.where(eq(organizationMember.userId, context.user.id))
						.limit(1);

					if (
						membership.length === 0 ||
						!["amministratore", "editor", "animatore"].includes(
							membership[0].role,
						)
					) {
						throw new ORPCError("FORBIDDEN", "Access denied");
					}

					// Get registration with all details
					const result = await db
						.select({
							registration: eventRegistrations,
							child: children,
							parent: userTable,
							event: events,
							family: families,
						})
						.from(eventRegistrations)
						.leftJoin(children, eq(eventRegistrations.childId, children.id))
						.leftJoin(userTable, eq(eventRegistrations.parentId, userTable.id))
						.leftJoin(events, eq(eventRegistrations.eventId, events.id))
						.leftJoin(families, eq(children.familyId, families.id))
						.where(eq(eventRegistrations.id, input.id))
						.limit(1);

					if (result.length === 0) {
						throw new ORPCError("NOT_FOUND", "Registration not found");
					}

					// Get authorized persons
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

					const registration = result[0];

					return {
						success: true,
						data: {
							id: registration.registration.id,
							eventId: registration.registration.eventId,
							status: registration.registration.status,
							paymentStatus: registration.registration.paymentStatus,
							registrationDate: new Date(
								registration.registration.registrationDate,
							).toISOString(),
							notes: registration.registration.notes,
							createdAt: new Date(
								registration.registration.createdAt,
							).toISOString(),
							updatedAt: new Date(
								registration.registration.updatedAt,
							).toISOString(),
							child: {
								id: registration.child!.id,
								firstName: registration.child!.firstName,
								lastName: registration.child!.lastName,
								birthDate: registration.child!.birthDate,
								allergies: registration.child!.allergies,
								medicalNotes: registration.child!.medicalNotes,
							},
							parent: {
								id: registration.parent!.id,
								name: registration.parent!.name!,
								email: registration.parent!.email,
								phoneNumber: registration.parent!.phoneNumber,
							},
							event: {
								id: registration.event!.id,
								title: registration.event!.title,
								startDate: new Date(
									registration.event!.startDate,
								).toISOString(),
								endDate: registration.event!.endDate
									? new Date(registration.event!.endDate).toISOString()
									: null,
								price: registration.event!.price,
							},
							family: {
								id: registration.family!.id,
								name: registration.family!.name,
							},
							authorizedPersons: authorizedPersonsData.map(
								(item) => item.person!,
							),
						},
					};
				} catch (error) {
					console.error("Error fetching registration:", error);
					throw new ORPCError(
						"INTERNAL_SERVER_ERROR",
						"Failed to fetch registration",
					);
				}
			}),
	}),
});

// Export router type for client
export type Router = typeof router;
