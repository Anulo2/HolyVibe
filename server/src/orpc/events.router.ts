import { ORPCError, os } from "@orpc/server";
import { and, desc, eq, gte, like, lte, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod";
import { db } from "../db";
import {
  eventRegistrations,
  events,
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

  // Create event
  create: withAuth
    .input(
      z.object({
        title: z.string().min(1).max(100),
        description: z.string().max(1000).optional(),
        startDate: z.string(), // ISO date string
        endDate: z.string().optional(), // ISO date string
        location: z.string().max(200).optional(),
        minAge: z.number().min(0).max(100).optional(),
        maxAge: z.number().min(0).max(100).optional(),
        maxParticipants: z.number().min(1).optional(),
        price: z.string().max(20).optional(),
        imageUrl: z.string().max(500).optional(),
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

        // Create the event object
        const eventData = {
          id: eventId,
          title: input.title,
          description: input.description || "",
          startDate: new Date(input.startDate),
          endDate: input.endDate ? new Date(input.endDate) : null,
          location: input.location || "",
          minAge: input.minAge || 0,
          maxAge: input.maxAge || 100,
          maxParticipants: input.maxParticipants || 50,
          currentParticipants: 0,
          price: input.price || null,
          status: "draft" as const,
          imageUrl: input.imageUrl || null,
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
        imageUrl: z.string().max(500).optional(),
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
          updatedAt: Math.floor(Date.now() / 1000),
        };

        if (input.title !== undefined) {
          updateData.title = input.title;
        }
        if (input.description !== undefined) {
          updateData.description = input.description;
        }
        if (input.startDate !== undefined) {
          updateData.startDate = new Date(input.startDate).getTime() / 1000;
        }
        if (input.endDate !== undefined) {
          updateData.endDate = input.endDate
            ? new Date(input.endDate).getTime() / 1000
            : null;
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
        if (input.imageUrl !== undefined) {
          updateData.imageUrl = input.imageUrl;
        }

        await db.update(events).set(updateData).where(eq(events.id, input.id));

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
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message: "Failed to update event",
        });
      }
    }),
});
