import { ORPCError, os } from "@orpc/server";
import { and, asc, desc, eq, like, ne, or } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod";
import { db } from "../db";
import * as schema from "../db/schema";
import { withSupremeAdmin } from "./middleware";

// Supreme Admin Router - Centralized management for users and organizations
export const supremeAdminRouter = os.router({
	// === USER MANAGEMENT ===

	// Get all users with pagination and search
	getAllUsers: withSupremeAdmin
		.input(
			z.object({
				page: z.number().min(1).default(1),
				limit: z.number().min(1).max(100).default(20),
				search: z.string().optional(),
				role: z.enum(["user", "admin"]).optional(),
				sortBy: z.enum(["name", "email", "createdAt"]).default("createdAt"),
				sortOrder: z.enum(["asc", "desc"]).default("desc"),
			}),
		)
		.handler(async ({ input }) => {
			const { page, limit, search, role, sortBy, sortOrder } = input;
			const offset = (page - 1) * limit;

			// Build where conditions
			const whereConditions = [];

			if (search) {
				whereConditions.push(
					or(
						like(schema.user.name, `%${search}%`),
						like(schema.user.email, `%${search}%`),
						like(schema.user.phoneNumber, `%${search}%`),
					),
				);
			}

			if (role) {
				whereConditions.push(eq(schema.user.role, role));
			}

			const whereClause =
				whereConditions.length > 0 ? and(...whereConditions) : undefined;

			// Build order by
			const orderBy =
				sortOrder === "asc"
					? asc(schema.user[sortBy])
					: desc(schema.user[sortBy]);

			// Get users with pagination
			const users = await db
				.select({
					id: schema.user.id,
					name: schema.user.name,
					email: schema.user.email,
					phoneNumber: schema.user.phoneNumber,
					phoneNumberVerified: schema.user.phoneNumberVerified,
					emailVerified: schema.user.emailVerified,
					role: schema.user.role,
					birthDate: schema.user.birthDate,
					image: schema.user.image,
					createdAt: schema.user.createdAt,
					updatedAt: schema.user.updatedAt,
				})
				.from(schema.user)
				.where(whereClause)
				.orderBy(orderBy)
				.limit(limit)
				.offset(offset);

			// Get total count for pagination
			const totalUsersResult = await db
				.select({ count: schema.user.id })
				.from(schema.user)
				.where(whereClause);

			const totalUsers = totalUsersResult.length;

			return {
				users,
				pagination: {
					page,
					limit,
					total: totalUsers,
					totalPages: Math.ceil(totalUsers / limit),
				},
			};
		}),

	// Get user details with organizations
	getUserDetails: withSupremeAdmin
		.input(z.object({ userId: z.string() }))
		.handler(async ({ input }) => {
			const { userId } = input;

			// Get user details
			const user = await db
				.select()
				.from(schema.user)
				.where(eq(schema.user.id, userId))
				.limit(1);

			if (user.length === 0) {
				throw new ORPCError("NOT_FOUND", { message: "User not found" });
			}

			// Get user's organization memberships
			const memberships = await db
				.select({
					organizationId: schema.organizationMember.organizationId,
					role: schema.organizationMember.role,
					joinedAt: schema.organizationMember.createdAt,
					organizationName: schema.organization.name,
					organizationImage: schema.organization.image,
				})
				.from(schema.organizationMember)
				.leftJoin(
					schema.organization,
					eq(schema.organizationMember.organizationId, schema.organization.id),
				)
				.where(eq(schema.organizationMember.userId, userId));

			return {
				user: user[0],
				memberships,
			};
		}),

	// Promote/demote user between user and admin role
	updateUserRole: withSupremeAdmin
		.input(
			z.object({
				userId: z.string(),
				role: z.enum(["user", "admin"]),
			}),
		)
		.handler(async ({ input, context }) => {
			const { userId, role } = input;

			// Prevent self-demotion
			if (userId === context.user.id && role === "user") {
				throw new ORPCError("FORBIDDEN", {
					message: "Cannot demote yourself from Supreme Admin",
				});
			}

			// Update user role
			const _result = await db
				.update(schema.user)
				.set({
					role,
					updatedAt: new Date(),
				})
				.where(eq(schema.user.id, userId));

			// If promoting to admin, add to all organizations
			if (role === "admin") {
				const allOrganizations = await db.select().from(schema.organization);

				// Get existing memberships
				const existingMemberships = await db
					.select()
					.from(schema.organizationMember)
					.where(eq(schema.organizationMember.userId, userId));

				const existingOrgIds = new Set(
					existingMemberships.map((m) => m.organizationId),
				);

				// Add to organizations they're not already a member of
				for (const org of allOrganizations) {
					if (!existingOrgIds.has(org.id)) {
						await db.insert(schema.organizationMember).values({
							id: nanoid(),
							organizationId: org.id,
							userId: userId,
							role: "amministratore",
							createdAt: new Date(),
							updatedAt: new Date(),
						});
					}
				}
			}

			return { success: true };
		}),

	// === IMPERSONATION FUNCTIONALITY ===
	// Note: Impersonation is handled directly by better-auth endpoints:
	// POST /api/auth/admin/impersonate-user - Start impersonation
	// POST /api/auth/admin/stop-impersonating - Stop impersonation
	// The better-auth client handles these automatically

	// === ORGANIZATION MANAGEMENT ===

	// Get all organizations with statistics
	getAllOrganizations: withSupremeAdmin
		.input(
			z.object({
				page: z.number().min(1).default(1),
				limit: z.number().min(1).max(100).default(20),
				search: z.string().optional(),
				sortBy: z
					.enum(["name", "createdAt", "memberCount"])
					.default("createdAt"),
				sortOrder: z.enum(["asc", "desc"]).default("desc"),
			}),
		)
		.handler(async ({ input }) => {
			const { page, limit, search, sortBy, sortOrder } = input;
			const offset = (page - 1) * limit;

			// Build where conditions
			const whereConditions = [];

			if (search) {
				whereConditions.push(
					or(
						like(schema.organization.name, `%${search}%`),
						like(schema.organization.email, `%${search}%`),
						like(schema.organization.description, `%${search}%`),
					),
				);
			}

			const whereClause =
				whereConditions.length > 0 ? and(...whereConditions) : undefined;

			// Get organizations with member counts
			const organizations = await db
				.select({
					id: schema.organization.id,
					name: schema.organization.name,
					description: schema.organization.description,
					email: schema.organization.email,
					phone: schema.organization.phone,
					address: schema.organization.address,
					website: schema.organization.website,
					image: schema.organization.image,
					ownerId: schema.organization.ownerId,
					createdAt: schema.organization.createdAt,
					updatedAt: schema.organization.updatedAt,
				})
				.from(schema.organization)
				.where(whereClause)
				.limit(limit)
				.offset(offset);

			// Get member counts for each organization
			const organizationsWithStats = await Promise.all(
				organizations.map(async (org) => {
					const memberCount = await db
						.select({ count: schema.organizationMember.id })
						.from(schema.organizationMember)
						.where(eq(schema.organizationMember.organizationId, org.id));

					const eventCount = await db
						.select({ count: schema.events.id })
						.from(schema.events)
						.where(eq(schema.events.organizationId, org.id));

					return {
						...org,
						memberCount: memberCount.length,
						eventCount: eventCount.length,
					};
				}),
			);

			// Sort by member count if requested
			if (sortBy === "memberCount") {
				organizationsWithStats.sort((a, b) => {
					return sortOrder === "asc"
						? a.memberCount - b.memberCount
						: b.memberCount - a.memberCount;
				});
			}

			// Get total count for pagination
			const totalOrgsResult = await db
				.select({ count: schema.organization.id })
				.from(schema.organization)
				.where(whereClause);

			const totalOrgs = totalOrgsResult.length;

			return {
				organizations: organizationsWithStats,
				pagination: {
					page,
					limit,
					total: totalOrgs,
					totalPages: Math.ceil(totalOrgs / limit),
				},
			};
		}),

	// Get organization details with members
	getOrganizationDetails: withSupremeAdmin
		.input(z.object({ organizationId: z.string() }))
		.handler(async ({ input }) => {
			const { organizationId } = input;

			// Get organization details
			const organization = await db
				.select()
				.from(schema.organization)
				.where(eq(schema.organization.id, organizationId))
				.limit(1);

			if (organization.length === 0) {
				throw new ORPCError("NOT_FOUND", { message: "Organization not found" });
			}

			// Get organization members
			const members = await db
				.select({
					userId: schema.organizationMember.userId,
					role: schema.organizationMember.role,
					joinedAt: schema.organizationMember.createdAt,
					userName: schema.user.name,
					userEmail: schema.user.email,
					userPhone: schema.user.phoneNumber,
					userRole: schema.user.role,
				})
				.from(schema.organizationMember)
				.leftJoin(
					schema.user,
					eq(schema.organizationMember.userId, schema.user.id),
				)
				.where(eq(schema.organizationMember.organizationId, organizationId));

			// Get organization statistics
			const eventCount = await db
				.select({ count: schema.events.id })
				.from(schema.events)
				.where(eq(schema.events.organizationId, organizationId));

			const activeEventCount = await db
				.select({ count: schema.events.id })
				.from(schema.events)
				.where(
					and(
						eq(schema.events.organizationId, organizationId),
						ne(schema.events.status, "cancelled"),
					),
				);

			return {
				organization: organization[0],
				members,
				statistics: {
					memberCount: members.length,
					totalEvents: eventCount.length,
					activeEvents: activeEventCount.length,
				},
			};
		}),

	// Create new organization
	createOrganization: withSupremeAdmin
		.input(
			z.object({
				name: z.string().min(1),
				description: z.string().optional(),
				email: z.string().email().optional(),
				phone: z.string().optional(),
				address: z.string().optional(),
				website: z.string().url().optional(),
				ownerId: z.string(),
			}),
		)
		.handler(async ({ input }) => {
			const orgId = nanoid();

			// Verify owner exists
			const owner = await db
				.select()
				.from(schema.user)
				.where(eq(schema.user.id, input.ownerId))
				.limit(1);

			if (owner.length === 0) {
				throw new ORPCError("BAD_REQUEST", { message: "Owner user not found" });
			}

			// Create organization
			await db.insert(schema.organization).values({
				id: orgId,
				name: input.name,
				description: input.description,
				email: input.email,
				phone: input.phone,
				address: input.address,
				website: input.website,
				ownerId: input.ownerId,
				createdAt: new Date(),
				updatedAt: new Date(),
			});

			// Add owner as administrator
			await db.insert(schema.organizationMember).values({
				id: nanoid(),
				organizationId: orgId,
				userId: input.ownerId,
				role: "amministratore",
				createdAt: new Date(),
				updatedAt: new Date(),
			});

			return { success: true, organizationId: orgId };
		}),

	// Update organization
	updateOrganization: withSupremeAdmin
		.input(
			z.object({
				organizationId: z.string(),
				name: z.string().min(1).optional(),
				description: z.string().optional(),
				email: z.string().email().optional(),
				phone: z.string().optional(),
				address: z.string().optional(),
				website: z.string().url().optional(),
				ownerId: z.string().optional(),
			}),
		)
		.handler(async ({ input }) => {
			const { organizationId, ownerId, ...updateData } = input;

			// If ownerId is being changed, verify the new owner exists
			if (ownerId) {
				const owner = await db
					.select()
					.from(schema.user)
					.where(eq(schema.user.id, ownerId))
					.limit(1);

				if (owner.length === 0) {
					throw new ORPCError("BAD_REQUEST", {
						message: "Owner user not found",
					});
				}

				// Update organization with new owner
				await db
					.update(schema.organization)
					.set({
						...updateData,
						ownerId,
						updatedAt: new Date(),
					})
					.where(eq(schema.organization.id, organizationId));

				// Update the organization member role for the new owner
				// First, remove admin role from old owner
				await db
					.update(schema.organizationMember)
					.set({ role: "membro", updatedAt: new Date() })
					.where(eq(schema.organizationMember.organizationId, organizationId));

				// Then, ensure new owner is admin (or create the membership if not exists)
				const existingMembership = await db
					.select()
					.from(schema.organizationMember)
					.where(
						and(
							eq(schema.organizationMember.organizationId, organizationId),
							eq(schema.organizationMember.userId, ownerId),
						),
					)
					.limit(1);

				if (existingMembership.length > 0) {
					// Update existing membership to admin
					await db
						.update(schema.organizationMember)
						.set({ role: "amministratore", updatedAt: new Date() })
						.where(
							and(
								eq(schema.organizationMember.organizationId, organizationId),
								eq(schema.organizationMember.userId, ownerId),
							),
						);
				} else {
					// Create new admin membership
					await db.insert(schema.organizationMember).values({
						id: nanoid(),
						organizationId,
						userId: ownerId,
						role: "amministratore",
						createdAt: new Date(),
						updatedAt: new Date(),
					});
				}
			} else {
				// Just update the organization data without changing owner
				await db
					.update(schema.organization)
					.set({
						...updateData,
						updatedAt: new Date(),
					})
					.where(eq(schema.organization.id, organizationId));
			}

			return { success: true };
		}),

	// Delete organization
	deleteOrganization: withSupremeAdmin
		.input(z.object({ organizationId: z.string() }))
		.handler(async ({ input }) => {
			const { organizationId } = input;

			// Check if organization exists
			const org = await db
				.select()
				.from(schema.organization)
				.where(eq(schema.organization.id, organizationId))
				.limit(1);

			if (org.length === 0) {
				throw new ORPCError("NOT_FOUND", { message: "Organization not found" });
			}

			// Delete organization (cascade will handle members and events)
			await db
				.delete(schema.organization)
				.where(eq(schema.organization.id, organizationId));

			return { success: true };
		}),

	// Add user to organization
	addUserToOrganization: withSupremeAdmin
		.input(
			z.object({
				organizationId: z.string(),
				userId: z.string(),
				role: z.string().default("membro"),
			}),
		)
		.handler(async ({ input }) => {
			const { organizationId, userId, role } = input;

			// Check if user already exists in organization
			const existingMember = await db
				.select()
				.from(schema.organizationMember)
				.where(
					and(
						eq(schema.organizationMember.organizationId, organizationId),
						eq(schema.organizationMember.userId, userId),
					),
				)
				.limit(1);

			if (existingMember.length > 0) {
				throw new ORPCError("CONFLICT", {
					message: "User is already a member of this organization",
				});
			}

			// Add user to organization
			await db.insert(schema.organizationMember).values({
				id: nanoid(),
				organizationId,
				userId,
				role,
				createdAt: new Date(),
				updatedAt: new Date(),
			});

			return { success: true };
		}),

	// Remove user from organization
	removeUserFromOrganization: withSupremeAdmin
		.input(
			z.object({
				organizationId: z.string(),
				userId: z.string(),
			}),
		)
		.handler(async ({ input }) => {
			const { organizationId, userId } = input;

			// Remove user from organization
			await db
				.delete(schema.organizationMember)
				.where(
					and(
						eq(schema.organizationMember.organizationId, organizationId),
						eq(schema.organizationMember.userId, userId),
					),
				);

			return { success: true };
		}),

	// Update user role in organization
	updateUserRoleInOrganization: withSupremeAdmin
		.input(
			z.object({
				organizationId: z.string(),
				userId: z.string(),
				role: z.string(),
			}),
		)
		.handler(async ({ input }) => {
			const { organizationId, userId, role } = input;

			// Update user role in organization
			await db
				.update(schema.organizationMember)
				.set({
					role,
					updatedAt: new Date(),
				})
				.where(
					and(
						eq(schema.organizationMember.organizationId, organizationId),
						eq(schema.organizationMember.userId, userId),
					),
				);

			return { success: true };
		}),

	// Delete user permanently
	deleteUser: withSupremeAdmin
		.input(
			z.object({
				userId: z.string(),
			}),
		)
		.handler(async ({ input }) => {
			const { userId } = input;

			// First, remove user from all organizations
			await db
				.delete(schema.organizationMember)
				.where(eq(schema.organizationMember.userId, userId));

			// Remove user from all registrations
			await db
				.delete(schema.eventRegistrations)
				.where(eq(schema.eventRegistrations.parentId, userId));

			// Remove user's authorized persons
			await db
				.delete(schema.authorizedPersons)
				.where(eq(schema.authorizedPersons.familyId, userId));

			// Remove user's children
			await db
				.delete(schema.children)
				.where(eq(schema.children.familyId, userId));

			// Finally, delete the user
			await db.delete(schema.user).where(eq(schema.user.id, userId));

			return { success: true };
		}),

	// Get system statistics
	getSystemStatistics: withSupremeAdmin.handler(async () => {
		// Get user counts
		const totalUsers = await db
			.select({ count: schema.user.id })
			.from(schema.user);
		const adminUsers = await db
			.select({ count: schema.user.id })
			.from(schema.user)
			.where(eq(schema.user.role, "admin"));

		// Get organization count
		const totalOrganizations = await db
			.select({ count: schema.organization.id })
			.from(schema.organization);

		// Get event counts
		const totalEvents = await db
			.select({ count: schema.events.id })
			.from(schema.events);
		const activeEvents = await db
			.select({ count: schema.events.id })
			.from(schema.events)
			.where(ne(schema.events.status, "cancelled"));

		// Get recent activity (last 30 days)
		const thirtyDaysAgo = new Date();
		thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

		const recentUsers = await db
			.select({ count: schema.user.id })
			.from(schema.user)
			.where(eq(schema.user.createdAt, thirtyDaysAgo));

		const recentEvents = await db
			.select({ count: schema.events.id })
			.from(schema.events)
			.where(eq(schema.events.createdAt, thirtyDaysAgo));

		return {
			users: {
				total: totalUsers.length,
				admins: adminUsers.length,
				regular: totalUsers.length - adminUsers.length,
				recentlyJoined: recentUsers.length,
			},
			organizations: {
				total: totalOrganizations.length,
			},
			events: {
				total: totalEvents.length,
				active: activeEvents.length,
				cancelled: totalEvents.length - activeEvents.length,
				recentlyCreated: recentEvents.length,
			},
		};
	}),
});
