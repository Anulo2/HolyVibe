import { ORPCError, os } from "@orpc/server";
import { and, desc, eq, gte, like, lte, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod";
import { db } from "../db";
import {
  eventRegistrations,
  events,
  families,
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
    .output(SuccessResponse(Event))
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
      } catch (error) {
        console.error("Error fetching recent activity:", error);
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message: "Failed to fetch recent activity",
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
        location: z.string().min(1).max(200),
        minAge: z.number().min(0).max(100),
        maxAge: z.number().min(0).max(100),
        maxParticipants: z.number().min(1),
        price: z.string().max(20).optional(),
        imageUrl: z.string().optional(),
        imageFile: z.instanceof(File).optional(),
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
          location: input.location,
          minAge: input.minAge,
          maxAge: input.maxAge,
          maxParticipants: input.maxParticipants,
          currentParticipants: 0,
          price: input.price || null,
          status: "draft" as const,
          imageUrl: finalImageUrl,
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
        location: z.string().max(200).optional(),
        minAge: z.number().min(0).max(100).optional(),
        maxAge: z.number().min(0).max(100).optional(),
        maxParticipants: z.number().min(1).optional(),
        price: z.string().max(20).optional(),
        status: z
          .enum(["draft", "open", "closed", "full", "cancelled"])
          .optional(),
        imageUrl: z.string().optional(),
        imageFile: z.instanceof(File).optional(),
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
        if (input.location !== undefined) {
          updateData.location = input.location;
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
