import { ORPCError, os } from "@orpc/server";
import { and, desc, eq, gte, like, lte, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod";
import { db } from "../db";
import {
  children,
  eventRegistrations,
  events,
  families,
  organization,
  organizationMember,
  user as userTable,
} from "../db/schema";
import { SuccessResponse } from "./helpers";
import { withAuth } from "./middleware";
import { Event } from "./schemas";

export const eventsRouter = os.router({
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
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message: "Failed to fetch events",
        });
      }
    }),

  // Get single event
  get: withAuth
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .output(
      SuccessResponse(
        Event.extend({
          organization: z
            .object({
              id: z.string(),
              name: z.string(),
              photoVideoMinorsDeclaration: z.string().optional(),
            })
            .optional(),
        }),
      ),
    )
    .handler(async ({ input }) => {
      try {
        const event = await db
          .select()
          .from(events)
          .where(eq(events.id, input.id))
          .limit(1);

        if (event.length === 0) {
          throw new ORPCError("NOT_FOUND", {
            message: "Event not found",
          });
        }

        // Get organization data from event creator
        const creatorOrg = await db
          .select({
            id: organization.id,
            name: organization.name,
            photoVideoMinorsDeclaration:
              organization.photoVideoMinorsDeclaration,
          })
          .from(organizationMember)
          .leftJoin(
            organization,
            eq(organizationMember.organizationId, organization.id),
          )
          .where(eq(organizationMember.userId, event[0].createdBy))
          .limit(1);

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
            organization:
              creatorOrg.length > 0
                ? {
                    id: creatorOrg[0].id!,
                    name: creatorOrg[0].name!,
                    photoVideoMinorsDeclaration:
                      creatorOrg[0].photoVideoMinorsDeclaration || "",
                  }
                : undefined,
          },
        };
      } catch (error) {
        console.error("Error fetching event:", error);
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message: "Failed to fetch event",
        });
      }
    }),

  // Get dashboard stats
  getDashboardStats: withAuth
    .output(
      SuccessResponse(
        z.object({
          totalEvents: z.number(),
          openEvents: z.number(),
          totalRegistrations: z.number(),
          pendingRegistrations: z.number(),
          totalUsers: z.number(),
          totalFamilies: z.number(),
          conversionRate: z.number(),
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
          ["amministratore", "editor", "animatore"].includes(
            membership[0].role,
          );

        if (!isAdmin) {
          throw new ORPCError("FORBIDDEN", {
            message: "Access denied",
          });
        }

        const [totalEvents] = await db
          .select({ count: sql<number>`count(*)` })
          .from(events);

        const [openEvents] = await db
          .select({ count: sql<number>`count(*)` })
          .from(events)
          .where(eq(events.status, "open"));

        const [totalRegistrations] = await db
          .select({ count: sql<number>`count(*)` })
          .from(eventRegistrations);

        const [pendingRegistrations] = await db
          .select({ count: sql<number>`count(*)` })
          .from(eventRegistrations)
          .where(eq(eventRegistrations.status, "pending"));

        const [totalUsers] = await db
          .select({ count: sql<number>`count(*)` })
          .from(userTable);

        const [totalFamilies] = await db
          .select({ count: sql<number>`count(*)` })
          .from(families);

        // Calculate conversion rate (confirmed registrations / total registrations)
        const [confirmedRegistrations] = await db
          .select({ count: sql<number>`count(*)` })
          .from(eventRegistrations)
          .where(eq(eventRegistrations.status, "confirmed"));

        const conversionRate =
          totalRegistrations.count > 0
            ? (confirmedRegistrations.count / totalRegistrations.count) * 100
            : 0;

        return {
          success: true,
          data: {
            totalEvents: totalEvents.count,
            openEvents: openEvents.count,
            totalRegistrations: totalRegistrations.count,
            pendingRegistrations: pendingRegistrations.count,
            totalUsers: totalUsers.count,
            totalFamilies: totalFamilies.count,
            conversionRate: Math.round(conversionRate * 100) / 100,
          },
        };
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message: "Failed to fetch dashboard stats",
        });
      }
    }),

  // Get recent activity
  getRecentActivity: withAuth
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(10),
      }),
    )
    .output(
      SuccessResponse(
        z.array(
          z.object({
            id: z.string(),
            type: z.enum(["registration", "event", "user"]),
            title: z.string(),
            description: z.string(),
            timestamp: z.string(),
            relatedId: z.string().optional(),
          }),
        ),
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
            message: "Access denied",
          });
        }

        const activities = [];

        // Get recent registrations
        const recentRegistrations = await db
          .select({
            id: eventRegistrations.id,
            createdAt: eventRegistrations.createdAt,
            eventId: eventRegistrations.eventId,
            parentId: eventRegistrations.parentId,
            status: eventRegistrations.status,
            eventTitle: events.title,
            parentName: userTable.name,
          })
          .from(eventRegistrations)
          .leftJoin(events, eq(eventRegistrations.eventId, events.id))
          .leftJoin(userTable, eq(eventRegistrations.parentId, userTable.id))
          .orderBy(desc(eventRegistrations.createdAt))
          .limit(Math.ceil(input.limit * 0.5));

        for (const reg of recentRegistrations) {
          activities.push({
            id: reg.id,
            type: "registration" as const,
            title: "Nuova iscrizione",
            description: `${reg.parentName || "Utente"} si è iscritto a "${reg.eventTitle || "Evento"}"`,
            timestamp: new Date(reg.createdAt).toISOString(),
            relatedId: reg.eventId,
          });
        }

        // Get recent events
        const recentEvents = await db
          .select({
            id: events.id,
            title: events.title,
            createdAt: events.createdAt,
            status: events.status,
            createdByName: userTable.name,
          })
          .from(events)
          .leftJoin(userTable, eq(events.createdBy, userTable.id))
          .orderBy(desc(events.createdAt))
          .limit(Math.ceil(input.limit * 0.3));

        for (const event of recentEvents) {
          activities.push({
            id: event.id,
            type: "event" as const,
            title: "Evento creato",
            description: `Nuovo evento "${event.title}" ${event.status === "open" ? "pubblicato" : "creato"}`,
            timestamp: new Date(event.createdAt).toISOString(),
            relatedId: event.id,
          });
        }

        // Get recent users
        const recentUsers = await db
          .select({
            id: userTable.id,
            name: userTable.name,
            email: userTable.email,
            createdAt: userTable.createdAt,
          })
          .from(userTable)
          .orderBy(desc(userTable.createdAt))
          .limit(Math.ceil(input.limit * 0.2));

        for (const user of recentUsers) {
          activities.push({
            id: user.id,
            type: "user" as const,
            title: "Nuovo utente",
            description: `${user.name || user.email} si è registrato`,
            timestamp: new Date(user.createdAt).toISOString(),
            relatedId: user.id,
          });
        }

        // Sort all activities by timestamp and limit
        const sortedActivities = activities
          .sort(
            (a, b) =>
              new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
          )
          .slice(0, input.limit);

        return {
          success: true,
          data: sortedActivities,
        };
        return { success: true, data: activities };
      } catch (error) {
        console.error("Error getting recent activity:", error);
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message: "Failed to get recent activity",
        });
      }
    }),

  // Get advanced reports for admin
  getAdvancedReports: withAuth
    .input(
      z.object({
        reportType: z.enum([
          "events_stats",
          "user_analytics",
          "financial_report",
          "age_distribution",
        ]),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      }),
    )
    .output(
      SuccessResponse(
        z.object({
          reportType: z.string(),
          data: z.any(),
          generatedAt: z.string(),
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
          ["amministratore"].includes(membership[0].role);

        if (!isAdmin) {
          throw new ORPCError("FORBIDDEN", {
            message: "Access denied",
          });
        }

        let reportData: any = {};

        switch (input.reportType) {
          case "events_stats": {
            // Eventi per mese negli ultimi 12 mesi
            const eventsStats = await db
              .select({
                month:
                  sql`strftime('%Y-%m', datetime(${events.startDate}, 'unixepoch'))`.as(
                    "month",
                  ),
                count: sql`count(*)`.as("count"),
                avgParticipants: sql`avg(${events.currentParticipants})`.as(
                  "avgParticipants",
                ),
                totalRevenue:
                  sql`sum(case when ${events.price} is not null then cast(${events.price} as real) * ${events.currentParticipants} else 0 end)`.as(
                    "totalRevenue",
                  ),
              })
              .from(events)
              .where(
                input.startDate && input.endDate
                  ? and(
                      gte(
                        events.startDate,
                        sql`${Math.floor(new Date(input.startDate).getTime() / 1000)}`,
                      ),
                      lte(
                        events.startDate,
                        sql`${Math.floor(new Date(input.endDate).getTime() / 1000)}`,
                      ),
                    )
                  : gte(
                      events.startDate,
                      sql`${Math.floor((Date.now() - 365 * 24 * 60 * 60 * 1000) / 1000)}`,
                    ),
              )
              .groupBy(
                sql`strftime('%Y-%m', datetime(${events.startDate}, 'unixepoch'))`,
              )
              .orderBy(
                sql`strftime('%Y-%m', datetime(${events.startDate}, 'unixepoch'))`,
              );

            // Eventi più popolari
            const popularEvents = await db
              .select({
                id: events.id,
                title: events.title,
                currentParticipants: events.currentParticipants,
                maxParticipants: events.maxParticipants,
                fillRate:
                  sql`(cast(${events.currentParticipants} as real) / ${events.maxParticipants} * 100)`.as(
                    "fillRate",
                  ),
                revenue:
                  sql`case when ${events.price} is not null then cast(${events.price} as real) * ${events.currentParticipants} else 0 end`.as(
                    "revenue",
                  ),
              })
              .from(events)
              .where(eq(events.status, "open"))
              .orderBy(desc(events.currentParticipants))
              .limit(10);

            reportData = {
              monthlyStats: eventsStats,
              popularEvents: popularEvents,
              totalEvents: await db
                .select({ count: sql`count(*)` })
                .from(events),
            };
            break;
          }

          case "user_analytics": {
            // Crescita utenti per mese
            const userGrowth = await db
              .select({
                month:
                  sql`strftime('%Y-%m', datetime(${userTable.createdAt}, 'unixepoch'))`.as(
                    "month",
                  ),
                newUsers: sql`count(*)`.as("newUsers"),
              })
              .from(userTable)
              .where(
                input.startDate && input.endDate
                  ? and(
                      gte(
                        userTable.createdAt,
                        sql`${Math.floor(new Date(input.startDate).getTime() / 1000)}`,
                      ),
                      lte(
                        userTable.createdAt,
                        sql`${Math.floor(new Date(input.endDate).getTime() / 1000)}`,
                      ),
                    )
                  : gte(
                      userTable.createdAt,
                      sql`${Math.floor((Date.now() - 365 * 24 * 60 * 60 * 1000) / 1000)}`,
                    ),
              )
              .groupBy(
                sql`strftime('%Y-%m', datetime(${userTable.createdAt}, 'unixepoch'))`,
              )
              .orderBy(
                sql`strftime('%Y-%m', datetime(${userTable.createdAt}, 'unixepoch'))`,
              );

            // Utenti più attivi (con più iscrizioni)
            const activeUsers = await db
              .select({
                userId: userTable.id,
                name: userTable.name,
                email: userTable.email,
                registrationCount: sql`count(${eventRegistrations.id})`.as(
                  "registrationCount",
                ),
              })
              .from(userTable)
              .leftJoin(
                eventRegistrations,
                eq(userTable.id, eventRegistrations.parentId),
              )
              .groupBy(userTable.id, userTable.name, userTable.email)
              .orderBy(desc(sql`count(${eventRegistrations.id})`))
              .limit(10);

            reportData = {
              monthlyGrowth: userGrowth,
              activeUsers: activeUsers,
              totalUsers: await db
                .select({ count: sql`count(*)` })
                .from(userTable),
            };
            break;
          }

          case "financial_report": {
            // Report finanziario
            const financialStats = await db
              .select({
                month:
                  sql`strftime('%Y-%m', datetime(${events.startDate}, 'unixepoch'))`.as(
                    "month",
                  ),
                totalRevenue:
                  sql`sum(case when ${events.price} is not null then cast(${events.price} as real) * ${events.currentParticipants} else 0 end)`.as(
                    "totalRevenue",
                  ),
                paidEvents:
                  sql`count(case when ${events.price} is not null and cast(${events.price} as real) > 0 then 1 end)`.as(
                    "paidEvents",
                  ),
                freeEvents:
                  sql`count(case when ${events.price} is null or cast(${events.price} as real) = 0 then 1 end)`.as(
                    "freeEvents",
                  ),
              })
              .from(events)
              .where(
                input.startDate && input.endDate
                  ? and(
                      gte(
                        events.startDate,
                        sql`${Math.floor(new Date(input.startDate).getTime() / 1000)}`,
                      ),
                      lte(
                        events.startDate,
                        sql`${Math.floor(new Date(input.endDate).getTime() / 1000)}`,
                      ),
                    )
                  : gte(
                      events.startDate,
                      sql`${Math.floor((Date.now() - 365 * 24 * 60 * 60 * 1000) / 1000)}`,
                    ),
              )
              .groupBy(
                sql`strftime('%Y-%m', datetime(${events.startDate}, 'unixepoch'))`,
              )
              .orderBy(
                sql`strftime('%Y-%m', datetime(${events.startDate}, 'unixepoch'))`,
              );

            // Eventi per tipo di prezzo
            const revenueByEvent = await db
              .select({
                id: events.id,
                title: events.title,
                price: events.price,
                participants: events.currentParticipants,
                revenue:
                  sql`case when ${events.price} is not null then cast(${events.price} as real) * ${events.currentParticipants} else 0 end`.as(
                    "revenue",
                  ),
              })
              .from(events)
              .where(
                input.startDate && input.endDate
                  ? and(
                      gte(
                        events.startDate,
                        sql`${Math.floor(new Date(input.startDate).getTime() / 1000)}`,
                      ),
                      lte(
                        events.startDate,
                        sql`${Math.floor(new Date(input.endDate).getTime() / 1000)}`,
                      ),
                    )
                  : gte(
                      events.startDate,
                      sql`${Math.floor((Date.now() - 365 * 24 * 60 * 60 * 1000) / 1000)}`,
                    ),
              )
              .orderBy(
                desc(
                  sql`case when ${events.price} is not null then cast(${events.price} as real) * ${events.currentParticipants} else 0 end`,
                ),
              );

            reportData = {
              monthlyFinancial: financialStats,
              revenueByEvent: revenueByEvent,
            };
            break;
          }

          case "age_distribution": {
            // Distribuzione per età dei bambini iscritti
            const ageDistribution = await db
              .select({
                ageGroup: sql`
                case
                  when (julianday('now') - julianday(${children.birthDate})) / 365.25 < 5 then '0-4'
                  when (julianday('now') - julianday(${children.birthDate})) / 365.25 < 8 then '5-7'
                  when (julianday('now') - julianday(${children.birthDate})) / 365.25 < 11 then '8-10'
                  when (julianday('now') - julianday(${children.birthDate})) / 365.25 < 14 then '11-13'
                  else '14+'
                end
              `.as("ageGroup"),
                count: sql`count(*)`.as("count"),
              })
              .from(children)
              .innerJoin(
                eventRegistrations,
                eq(children.id, eventRegistrations.childId),
              ).groupBy(sql`
              case
                when (julianday('now') - julianday(${children.birthDate})) / 365.25 < 5 then '0-4'
                when (julianday('now') - julianday(${children.birthDate})) / 365.25 < 8 then '5-7'
                when (julianday('now') - julianday(${children.birthDate})) / 365.25 < 11 then '8-10'
                when (julianday('now') - julianday(${children.birthDate})) / 365.25 < 14 then '11-13'
                else '14+'
              end
            `);

            reportData = {
              ageDistribution: ageDistribution,
            };
            break;
          }
        }

        return {
          success: true,
          data: {
            reportType: input.reportType,
            data: reportData,
            generatedAt: new Date().toISOString(),
          },
        };
      } catch (error) {
        console.error("Error generating advanced report:", error);
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message: "Failed to generate report",
        });
      }
    }),

  // Export data endpoint
  exportData: withAuth
    .input(
      z.object({
        exportType: z.enum(["events", "users", "registrations", "children"]),
        format: z.enum(["csv", "json"]),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      }),
    )
    .output(
      SuccessResponse(
        z.object({
          data: z.string(),
          filename: z.string(),
          contentType: z.string(),
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
          ["amministratore"].includes(membership[0].role);

        if (!isAdmin) {
          throw new ORPCError("FORBIDDEN", {
            message: "Access denied",
          });
        }

        let exportData: any[] = [];
        let filename = "";

        switch (input.exportType) {
          case "events":
            exportData = await db
              .select({
                id: events.id,
                title: events.title,
                description: events.description,
                startDate: events.startDate,
                endDate: events.endDate,
                locations: events.locations,
                minAge: events.minAge,
                maxAge: events.maxAge,
                maxParticipants: events.maxParticipants,
                currentParticipants: events.currentParticipants,
                price: events.price,
                status: events.status,
                createdAt: events.createdAt,
              })
              .from(events)
              .where(
                input.startDate && input.endDate
                  ? and(
                      gte(
                        events.startDate,
                        sql`${Math.floor(new Date(input.startDate).getTime() / 1000)}`,
                      ),
                      lte(
                        events.startDate,
                        sql`${Math.floor(new Date(input.endDate).getTime() / 1000)}`,
                      ),
                    )
                  : undefined,
              );
            filename = `eventi_${new Date().toISOString().split("T")[0]}`;
            break;

          case "users":
            exportData = await db
              .select({
                id: userTable.id,
                name: userTable.name,
                email: userTable.email,
                phoneNumber: userTable.phoneNumber,
                birthDate: userTable.birthDate,
                createdAt: userTable.createdAt,
              })
              .from(userTable)
              .where(
                input.startDate && input.endDate
                  ? and(
                      gte(
                        userTable.createdAt,
                        sql`${Math.floor(new Date(input.startDate).getTime() / 1000)}`,
                      ),
                      lte(
                        userTable.createdAt,
                        sql`${Math.floor(new Date(input.endDate).getTime() / 1000)}`,
                      ),
                    )
                  : undefined,
              );
            filename = `utenti_${new Date().toISOString().split("T")[0]}`;
            break;

          case "registrations":
            exportData = await db
              .select({
                registrationId: eventRegistrations.id,
                eventTitle: events.title,
                childName:
                  sql`${children.firstName} || ' ' || ${children.lastName}`.as(
                    "childName",
                  ),
                parentName: userTable.name,
                parentEmail: userTable.email,
                status: eventRegistrations.status,
                paymentStatus: eventRegistrations.paymentStatus,
                registrationDate: eventRegistrations.registrationDate,
              })
              .from(eventRegistrations)
              .innerJoin(events, eq(eventRegistrations.eventId, events.id))
              .innerJoin(children, eq(eventRegistrations.childId, children.id))
              .innerJoin(
                userTable,
                eq(eventRegistrations.parentId, userTable.id),
              )
              .where(
                input.startDate && input.endDate
                  ? and(
                      gte(
                        eventRegistrations.registrationDate,
                        sql`${Math.floor(new Date(input.startDate).getTime() / 1000)}`,
                      ),
                      lte(
                        eventRegistrations.registrationDate,
                        sql`${Math.floor(new Date(input.endDate).getTime() / 1000)}`,
                      ),
                    )
                  : undefined,
              );
            filename = `iscrizioni_${new Date().toISOString().split("T")[0]}`;
            break;

          case "children":
            exportData = await db
              .select({
                id: children.id,
                firstName: children.firstName,
                lastName: children.lastName,
                birthDate: children.birthDate,
                birthPlace: children.birthPlace,
                fiscalCode: children.fiscalCode,
                gender: children.gender,
                familyName: families.name,
                createdAt: children.createdAt,
              })
              .from(children)
              .innerJoin(families, eq(children.familyId, families.id))
              .where(
                input.startDate && input.endDate
                  ? and(
                      gte(
                        children.createdAt,
                        sql`${Math.floor(new Date(input.startDate).getTime() / 1000)}`,
                      ),
                      lte(
                        children.createdAt,
                        sql`${Math.floor(new Date(input.endDate).getTime() / 1000)}`,
                      ),
                    )
                  : undefined,
              );
            filename = `bambini_${new Date().toISOString().split("T")[0]}`;
            break;
        }

        let responseData = "";
        let contentType = "";

        if (input.format === "csv") {
          // Convert to CSV
          if (exportData.length > 0) {
            const headers = Object.keys(exportData[0]).join(",");
            const rows = exportData.map((row) =>
              Object.values(row)
                .map((value) =>
                  typeof value === "string"
                    ? `"${value.replace(/"/g, '""')}"`
                    : value,
                )
                .join(","),
            );
            responseData = [headers, ...rows].join("\n");
          }
          contentType = "text/csv";
          filename += ".csv";
        } else {
          // JSON format
          responseData = JSON.stringify(exportData, null, 2);
          contentType = "application/json";
          filename += ".json";
        }

        return {
          success: true,
          data: {
            data: responseData,
            filename: filename,
            contentType: contentType,
          },
        };
      } catch (error) {
        console.error("Error exporting data:", error);
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message: "Failed to export data",
        });
      }
    }),

  // Create event
  create: withAuth
    .input(
      z.object({
        title: z.string().min(1).max(100),
        description: z.string().max(1000),
        startDate: z.string(), // ISO date string
        endDate: z.string().optional(), // ISO date string
        locations: z.array(z.string().min(1).max(200)).min(1),
        minAge: z.number().min(0).max(100),
        maxAge: z.number().min(0).max(100),
        maxParticipants: z.number().min(1),
        price: z.string().max(20).optional(),
        imageUrl: z.string().optional(),
        imageFile: z.instanceof(File).optional(),
        // Extended information fields
        detailedDescription: z.string().max(5000).optional(),
        program: z.string().max(3000).optional(),
        requirements: z.string().max(1000).optional(),
        whatToBring: z.string().max(1000).optional(),
        parentNotes: z.string().max(2000).optional(),
        emergencyContacts: z.string().max(1000).optional(),
        meetingPoint: z.string().max(500).optional(),
        dropOffTime: z.string().max(20).optional(),
        pickUpTime: z.string().max(20).optional(),
        includesLunch: z.boolean().optional(),
        includesSnack: z.boolean().optional(),
        transportProvided: z.boolean().optional(),
        weatherDependent: z.boolean().optional(),
        specialNotes: z.string().max(2000).optional(),
        cancellationPolicy: z.string().max(1000).optional(),
        photographyConsent: z.boolean().optional(),
        willTakePhotos: z.boolean().optional(),
        photosForSocialMedia: z.boolean().optional(),
        additionalImages: z.string().optional(), // JSON array
      }),
    )
    .output(SuccessResponse(Event))
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
          ["amministratore", "editor"].includes(membership[0].role);

        if (!isAdmin) {
          throw new ORPCError("FORBIDDEN", {
            message: "Access denied",
          });
        }

        const eventId = nanoid();

        // Handle file upload if provided
        let finalImageUrl = input.imageUrl || null;
        if (input.imageFile) {
          try {
            // Validate file size (5MB limit)
            if (input.imageFile.size > 5 * 1024 * 1024) {
              throw new ORPCError("BAD_REQUEST", {
                message: "File size exceeds 5MB limit",
              });
            }

            // Validate file type
            const allowedTypes = [
              "image/jpeg",
              "image/jpg",
              "image/png",
              "image/webp",
            ];
            if (!allowedTypes.includes(input.imageFile.type)) {
              throw new ORPCError("BAD_REQUEST", {
                message:
                  "Invalid file type. Only JPEG, PNG, and WebP are allowed",
              });
            }

            // Convert File to base64 data URL for storage
            const buffer = await input.imageFile.arrayBuffer();
            const base64 = Buffer.from(buffer).toString("base64");
            const mimeType = input.imageFile.type || "image/jpeg";
            finalImageUrl = `data:${mimeType};base64,${base64}`;
          } catch (fileError) {
            console.error("Error processing uploaded file:", fileError);

            // Re-throw ORPCError as-is
            if (fileError instanceof ORPCError) {
              throw fileError;
            }

            throw new ORPCError("BAD_REQUEST", {
              message: "Failed to process uploaded file",
            });
          }
        }

        // Create the event object
        const eventData = {
          id: eventId,
          title: input.title,
          description: input.description,
          startDate: new Date(input.startDate),
          endDate: input.endDate ? new Date(input.endDate) : null,
          locations: JSON.stringify(input.locations),
          minAge: input.minAge,
          maxAge: input.maxAge,
          maxParticipants: input.maxParticipants,
          currentParticipants: 0,
          price: input.price || null,
          status: "draft" as const,
          imageUrl: finalImageUrl,
          // Extended information fields
          detailedDescription: input.detailedDescription || null,
          program: input.program || null,
          requirements: input.requirements || null,
          whatToBring: input.whatToBring || null,
          parentNotes: input.parentNotes || null,
          emergencyContacts: input.emergencyContacts || null,
          meetingPoint: input.meetingPoint || null,
          dropOffTime: input.dropOffTime || null,
          pickUpTime: input.pickUpTime || null,
          includesLunch: input.includesLunch || false,
          includesSnack: input.includesSnack || false,
          transportProvided: input.transportProvided || false,
          weatherDependent: input.weatherDependent || false,
          specialNotes: input.specialNotes || null,
          cancellationPolicy: input.cancellationPolicy || null,
          photographyConsent: input.photographyConsent ?? true,
          willTakePhotos: input.willTakePhotos ?? false,
          photosForSocialMedia: input.photosForSocialMedia ?? false,
          additionalImages: input.additionalImages || null,
          createdBy: context.user.id,
        };

        await db.insert(events).values(eventData);

        const [newEvent] = await db
          .select()
          .from(events)
          .where(eq(events.id, eventId))
          .limit(1);

        return {
          success: true,
          data: {
            ...newEvent,
            createdAt: new Date(newEvent.createdAt).toISOString(),
            updatedAt: new Date(newEvent.updatedAt).toISOString(),
            startDate: new Date(newEvent.startDate).toISOString(),
            endDate: newEvent.endDate
              ? new Date(newEvent.endDate).toISOString()
              : null,
          },
        };
      } catch (error) {
        console.error("Error creating event:", error);
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message: "Failed to create event",
        });
      }
    }),

  // Update event
  update: withAuth
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(1).max(100).optional(),
        description: z.string().max(1000).optional(),
        startDate: z.string().optional(),
        endDate: z.string().nullable().optional(),
        locations: z.array(z.string().min(1).max(200)).min(1).optional(),
        minAge: z.number().min(0).max(100).optional(),
        maxAge: z.number().min(0).max(100).optional(),
        maxParticipants: z.number().min(1).optional(),
        price: z.string().max(20).nullable().optional(),
        status: z
          .enum(["draft", "open", "closed", "full", "cancelled"])
          .optional(),
        imageUrl: z.string().nullable().optional(),
        imageFile: z.instanceof(File).optional(),
        // Extended information fields
        detailedDescription: z.string().max(5000).nullable().optional(),
        program: z.string().max(3000).nullable().optional(),
        requirements: z.string().max(1000).nullable().optional(),
        whatToBring: z.string().max(1000).nullable().optional(),
        parentNotes: z.string().max(2000).nullable().optional(),
        emergencyContacts: z.string().max(1000).nullable().optional(),
        meetingPoint: z.string().max(500).nullable().optional(),
        dropOffTime: z.string().max(20).nullable().optional(),
        pickUpTime: z.string().max(20).nullable().optional(),
        includesLunch: z.boolean().nullable().optional(),
        includesSnack: z.boolean().nullable().optional(),
        transportProvided: z.boolean().nullable().optional(),
        weatherDependent: z.boolean().nullable().optional(),
        specialNotes: z.string().max(2000).nullable().optional(),
        cancellationPolicy: z.string().max(1000).nullable().optional(),
        photographyConsent: z.boolean().nullable().optional(),
        willTakePhotos: z.boolean().nullable().optional(),
        photosForSocialMedia: z.boolean().nullable().optional(),
        additionalImages: z.string().nullable().optional(),
      }),
    )
    .output(SuccessResponse(Event))
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
          ["amministratore", "editor"].includes(membership[0].role);

        if (!isAdmin) {
          throw new ORPCError("FORBIDDEN", {
            message: "Access denied",
          });
        }

        const updateData: any = {
          updatedAt: new Date(),
        };

        if (input.title !== undefined) {
          updateData.title = input.title;
        }
        if (input.description !== undefined) {
          updateData.description = input.description;
        }
        if (input.startDate !== undefined) {
          updateData.startDate = new Date(input.startDate);
        }
        if (input.endDate !== undefined) {
          updateData.endDate = input.endDate ? new Date(input.endDate) : null;
        }
        if (input.locations !== undefined) {
          updateData.locations = JSON.stringify(input.locations);
        }
        if (input.minAge !== undefined) {
          updateData.minAge = input.minAge;
        }
        if (input.maxAge !== undefined) {
          updateData.maxAge = input.maxAge;
        }
        if (input.maxParticipants !== undefined) {
          updateData.maxParticipants = input.maxParticipants;
        }
        if (input.price !== undefined) {
          updateData.price = input.price;
        }
        if (input.status !== undefined) {
          updateData.status = input.status;
        }

        // Handle file upload if provided
        if (input.imageFile) {
          try {
            // Validate file size (5MB limit)
            if (input.imageFile.size > 5 * 1024 * 1024) {
              throw new ORPCError("BAD_REQUEST", {
                message: "File size exceeds 5MB limit",
              });
            }

            // Validate file type
            const allowedTypes = [
              "image/jpeg",
              "image/jpg",
              "image/png",
              "image/webp",
            ];
            if (!allowedTypes.includes(input.imageFile.type)) {
              throw new ORPCError("BAD_REQUEST", {
                message:
                  "Invalid file type. Only JPEG, PNG, and WebP are allowed",
              });
            }

            // Convert File to base64 data URL for storage
            const buffer = await input.imageFile.arrayBuffer();
            const base64 = Buffer.from(buffer).toString("base64");
            const mimeType = input.imageFile.type || "image/jpeg";
            updateData.imageUrl = `data:${mimeType};base64,${base64}`;
          } catch (fileError) {
            console.error("Error processing uploaded file:", fileError);

            // Re-throw ORPCError as-is
            if (fileError instanceof ORPCError) {
              throw fileError;
            }

            throw new ORPCError("BAD_REQUEST", {
              message: "Failed to process uploaded file",
            });
          }
        } else if (input.imageUrl !== undefined) {
          updateData.imageUrl = input.imageUrl;
        }

        // Update extended information fields
        if (input.detailedDescription !== undefined) {
          updateData.detailedDescription = input.detailedDescription;
        }
        if (input.program !== undefined) {
          updateData.program = input.program;
        }
        if (input.requirements !== undefined) {
          updateData.requirements = input.requirements;
        }
        if (input.whatToBring !== undefined) {
          updateData.whatToBring = input.whatToBring;
        }
        if (input.parentNotes !== undefined) {
          updateData.parentNotes = input.parentNotes;
        }
        if (input.emergencyContacts !== undefined) {
          updateData.emergencyContacts = input.emergencyContacts;
        }
        if (input.meetingPoint !== undefined) {
          updateData.meetingPoint = input.meetingPoint;
        }
        if (input.dropOffTime !== undefined) {
          updateData.dropOffTime = input.dropOffTime;
        }
        if (input.pickUpTime !== undefined) {
          updateData.pickUpTime = input.pickUpTime;
        }
        if (input.includesLunch !== undefined) {
          updateData.includesLunch = input.includesLunch;
        }
        if (input.includesSnack !== undefined) {
          updateData.includesSnack = input.includesSnack;
        }
        if (input.transportProvided !== undefined) {
          updateData.transportProvided = input.transportProvided;
        }
        if (input.weatherDependent !== undefined) {
          updateData.weatherDependent = input.weatherDependent;
        }
        if (input.specialNotes !== undefined) {
          updateData.specialNotes = input.specialNotes;
        }
        if (input.cancellationPolicy !== undefined) {
          updateData.cancellationPolicy = input.cancellationPolicy;
        }
        if (input.photographyConsent !== undefined) {
          updateData.photographyConsent = input.photographyConsent;
        }
        if (input.willTakePhotos !== undefined) {
          updateData.willTakePhotos = input.willTakePhotos;
        }
        if (input.photosForSocialMedia !== undefined) {
          updateData.photosForSocialMedia = input.photosForSocialMedia;
        }
        if (input.additionalImages !== undefined) {
          updateData.additionalImages = input.additionalImages;
        }

        const updateResult = await db
          .update(events)
          .set(updateData)
          .where(eq(events.id, input.id))
          .returning();

        if (updateResult.length === 0) {
          throw new ORPCError("NOT_FOUND", {
            message: "Event not found or update failed",
          });
        }

        return {
          success: true,
          data: {
            ...updateResult[0],
            createdAt: new Date(updateResult[0].createdAt).toISOString(),
            updatedAt: new Date(updateResult[0].updatedAt).toISOString(),
            startDate: new Date(updateResult[0].startDate).toISOString(),
            endDate: updateResult[0].endDate
              ? new Date(updateResult[0].endDate).toISOString()
              : null,
          },
        };
      } catch (error) {
        console.error("Error updating event:", error);

        // Re-throw ORPCError as-is
        if (error instanceof ORPCError) {
          throw error;
        }

        // Handle validation errors (Zod)
        if (
          error &&
          typeof error === "object" &&
          "name" in error &&
          error.name === "ZodError"
        ) {
          console.error("Validation error details:", error);
          throw new ORPCError("BAD_REQUEST", {
            message: "Invalid input data provided",
          });
        }

        // Handle database errors
        if (error instanceof Error) {
          if (error.message.includes("FOREIGN KEY constraint")) {
            throw new ORPCError("BAD_REQUEST", {
              message: "Invalid references in event data",
            });
          }

          if (error.message.includes("NOT NULL constraint")) {
            throw new ORPCError("BAD_REQUEST", {
              message: "Missing required event fields",
            });
          }

          if (error.message.includes("UNIQUE constraint")) {
            throw new ORPCError("BAD_REQUEST", {
              message: "Event with this data already exists",
            });
          }

          console.error("Detailed error:", {
            message: error.message,
            stack: error.stack,
            input: JSON.stringify(
              input,
              (key, value) => {
                // Don't log the actual file content, just metadata
                if (key === "imageFile" && value) {
                  return {
                    name: value.name,
                    size: value.size,
                    type: value.type,
                  };
                }
                return value;
              },
              2,
            ),
          });
        }

        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message: "Failed to update event",
        });
      }
    }),
});
