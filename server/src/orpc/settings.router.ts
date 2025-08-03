import { ORPCError, os } from "@orpc/server";
import { and, eq, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod";
import { db } from "../db";
import {
	eventRegistrations,
	events,
	organization,
	organizationMember,
} from "../db/schema";
import { SuccessResponse } from "./helpers";
import { withAuth } from "./middleware";

// Schema for parish settings
const ParishSettingsSchema = z.object({
	name: z.string().min(1).max(200),
	address: z.string().max(500).optional(),
	phone: z.string().max(50).optional(),
	email: z.string().optional(),
	website: z.string().optional(),
	logo: z.string().optional(),
	description: z.string().max(1000).optional(),
	photoVideoMinorsDeclaration: z.string().max(5000).optional(),
});

// Schema for event settings
const EventSettingsSchema = z.object({
	defaultMinAge: z.number().min(0).max(18).default(0),
	defaultMaxAge: z.number().min(0).max(18).default(18),
	defaultMaxParticipants: z.number().min(1).max(1000).default(50),
	requirePayment: z.boolean().default(false),
	allowWaitlist: z.boolean().default(true),
	autoConfirmRegistrations: z.boolean().default(false),
	registrationDeadlineDays: z.number().min(0).max(365).default(7),
});

// Schema for notification settings
const NotificationSettingsSchema = z.object({
	emailEnabled: z.boolean().default(true),
	smsEnabled: z.boolean().default(false),
	emailTemplates: z
		.object({
			welcome: z.string().max(2000).optional(),
			eventRegistration: z.string().max(2000).optional(),
			eventReminder: z.string().max(2000).optional(),
			eventCancellation: z.string().max(2000).optional(),
		})
		.optional(),
	smsTemplates: z
		.object({
			eventRegistration: z.string().max(160).optional(),
			eventReminder: z.string().max(160).optional(),
			eventCancellation: z.string().max(160).optional(),
		})
		.optional(),
});

export const settingsRouter = os.router({
	// List organizations user is member of
	listOrganizations: withAuth
		.output(
			SuccessResponse(
				z.array(
					z.object({
						id: z.string(),
						name: z.string(),
						image: z.string().nullable(),
						role: z.string(),
					}),
				),
			),
		)
		.handler(async ({ context }) => {
			try {
				const memberships = await db
					.select({
						id: organization.id,
						name: organization.name,
						image: organization.image,
						role: organizationMember.role,
					})
					.from(organizationMember)
					.innerJoin(
						organization,
						eq(organizationMember.organizationId, organization.id),
					)
					.where(eq(organizationMember.userId, context.user.id));

				return {
					success: true,
					data: memberships,
				};
			} catch (error) {
				console.error("Error listing organizations:", error);
				throw new ORPCError("INTERNAL_SERVER_ERROR", {
					message: "Failed to list organizations",
				});
			}
		}),

	// Get organization info (for regular users)
	getOrganizationInfo: withAuth
		.input(
			z
				.object({
					organizationId: z.string().optional(),
				})
				.optional(),
		)
		.output(
			SuccessResponse(
				z.object({
					id: z.string(),
					name: z.string(),
					address: z.string().optional(),
					phone: z.string().optional(),
					email: z.string().optional(),
					website: z.string().optional(),
					logo: z.string().optional(),
					description: z.string().optional(),
					userRole: z.string(),
				}),
			),
		)
		.handler(async ({ input, context }) => {
			try {
				// Get target organization ID
				let targetOrgId = input?.organizationId;

				// If no specific org requested, get user's organizations and use first one
				if (!targetOrgId) {
					const memberships = await db
						.select({ organizationId: organizationMember.organizationId })
						.from(organizationMember)
						.where(eq(organizationMember.userId, context.user.id))
						.limit(1);

					if (memberships.length === 0) {
						throw new ORPCError("FORBIDDEN", {
							message: "User is not member of any organization",
						});
					}

					targetOrgId = memberships[0].organizationId;
				}

				// Check if user is member of the target organization
				const membership = await db
					.select()
					.from(organizationMember)
					.where(
						and(
							eq(organizationMember.userId, context.user.id),
							eq(organizationMember.organizationId, targetOrgId),
						),
					)
					.limit(1);

				if (membership.length === 0) {
					throw new ORPCError("FORBIDDEN", {
						message: "Access denied to this organization",
					});
				}

				// Get organization data
				const org = await db
					.select()
					.from(organization)
					.where(eq(organization.id, targetOrgId))
					.limit(1);

				if (org.length === 0) {
					throw new ORPCError("NOT_FOUND", {
						message: "Organization not found",
					});
				}

				const responseData = {
					id: org[0].id,
					name: org[0].name,
					address: org[0].address || "",
					phone: org[0].phone || "",
					email: org[0].email || "",
					website: org[0].website || "",
					logo: org[0].image || "",
					description: org[0].description || "",
					userRole: membership[0].role,
				};

				return {
					success: true,
					data: responseData,
				};
			} catch (error) {
				console.error("Error getting organization info:", error);
				throw new ORPCError("INTERNAL_SERVER_ERROR", {
					message: "Failed to get organization info",
				});
			}
		}),

	// Get organization statistics
	getOrganizationStats: withAuth
		.input(
			z
				.object({
					organizationId: z.string().optional(),
				})
				.optional(),
		)
		.output(
			SuccessResponse(
				z.object({
					totalMembers: z.number(),
					totalEvents: z.number(),
					upcomingEvents: z.number(),
					myRegistrations: z.number(),
					recentActivity: z.number(),
					memberSince: z.string(),
				}),
			),
		)
		.handler(async ({ input, context }) => {
			try {
				// Get target organization ID
				let targetOrgId = input?.organizationId;

				// If no specific org requested, get user's organizations and use first one
				if (!targetOrgId) {
					const memberships = await db
						.select({ organizationId: organizationMember.organizationId })
						.from(organizationMember)
						.where(eq(organizationMember.userId, context.user.id))
						.limit(1);

					if (memberships.length === 0) {
						throw new ORPCError("FORBIDDEN", {
							message: "User is not member of any organization",
						});
					}

					targetOrgId = memberships[0].organizationId;
				}

				// Check if user is member of the target organization
				const membership = await db
					.select()
					.from(organizationMember)
					.where(
						and(
							eq(organizationMember.userId, context.user.id),
							eq(organizationMember.organizationId, targetOrgId),
						),
					)
					.limit(1);

				if (membership.length === 0) {
					throw new ORPCError("FORBIDDEN", {
						message: "Access denied to this organization",
					});
				}

				// Get total members count
				const totalMembersResult = await db
					.select({ count: sql`count(*)` })
					.from(organizationMember)
					.where(eq(organizationMember.organizationId, targetOrgId));

				// Get total events count for this year
				const currentYear = new Date().getFullYear();
				const totalEventsResult = await db
					.select({ count: sql`count(*)` })
					.from(events)
					.innerJoin(
						organizationMember,
						eq(events.createdBy, organizationMember.userId),
					)
					.where(
						and(
							eq(organizationMember.organizationId, targetOrgId),
							sql`strftime('%Y', ${events.startDate}) = ${currentYear.toString()}`,
						),
					);

				// Get upcoming events count
				const now = new Date().toISOString();
				const upcomingEventsResult = await db
					.select({ count: sql`count(*)` })
					.from(events)
					.innerJoin(
						organizationMember,
						eq(events.createdBy, organizationMember.userId),
					)
					.where(
						and(
							eq(organizationMember.organizationId, targetOrgId),
							sql`${events.startDate} > ${now}`,
						),
					);

				// Get user's registrations count
				const myRegistrationsResult = await db
					.select({ count: sql`count(*)` })
					.from(eventRegistrations)
					.innerJoin(events, eq(eventRegistrations.eventId, events.id))
					.innerJoin(
						organizationMember,
						eq(events.createdBy, organizationMember.userId),
					)
					.where(
						and(
							eq(eventRegistrations.parentId, context.user.id),
							eq(organizationMember.organizationId, targetOrgId),
							sql`${events.startDate} > ${now}`,
						),
					);

				// Get recent activity (last 7 days)
				const sevenDaysAgo = new Date();
				sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
				const recentActivityResult = await db
					.select({ count: sql`count(*)` })
					.from(events)
					.innerJoin(
						organizationMember,
						eq(events.createdBy, organizationMember.userId),
					)
					.where(
						and(
							eq(organizationMember.organizationId, targetOrgId),
							sql`${events.createdAt} > ${sevenDaysAgo.toISOString()}`,
						),
					);

				return {
					success: true,
					data: {
						totalMembers: Number(totalMembersResult[0]?.count || 0),
						totalEvents: Number(totalEventsResult[0]?.count || 0),
						upcomingEvents: Number(upcomingEventsResult[0]?.count || 0),
						myRegistrations: Number(myRegistrationsResult[0]?.count || 0),
						recentActivity: Number(recentActivityResult[0]?.count || 0),
						memberSince: membership[0].createdAt.toISOString(),
					},
				};
			} catch (error) {
				console.error("Error getting organization stats:", error);
				throw new ORPCError("INTERNAL_SERVER_ERROR", {
					message: "Failed to get organization stats",
				});
			}
		}),

	// Get organization events
	getOrganizationEvents: withAuth
		.input(
			z
				.object({
					organizationId: z.string().optional(),
					limit: z.number().min(1).max(50).default(10),
					upcoming: z.boolean().default(true),
				})
				.optional(),
		)
		.output(
			SuccessResponse(
				z.array(
					z.object({
						id: z.string(),
						title: z.string(),
						description: z.string(),
						startDate: z.string(),
						endDate: z.string().nullable(),
						location: z.string(),
						maxParticipants: z.number().nullable(),
						currentParticipants: z.number(),
						isRegistered: z.boolean(),
						status: z.enum(["open", "closed", "full"]),
					}),
				),
			),
		)
		.handler(async ({ input, context }) => {
			try {
				// Get target organization ID
				let targetOrgId = input?.organizationId;

				// If no specific org requested, get user's organizations and use first one
				if (!targetOrgId) {
					const memberships = await db
						.select({ organizationId: organizationMember.organizationId })
						.from(organizationMember)
						.where(eq(organizationMember.userId, context.user.id))
						.limit(1);

					if (memberships.length === 0) {
						throw new ORPCError("FORBIDDEN", {
							message: "User is not member of any organization",
						});
					}

					targetOrgId = memberships[0].organizationId;
				}

				// Check if user is member of the target organization
				const membership = await db
					.select()
					.from(organizationMember)
					.where(
						and(
							eq(organizationMember.userId, context.user.id),
							eq(organizationMember.organizationId, targetOrgId),
						),
					)
					.limit(1);

				if (membership.length === 0) {
					throw new ORPCError("FORBIDDEN", {
						message: "Access denied to this organization",
					});
				}

				// Build the where condition
				const now = new Date().toISOString();
				const whereConditions = [
					eq(organizationMember.organizationId, targetOrgId),
				];

				if (input?.upcoming) {
					whereConditions.push(sql`${events.startDate} > ${now}`);
				}

				// Get events
				const eventsData = await db
					.select({
						id: events.id,
						title: events.title,
						description: events.description,
						startDate: events.startDate,
						endDate: events.endDate,
						locations: events.locations,
						maxParticipants: events.maxParticipants,
						currentParticipants: sql`COALESCE((
              SELECT COUNT(*)
              FROM ${eventRegistrations}
              WHERE ${eventRegistrations.eventId} = ${events.id}
              AND ${eventRegistrations.status} = 'confirmed'
            ), 0)`.as("currentParticipants"),
						isRegistered: sql`CASE
              WHEN EXISTS(
                SELECT 1 FROM ${eventRegistrations}
                WHERE ${eventRegistrations.eventId} = ${events.id}
                AND ${eventRegistrations.parentId} = ${context.user.id}
              ) THEN 1 ELSE 0 END`.as("isRegistered"),
					})
					.from(events)
					.innerJoin(
						organizationMember,
						eq(events.createdBy, organizationMember.userId),
					)
					.where(and(...whereConditions))
					.orderBy(events.startDate)
					.limit(input?.limit || 10);

				// Process the results
				const processedEvents = eventsData.map((event) => {
					const currentParticipants = Number(event.currentParticipants);
					const maxParticipants = event.maxParticipants;

					let status: "open" | "closed" | "full" = "open";

					// Check if event is full
					if (maxParticipants && currentParticipants >= maxParticipants) {
						status = "full";
					}

					// Check if registration is closed (e.g., event started)
					const eventStarted = new Date(event.startDate) <= new Date();
					if (eventStarted) {
						status = "closed";
					}

					return {
						id: event.id,
						title: event.title,
						description: event.description,
						startDate: event.startDate.toISOString(),
						endDate: event.endDate ? event.endDate.toISOString() : null,
						location: event.locations
							? JSON.parse(event.locations).join(", ")
							: "",
						maxParticipants: event.maxParticipants,
						currentParticipants: currentParticipants,
						isRegistered: Boolean(Number(event.isRegistered)),
						status: status,
					};
				});

				return {
					success: true,
					data: processedEvents,
				};
			} catch (error) {
				console.error("Error getting organization events:", error);
				throw new ORPCError("INTERNAL_SERVER_ERROR", {
					message: "Failed to get organization events",
				});
			}
		}),

	// Get parish settings
	getParishSettings: withAuth
		.input(
			z
				.object({
					organizationId: z.string().optional(),
				})
				.optional(),
		)
		.output(SuccessResponse(ParishSettingsSchema))
		.handler(async ({ input, context }) => {
			try {
				// Get target organization ID
				let targetOrgId = input?.organizationId;

				// If no specific org requested, get user's organizations and use first one
				if (!targetOrgId) {
					const memberships = await db
						.select({ organizationId: organizationMember.organizationId })
						.from(organizationMember)
						.where(eq(organizationMember.userId, context.user.id))
						.limit(1);

					if (memberships.length === 0) {
						throw new ORPCError("FORBIDDEN", {
							message: "User is not member of any organization",
						});
					}

					targetOrgId = memberships[0].organizationId;
				}

				// Check if user is member of the target organization
				const membership = await db
					.select()
					.from(organizationMember)
					.where(
						and(
							eq(organizationMember.userId, context.user.id),
							eq(organizationMember.organizationId, targetOrgId),
						),
					)
					.limit(1);

				const isAdmin =
					membership.length > 0 &&
					["amministratore"].includes(membership[0].role);

				if (!isAdmin) {
					throw new ORPCError("FORBIDDEN", {
						message: "Access denied",
					});
				}

				// Get organization data
				const org = await db
					.select()
					.from(organization)
					.where(eq(organization.id, targetOrgId))
					.limit(1);

				if (org.length === 0) {
					// Return default settings if no organization exists
					const defaultData = {
						name: "Parrocchia",
						address: "",
						phone: "",
						email: "",
						website: "",
						logo: "",
						description: "",
						photoVideoMinorsDeclaration: "",
					};

					return {
						success: true,
						data: defaultData,
					};
				}

				const responseData = {
					name: org[0].name || "Parrocchia",
					address: org[0].address || "",
					phone: org[0].phone || "",
					email: org[0].email || "",
					website: org[0].website || "",
					logo: org[0].image || "",
					description: org[0].description || "",
					photoVideoMinorsDeclaration: org[0].photoVideoMinorsDeclaration || "",
				};

				return {
					success: true,
					data: responseData,
				};
			} catch (error) {
				console.error("Error getting parish settings:", error);
				if (error instanceof z.ZodError) {
					console.error(
						"Validation error details:",
						JSON.stringify(error.errors, null, 2),
					);
				}
				throw new ORPCError("INTERNAL_SERVER_ERROR", {
					message: "Failed to get parish settings",
				});
			}
		}),

	// Update parish settings
	updateParishSettings: withAuth
		.input(
			ParishSettingsSchema.extend({
				organizationId: z.string().optional(),
			}),
		)
		.output(SuccessResponse(z.object({ updated: z.boolean() })))
		.handler(async ({ input, context }) => {
			try {
				// Get target organization ID
				let targetOrgId = input.organizationId;

				// If no specific org requested, get user's organizations and use first one
				if (!targetOrgId) {
					const memberships = await db
						.select({ organizationId: organizationMember.organizationId })
						.from(organizationMember)
						.where(eq(organizationMember.userId, context.user.id))
						.limit(1);

					if (memberships.length === 0) {
						throw new ORPCError("FORBIDDEN", {
							message: "User is not member of any organization",
						});
					}

					targetOrgId = memberships[0].organizationId;
				}

				// Check if user is member of the target organization
				const membership = await db
					.select()
					.from(organizationMember)
					.where(
						and(
							eq(organizationMember.userId, context.user.id),
							eq(organizationMember.organizationId, targetOrgId),
						),
					)
					.limit(1);

				const isAdmin =
					membership.length > 0 &&
					["amministratore"].includes(membership[0].role);

				if (!isAdmin) {
					throw new ORPCError("FORBIDDEN", {
						message: "Access denied",
					});
				}

				// Update organization
				const existingOrg = await db
					.select()
					.from(organization)
					.where(eq(organization.id, targetOrgId))
					.limit(1);

				if (existingOrg.length > 0) {
					await db
						.update(organization)
						.set({
							name: input.name,
							address: input.address,
							phone: input.phone,
							email: input.email,
							website: input.website,
							image: input.logo,
							description: input.description,
							photoVideoMinorsDeclaration: input.photoVideoMinorsDeclaration,
						})
						.where(eq(organization.id, targetOrgId));
				} else {
					// Create new organization if none exists
					await db.insert(organization).values({
						id: nanoid(),
						name: input.name,
						address: input.address,
						phone: input.phone,
						email: input.email,
						website: input.website,
						image: input.logo,
						description: input.description,
						photoVideoMinorsDeclaration: input.photoVideoMinorsDeclaration,
						ownerId: context.user.id,
					});
				}

				// All parish settings are now stored in the organization table

				return {
					success: true,
					data: { updated: true },
				};
			} catch (error) {
				console.error("Error updating parish settings:", error);
				throw new ORPCError("INTERNAL_SERVER_ERROR", {
					message: "Failed to update parish settings",
				});
			}
		}),

	// Get event default settings
	getEventSettings: withAuth
		.output(SuccessResponse(EventSettingsSchema))
		.handler(async ({ context }) => {
			try {
				// Check if user is admin
				const membership = await db
					.select()
					.from(organizationMember)
					.where(eq(organizationMember.userId, context.user.id))
					.limit(1);

				const isAdmin =
					membership.length > 0 &&
					["amministratore"].includes(membership[0].role);

				if (!isAdmin) {
					throw new ORPCError("FORBIDDEN", {
						message: "Access denied",
					});
				}

				// TODO: Get from settings table when implemented
				// For now, return defaults
				return {
					success: true,
					data: {
						defaultMinAge: 0,
						defaultMaxAge: 18,
						defaultMaxParticipants: 50,
						requirePayment: false,
						allowWaitlist: true,
						autoConfirmRegistrations: false,
						registrationDeadlineDays: 7,
					},
				};
			} catch (error) {
				console.error("Error getting event settings:", error);
				throw new ORPCError("INTERNAL_SERVER_ERROR", {
					message: "Failed to get event settings",
				});
			}
		}),

	// Update event default settings
	updateEventSettings: withAuth
		.input(EventSettingsSchema)
		.output(SuccessResponse(z.object({ updated: z.boolean() })))
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
					["amministratore"].includes(membership[0].role);

				if (!isAdmin) {
					throw new ORPCError("FORBIDDEN", {
						message: "Access denied",
					});
				}

				// TODO: Store in settings table when implemented
				// For now, just return success
				return {
					success: true,
					data: { updated: true },
				};
			} catch (error) {
				console.error("Error updating event settings:", error);
				throw new ORPCError("INTERNAL_SERVER_ERROR", {
					message: "Failed to update event settings",
				});
			}
		}),

	// Get notification settings
	getNotificationSettings: withAuth
		.output(SuccessResponse(NotificationSettingsSchema))
		.handler(async ({ context }) => {
			try {
				// Check if user is admin
				const membership = await db
					.select()
					.from(organizationMember)
					.where(eq(organizationMember.userId, context.user.id))
					.limit(1);

				const isAdmin =
					membership.length > 0 &&
					["amministratore"].includes(membership[0].role);

				if (!isAdmin) {
					throw new ORPCError("FORBIDDEN", {
						message: "Access denied",
					});
				}

				// TODO: Get from settings table when implemented
				return {
					success: true,
					data: {
						emailEnabled: true,
						smsEnabled: false,
						emailTemplates: {
							welcome:
								"Benvenuto in {{organizationName}}! Il tuo account è stato creato con successo.",
							eventRegistration:
								"Iscrizione confermata per l'evento {{eventTitle}}. Data: {{eventDate}}.",
							eventReminder:
								"Promemoria: l'evento {{eventTitle}} inizia domani alle {{eventTime}}.",
							eventCancellation:
								"L'evento {{eventTitle}} è stato cancellato. Ci scusiamo per l'inconveniente.",
						},
						smsTemplates: {
							eventRegistration:
								"Iscrizione confermata per {{eventTitle}} il {{eventDate}}",
							eventReminder:
								"Promemoria: {{eventTitle}} domani alle {{eventTime}}",
							eventCancellation: "{{eventTitle}} cancellato. Ci scusiamo.",
						},
					},
				};
			} catch (error) {
				console.error("Error getting notification settings:", error);
				throw new ORPCError("INTERNAL_SERVER_ERROR", {
					message: "Failed to get notification settings",
				});
			}
		}),

	// Update notification settings
	updateNotificationSettings: withAuth
		.input(NotificationSettingsSchema)
		.output(SuccessResponse(z.object({ updated: z.boolean() })))
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
					["amministratore"].includes(membership[0].role);

				if (!isAdmin) {
					throw new ORPCError("FORBIDDEN", {
						message: "Access denied",
					});
				}

				// TODO: Store in settings table when implemented
				return {
					success: true,
					data: { updated: true },
				};
			} catch (error) {
				console.error("Error updating notification settings:", error);
				throw new ORPCError("INTERNAL_SERVER_ERROR", {
					message: "Failed to update notification settings",
				});
			}
		}),

	// Create backup
	createBackup: withAuth
		.output(
			SuccessResponse(
				z.object({
					backupId: z.string(),
					filename: z.string(),
					size: z.number(),
					createdAt: z.string(),
				}),
			),
		)
		.handler(async ({ context }) => {
			try {
				// Check if user is admin
				const membership = await db
					.select()
					.from(organizationMember)
					.where(eq(organizationMember.userId, context.user.id))
					.limit(1);

				const isAdmin =
					membership.length > 0 &&
					["amministratore"].includes(membership[0].role);

				if (!isAdmin) {
					throw new ORPCError("FORBIDDEN", {
						message: "Access denied",
					});
				}

				// TODO: Implement actual backup functionality
				// This would involve:
				// 1. Exporting all tables to JSON/SQL
				// 2. Creating a compressed archive
				// 3. Storing it securely
				// 4. Returning backup details

				const backupId = `backup_${Date.now()}`;
				const filename = `parrocchia_backup_${new Date().toISOString().split("T")[0]}.zip`;

				return {
					success: true,
					data: {
						backupId,
						filename,
						size: 1024000, // Mock size
						createdAt: new Date().toISOString(),
					},
				};
			} catch (error) {
				console.error("Error creating backup:", error);
				throw new ORPCError("INTERNAL_SERVER_ERROR", {
					message: "Failed to create backup",
				});
			}
		}),

	// List backups
	listBackups: withAuth
		.output(
			SuccessResponse(
				z.array(
					z.object({
						backupId: z.string(),
						filename: z.string(),
						size: z.number(),
						createdAt: z.string(),
					}),
				),
			),
		)
		.handler(async ({ context }) => {
			try {
				// Check if user is admin
				const membership = await db
					.select()
					.from(organizationMember)
					.where(eq(organizationMember.userId, context.user.id))
					.limit(1);

				const isAdmin =
					membership.length > 0 &&
					["amministratore"].includes(membership[0].role);

				if (!isAdmin) {
					throw new ORPCError("FORBIDDEN", {
						message: "Access denied",
					});
				}

				// TODO: Implement actual backup listing
				// For now, return mock data
				return {
					success: true,
					data: [
						{
							backupId: "backup_1",
							filename: "parrocchia_backup_2024-01-15.zip",
							size: 1024000,
							createdAt: "2024-01-15T10:30:00Z",
						},
						{
							backupId: "backup_2",
							filename: "parrocchia_backup_2024-01-10.zip",
							size: 980000,
							createdAt: "2024-01-10T10:30:00Z",
						},
					],
				};
			} catch (error) {
				console.error("Error listing backups:", error);
				throw new ORPCError("INTERNAL_SERVER_ERROR", {
					message: "Failed to list backups",
				});
			}
		}),

	// Restore backup
	restoreBackup: withAuth
		.input(z.object({ backupId: z.string() }))
		.output(SuccessResponse(z.object({ restored: z.boolean() })))
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
					["amministratore"].includes(membership[0].role);

				if (!isAdmin) {
					throw new ORPCError("FORBIDDEN", {
						message: "Access denied",
					});
				}

				// TODO: Implement actual backup restoration
				// This is a critical operation that should:
				// 1. Validate backup integrity
				// 2. Create a current backup before restore
				// 3. Restore data carefully
				// 4. Verify restoration success

				return {
					success: true,
					data: { restored: true },
				};
			} catch (error) {
				console.error("Error restoring backup:", error);
				throw new ORPCError("INTERNAL_SERVER_ERROR", {
					message: "Failed to restore backup",
				});
			}
		}),

	// Get system info
	getSystemInfo: withAuth
		.output(
			SuccessResponse(
				z.object({
					version: z.string(),
					environment: z.string(),
					database: z.object({
						type: z.string(),
						size: z.string(),
						tables: z.number(),
					}),
					uptime: z.string(),
					lastBackup: z.string().optional(),
				}),
			),
		)
		.handler(async ({ context }) => {
			try {
				// Check if user is admin
				const membership = await db
					.select()
					.from(organizationMember)
					.where(eq(organizationMember.userId, context.user.id))
					.limit(1);

				const isAdmin =
					membership.length > 0 &&
					["amministratore"].includes(membership[0].role);

				if (!isAdmin) {
					throw new ORPCError("FORBIDDEN", {
						message: "Access denied",
					});
				}

				// TODO: Get actual system information
				return {
					success: true,
					data: {
						version: "1.0.0",
						environment: process.env.NODE_ENV || "development",
						database: {
							type: "SQLite",
							size: "15.2 MB",
							tables: 12,
						},
						uptime: Math.floor(process.uptime() / 60) + " minuti",
						lastBackup: "2024-01-15T10:30:00Z",
					},
				};
			} catch (error) {
				console.error("Error getting system info:", error);
				throw new ORPCError("INTERNAL_SERVER_ERROR", {
					message: "Failed to get system info",
				});
			}
		}),
});
