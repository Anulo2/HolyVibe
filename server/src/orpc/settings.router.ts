import { ORPCError, os } from "@orpc/server";
import { and, count, desc, eq, gte, inArray, lte, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod";
import { db } from "../db";
import {
  events,
  eventRegistrations,
  organization,
  organizationMember,
  user as userTable,
} from "../db/schema";
import { SuccessResponse } from "./helpers";
import { withAuth } from "./middleware";

// Schema for parish settings
const ParishSettingsSchema = z.object({
  name: z.string().min(1).max(100),
  address: z.string().max(500).optional(),
  phone: z.string().max(20).optional(),
  email: z.string().email().max(100).optional(),
  website: z.string().url().max(200).optional(),
  logo: z.string().max(1000).optional(),
  description: z.string().max(2000).optional(),
  photoVideoMinorsDeclaration: z.string().max(5000).optional(),
});

// Schema for event default settings
const EventSettingsSchema = z.object({
  defaultMaxParticipants: z.number().min(1).max(10000).default(100),
  defaultRegistrationDeadlineHours: z.number().min(1).max(8760).default(24), // 1 year max
  requirePhotoVideoConsent: z.boolean().default(true),
  autoConfirmRegistrations: z.boolean().default(false),
  allowWaitingList: z.boolean().default(true),
  maxWaitingListSize: z.number().min(0).max(1000).default(50),
  sendConfirmationEmails: z.boolean().default(true),
  sendReminderEmails: z.boolean().default(true),
  reminderHoursBefore: z.number().min(1).max(168).default(24), // 1 week max
});

// Schema for notification settings
const NotificationSettingsSchema = z.object({
  emailNotifications: z.boolean().default(true),
  smsNotifications: z.boolean().default(false),
  pushNotifications: z.boolean().default(true),
  eventReminders: z.boolean().default(true),
  registrationUpdates: z.boolean().default(true),
  systemAlerts: z.boolean().default(true),
  weeklyDigest: z.boolean().default(false),
  monthlyReport: z.boolean().default(false),
});

// Helper function to get user's organization or fallback to first available
async function getUserOrganizationId(
  userId: string,
  requestedOrgId?: string,
): Promise<string | null> {
  // If specific org requested, validate user has access
  if (requestedOrgId) {
    const membership = await db
      .select()
      .from(organizationMember)
      .where(
        and(
          eq(organizationMember.userId, userId),
          eq(organizationMember.organizationId, requestedOrgId),
        ),
      )
      .limit(1);

    if (membership.length === 0) {
      throw new ORPCError("FORBIDDEN", {
        message: "User is not a member of this organization",
      });
    }

    return requestedOrgId;
  }

  // Get user's first organization
  const memberships = await db
    .select({ organizationId: organizationMember.organizationId })
    .from(organizationMember)
    .where(eq(organizationMember.userId, userId))
    .limit(1);

  if (memberships.length > 0) {
    return memberships[0].organizationId;
  }

  // Fallback to first available organization
  const firstOrg = await db.select().from(organization).limit(1);

  if (firstOrg.length > 0) {
    return firstOrg[0].id;
  }

  return null;
}

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
            members: z.number(),
            events: z.number(),
          }),
        ),
      ),
    )
    .handler(async ({ context }) => {
      try {
        const userOrganizations = await db
          .select({
            id: organization.id,
            name: organization.name,
            logo: organization.image,
            role: organizationMember.role,
          })
          .from(organizationMember)
          .innerJoin(
            organization,
            eq(organizationMember.organizationId, organization.id),
          )
          .where(eq(organizationMember.userId, context.user.id));

        // Get member and event counts for each organization
        const organizationsWithCounts = await Promise.all(
          userOrganizations.map(async (org) => {
            const [memberCount, eventCount] = await Promise.all([
              db
                .select({ count: count() })
                .from(organizationMember)
                .where(eq(organizationMember.organizationId, org.id)),
              db
                .select({ count: count() })
                .from(events)
                .where(eq(events.organizationId, org.id)),
            ]);

            return {
              id: org.id,
              name: org.name,
              image: org.logo,
              role: org.role,
              members: memberCount[0]?.count || 0,
              events: eventCount[0]?.count || 0,
            };
          }),
        );

        return {
          success: true,
          data: organizationsWithCounts,
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
          id: z.string().nullable(),
          name: z.string(),
          address: z.string(),
          phone: z.string(),
          email: z.string(),
          website: z.string(),
          logo: z.string(),
          description: z.string(),
          photoVideoMinorsDeclaration: z.string(),
          userRole: z.string(),
        }),
      ),
    )
    .handler(async ({ input, context }) => {
      try {
        const targetOrgId = await getUserOrganizationId(
          context.user.id,
          input?.organizationId,
        );

        if (!targetOrgId) {
          // Return default values if no organization exists
          return {
            success: true,
            data: {
              id: null,
              name: "Parrocchia",
              address: "",
              phone: "",
              email: "",
              website: "",
              logo: "",
              description: "",
              photoVideoMinorsDeclaration: "",
              userRole: "genitore",
            },
          };
        }

        // Get organization details
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

        // Get user's role in this organization
        const membership = await db
          .select({ role: organizationMember.role })
          .from(organizationMember)
          .where(
            and(
              eq(organizationMember.userId, context.user.id),
              eq(organizationMember.organizationId, targetOrgId),
            ),
          )
          .limit(1);

        const userRole =
          membership.length > 0 ? membership[0].role : "genitore";

        const responseData = {
          id: org[0].id,
          name: org[0].name,
          address: org[0].address || "",
          phone: org[0].phone || "",
          email: org[0].email || "",
          website: org[0].website || "",
          logo: org[0].image || "",
          description: org[0].description || "",
          photoVideoMinorsDeclaration: org[0].photoVideoMinorsDeclaration || "",
          userRole: userRole,
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
          totalUsers: z.number(),
          totalEvents: z.number(),
          totalRegistrations: z.number(),
          activeEvents: z.number(),
          thisMonthRegistrations: z.number(),
          userGrowth: z.array(
            z.object({
              month: z.string(),
              count: z.number(),
            }),
          ),
          registrationTrends: z.array(
            z.object({
              month: z.string(),
              count: z.number(),
            }),
          ),
          topEvents: z.array(
            z.object({
              id: z.string(),
              title: z.string(),
              registrations: z.number(),
            }),
          ),
        }),
      ),
    )
    .handler(async ({ input, context }) => {
      try {
        const targetOrgId = await getUserOrganizationId(
          context.user.id,
          input?.organizationId,
        );

        if (!targetOrgId) {
          // Return default stats if no organization exists
          return {
            success: true,
            data: {
              totalUsers: 0,
              totalEvents: 0,
              totalRegistrations: 0,
              activeEvents: 0,
              thisMonthRegistrations: 0,
              userGrowth: [],
              registrationTrends: [],
              topEvents: [],
            },
          };
        }

        // Get all organization events to filter registrations
        const orgEvents = await db
          .select({ id: events.id })
          .from(events)
          .where(eq(events.organizationId, targetOrgId));

        const orgEventIds = orgEvents.map((e) => e.id);

        // Get basic counts
        const [
          totalUsersResult,
          totalEventsResult,
          totalRegistrationsResult,
          activeEventsResult,
        ] = await Promise.all([
          db
            .select({ count: count() })
            .from(organizationMember)
            .where(eq(organizationMember.organizationId, targetOrgId)),
          db
            .select({ count: count() })
            .from(events)
            .where(eq(events.organizationId, targetOrgId)),
          orgEventIds.length > 0
            ? db
                .select({ count: count() })
                .from(eventRegistrations)
                .where(inArray(eventRegistrations.eventId, orgEventIds))
            : [{ count: 0 }],
          db
            .select({ count: count() })
            .from(events)
            .where(
              and(
                eq(events.organizationId, targetOrgId),
                gte(events.endDate, new Date()),
              ),
            ),
        ]);

        // Get this month's registrations
        const thisMonthStart = new Date();
        thisMonthStart.setDate(1);
        thisMonthStart.setHours(0, 0, 0, 0);

        const thisMonthRegistrationsResult =
          orgEventIds.length > 0
            ? await db
                .select({ count: count() })
                .from(eventRegistrations)
                .where(
                  and(
                    inArray(eventRegistrations.eventId, orgEventIds),
                    gte(eventRegistrations.createdAt, thisMonthStart),
                  ),
                )
            : [{ count: 0 }];

        // Get user growth data (last 12 months)
        const userGrowthData = await db
          .select({
            month:
              sql`strftime('%Y-%m', datetime(${organizationMember.createdAt}, 'unixepoch'))`.as(
                "month",
              ),
            count: count(),
          })
          .from(organizationMember)
          .where(
            and(
              eq(organizationMember.organizationId, targetOrgId),
              gte(
                organizationMember.createdAt,
                sql`${Math.floor((Date.now() - 365 * 24 * 60 * 60 * 1000) / 1000)}`,
              ),
            ),
          )
          .groupBy(
            sql`strftime('%Y-%m', datetime(${organizationMember.createdAt}, 'unixepoch'))`,
          )
          .orderBy(
            sql`strftime('%Y-%m', datetime(${organizationMember.createdAt}, 'unixepoch'))`,
          );

        // Get registration trends (last 12 months)
        const registrationTrendsData =
          orgEventIds.length > 0
            ? await db
                .select({
                  month:
                    sql`strftime('%Y-%m', datetime(${eventRegistrations.createdAt}, 'unixepoch'))`.as(
                      "month",
                    ),
                  count: count(),
                })
                .from(eventRegistrations)
                .where(
                  and(
                    inArray(eventRegistrations.eventId, orgEventIds),
                    gte(
                      eventRegistrations.createdAt,
                      sql`${Math.floor((Date.now() - 365 * 24 * 60 * 60 * 1000) / 1000)}`,
                    ),
                  ),
                )
                .groupBy(
                  sql`strftime('%Y-%m', datetime(${eventRegistrations.createdAt}, 'unixepoch'))`,
                )
                .orderBy(
                  sql`strftime('%Y-%m', datetime(${eventRegistrations.createdAt}, 'unixepoch'))`,
                )
            : [];

        // Get top events by registrations
        const topEventsData =
          orgEventIds.length > 0
            ? await db
                .select({
                  id: events.id,
                  title: events.title,
                  registrations: count(eventRegistrations.id),
                })
                .from(events)
                .leftJoin(
                  eventRegistrations,
                  eq(events.id, eventRegistrations.eventId),
                )
                .where(eq(events.organizationId, targetOrgId))
                .groupBy(events.id, events.title)
                .orderBy(desc(count(eventRegistrations.id)))
                .limit(5)
            : [];

        return {
          success: true,
          data: {
            totalUsers: totalUsersResult[0]?.count || 0,
            totalEvents: totalEventsResult[0]?.count || 0,
            totalRegistrations: totalRegistrationsResult[0]?.count || 0,
            activeEvents: activeEventsResult[0]?.count || 0,
            thisMonthRegistrations: thisMonthRegistrationsResult[0]?.count || 0,
            userGrowth: userGrowthData.map((item) => ({
              month: item.month as string,
              count: item.count,
            })),
            registrationTrends: registrationTrendsData.map((item) => ({
              month: item.month as string,
              count: item.count,
            })),
            topEvents: topEventsData.map((item) => ({
              id: item.id,
              title: item.title,
              registrations: item.registrations,
            })),
          },
        };
      } catch (error) {
        console.error("Error getting organization statistics:", error);
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message: "Failed to get organization statistics",
        });
      }
    }),

  // Get organization events
  getOrganizationEvents: withAuth
    .input(
      z.object({
        organizationId: z.string().optional(),
        limit: z.number().min(1).max(100).default(10),
        upcoming: z.boolean().default(true),
      }),
    )
    .output(
      SuccessResponse(
        z.object({
          events: z.array(
            z.object({
              id: z.string(),
              title: z.string(),
              description: z.string().nullable(),
              startDate: z.string(),
              endDate: z.string().nullable(),
              status: z.string(),
              registrations: z.number(),
              maxParticipants: z.number().nullable(),
            }),
          ),
          total: z.number(),
        }),
      ),
    )
    .handler(async ({ input, context }) => {
      try {
        const targetOrgId = await getUserOrganizationId(
          context.user.id,
          input.organizationId,
        );

        if (!targetOrgId) {
          // Return empty events list if no organization exists
          return {
            success: true,
            data: {
              events: [],
              total: 0,
            },
          };
        }

        const conditions = [eq(events.organizationId, targetOrgId)];

        if (input.upcoming) {
          conditions.push(gte(events.startDate, new Date()));
        }

        const [eventsData, totalResult] = await Promise.all([
          db
            .select({
              id: events.id,
              title: events.title,
              description: events.description,
              startDate: events.startDate,
              endDate: events.endDate,
              status: events.status,
              maxParticipants: events.maxParticipants,
            })
            .from(events)
            .where(and(...conditions))
            .orderBy(desc(events.startDate))
            .limit(input.limit),
          db
            .select({ count: count() })
            .from(events)
            .where(and(...conditions)),
        ]);

        // Get registration counts for each event
        const eventsWithCounts = await Promise.all(
          eventsData.map(async (event) => {
            const registrationCount = await db
              .select({ count: count() })
              .from(eventRegistrations)
              .where(eq(eventRegistrations.eventId, event.id));

            return {
              ...event,
              startDate: new Date(event.startDate).toISOString(),
              endDate: event.endDate
                ? new Date(event.endDate).toISOString()
                : null,
              registrations: registrationCount[0]?.count || 0,
            };
          }),
        );

        return {
          success: true,
          data: {
            events: eventsWithCounts,
            total: totalResult[0]?.count || 0,
          },
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
        const targetOrgId = await getUserOrganizationId(
          context.user.id,
          input?.organizationId,
        );

        if (!targetOrgId) {
          // Return default parish settings if no organization exists
          return {
            success: true,
            data: {
              name: "Parrocchia",
              address: "",
              phone: "",
              email: "",
              website: "",
              logo: "",
              description: "",
              photoVideoMinorsDeclaration: "",
            },
          };
        }

        const org = await db
          .select()
          .from(organization)
          .where(eq(organization.id, targetOrgId))
          .limit(1);

        if (org.length === 0) {
          // Return default settings if organization not found
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
          name: org[0].name,
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
              message:
                "You must be a member of an organization to update parish settings",
            });
          }

          targetOrgId = memberships[0].organizationId;
        }

        // Check if user is member of the target organization and has admin rights
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
            message: "User is not a member of this organization",
          });
        }

        // Check if user has admin rights
        if (
          membership[0].role !== "amministratore" &&
          membership[0].role !== "admin"
        ) {
          throw new ORPCError("FORBIDDEN", {
            message: "Insufficient permissions to update parish settings",
          });
        }

        // Update organization settings
        const { organizationId: _, ...updateData } = input;

        await db
          .update(organization)
          .set({
            ...updateData,
            updatedAt: new Date(),
          })
          .where(eq(organization.id, targetOrgId));

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
        // For now, return default settings
        // In the future, these could be stored per organization
        const defaultSettings = {
          defaultMaxParticipants: 100,
          defaultRegistrationDeadlineHours: 24,
          requirePhotoVideoConsent: true,
          autoConfirmRegistrations: false,
          allowWaitingList: true,
          maxWaitingListSize: 50,
          sendConfirmationEmails: true,
          sendReminderEmails: true,
          reminderHoursBefore: 24,
        };

        return {
          success: true,
          data: defaultSettings,
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
        // For now, just return success
        // In the future, these settings would be stored per organization
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
        // For now, return default notification settings
        // In the future, these could be stored per user
        const defaultSettings = {
          emailNotifications: true,
          smsNotifications: false,
          pushNotifications: true,
          eventReminders: true,
          registrationUpdates: true,
          systemAlerts: true,
          weeklyDigest: false,
          monthlyReport: false,
        };

        return {
          success: true,
          data: defaultSettings,
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
        // For now, just return success
        // In the future, these settings would be stored per user
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
        // This is a placeholder implementation
        // In a real scenario, you would implement actual backup logic
        const backupId = nanoid();
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const filename = `backup-${timestamp}.sql`;

        return {
          success: true,
          data: {
            backupId,
            filename,
            size: 1024 * 1024, // 1MB placeholder
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
            id: z.string(),
            filename: z.string(),
            size: z.number(),
            createdAt: z.string(),
            description: z.string().optional(),
          }),
        ),
      ),
    )
    .handler(async ({ context }) => {
      try {
        // This is a placeholder implementation
        // In a real scenario, you would list actual backup files
        return {
          success: true,
          data: [],
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
        // This is a placeholder implementation
        // In a real scenario, you would implement actual restore logic
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
          databaseSize: z.number(),
          totalUsers: z.number(),
          totalEvents: z.number(),
          totalRegistrations: z.number(),
          systemHealth: z.object({
            database: z.boolean(),
            storage: z.boolean(),
            email: z.boolean(),
            sms: z.boolean(),
          }),
        }),
      ),
    )
    .handler(async ({ context }) => {
      try {
        // Get basic system stats
        const [totalUsersResult, totalEventsResult, totalRegistrationsResult] =
          await Promise.all([
            db.select({ count: count() }).from(userTable),
            db.select({ count: count() }).from(events),
            db.select({ count: count() }).from(eventRegistrations),
          ]);

        return {
          success: true,
          data: {
            version: "1.0.0",
            databaseSize: 50 * 1024 * 1024, // 50MB placeholder
            totalUsers: totalUsersResult[0]?.count || 0,
            totalEvents: totalEventsResult[0]?.count || 0,
            totalRegistrations: totalRegistrationsResult[0]?.count || 0,
            systemHealth: {
              database: true,
              storage: true,
              email: true,
              sms: true,
            },
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
