import { ORPCError, os } from "@orpc/server";
import { and, desc, eq, gte, lte } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod";
import { auth } from "../auth";
import { db } from "../db";
import {
	authorizedPersons,
	children,
	events,
	families,
	familyMembers,
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
	documentType: z.string().nullable(),
	documentNumber: z.string().nullable(),
	documentExpiry: z.string().nullable(),
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

// Create oRPC router using proper structure
export const router = os.router({
	family: os.router({
		// Get user's families
		list: withAuth
			.output(
				SuccessResponse(
					z.array(
						z.object({
							family: Family,
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

					return {
						success: true,
						data: userFamilies.map((item) => ({
							family: {
								...item.family!,
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
					email: z.string().email().max(100).optional(),
					documentType: z.string().max(50).optional(),
					documentNumber: z.string().max(50).optional(),
					documentExpiry: z.string().optional(), // ISO date string
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
						documentType: input.documentType || null,
						documentNumber: input.documentNumber || null,
						documentExpiry: input.documentExpiry || null,
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
			.handler(async ({ input }) => {
				try {
					let query = db.select().from(events);

					// Add search filter
					if (input.search) {
						query = query.where(eq(events.title, `%${input.search}%`)) as any;
					}

					// Add age filters
					if (input.minAge !== undefined) {
						query = query.where(gte(events.maxAge, input.minAge)) as any;
					}

					if (input.maxAge !== undefined) {
						query = query.where(lte(events.minAge, input.maxAge)) as any;
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
					minAge: z.number().min(0).max(100).optional(),
					maxAge: z.number().min(0).max(100).optional(),
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
	}),

	user: os.router({
		// Update user profile
		updateProfile: withAuth
			.input(
				z.object({
					name: z.string().min(1).max(100).optional(),
					email: z.string().email().max(100).optional(),
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
	}),
});

// Export router type for client
export type Router = typeof router;
