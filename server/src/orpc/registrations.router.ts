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
  familyMembers,
  families,
  registrationAuthorizedPersons,
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
          registrationDate: new Date(),
        });

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
});
