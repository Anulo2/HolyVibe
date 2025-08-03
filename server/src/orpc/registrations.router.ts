import { ORPCError, os } from "@orpc/server";
import { and, desc, eq, inArray, ne, sql } from "drizzle-orm";
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

        // Get all family parents for all registrations
        const familyIds = registrations
          .map((r) => r.family?.id)
          .filter(Boolean) as string[];

        const allFamilyParents =
          familyIds.length > 0
            ? await db
                .select({
                  familyId: familyMembers.familyId,
                  user: userTable,
                })
                .from(familyMembers)
                .leftJoin(userTable, eq(familyMembers.userId, userTable.id))
                .where(
                  and(
                    inArray(familyMembers.familyId, familyIds),
                    eq(familyMembers.role, "parent"),
                  ),
                )
            : [];

        // Group family parents by family ID
        const parentsMap = new Map<string, any[]>();
        allFamilyParents.forEach((item) => {
          if (!parentsMap.has(item.familyId)) {
            parentsMap.set(item.familyId, []);
          }
          if (item.user) {
            parentsMap.get(item.familyId)!.push({
              id: item.user.id,
              name: item.user.name || "",
              email: item.user.email,
              phoneNumber: item.user.phoneNumber,
            });
          }
        });

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
              photoPrivacyConsent: item.registration.photoPrivacyConsent,
              dataPrivacyConsent: item.registration.dataPrivacyConsent,
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
              parents: item.family ? parentsMap.get(item.family.id) || [] : [],
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

        // Get all family parents
        const familyParents = item.family
          ? await db
              .select({
                user: userTable,
              })
              .from(familyMembers)
              .leftJoin(userTable, eq(familyMembers.userId, userTable.id))
              .where(
                and(
                  eq(familyMembers.familyId, item.family.id),
                  eq(familyMembers.role, "parent"),
                ),
              )
          : [];

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
            photoPrivacyConsent: item.registration.photoPrivacyConsent,
            dataPrivacyConsent: item.registration.dataPrivacyConsent,
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
            parents: familyParents
              .filter((parent) => parent.user)
              .map((parent) => ({
                id: parent.user!.id,
                name: parent.user!.name || "",
                email: parent.user!.email,
                phoneNumber: parent.user!.phoneNumber,
              })),
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
        // Get event and its creator's organization
        const eventWithCreator = await db
          .select({
            event: events,
            organizationId: organizationMember.organizationId,
          })
          .from(events)
          .innerJoin(
            organizationMember,
            eq(events.createdBy, organizationMember.userId),
          )
          .where(eq(events.id, input.eventId))
          .limit(1);

        if (eventWithCreator.length === 0) {
          throw new ORPCError("NOT_FOUND", {
            message: "Event not found or not associated with any organization",
          });
        }

        const eventOrganizationId = eventWithCreator[0].organizationId;

        // Check if parent is already in the organization
        const parentMembership = await db
          .select()
          .from(organizationMember)
          .where(
            and(
              eq(organizationMember.userId, userId),
              eq(organizationMember.organizationId, eventOrganizationId),
            ),
          )
          .limit(1);

        // If parent is not in organization, add them with "genitore" role
        if (parentMembership.length === 0) {
          await db.insert(organizationMember).values({
            id: nanoid(),
            organizationId: eventOrganizationId,
            userId: userId,
            role: "genitore",
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }

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

        // Check if child is already registered for this event (excluding cancelled registrations)
        const existingRegistration = await db
          .select()
          .from(eventRegistrations)
          .where(
            and(
              eq(eventRegistrations.eventId, input.eventId),
              eq(eventRegistrations.childId, input.childId),
              ne(eventRegistrations.status, "cancelled"), // Exclude cancelled registrations
            ),
          )
          .limit(1);

        if (existingRegistration.length > 0) {
          const status = existingRegistration[0].status;
          const statusText =
            {
              pending: "in attesa di conferma",
              confirmed: "confermata",
              waitlist: "in lista d'attesa",
              cancelled: "annullata",
            }[status] || status;

          throw new ORPCError("CONFLICT", {
            message: `Il bambino è già iscritto a questo evento (stato: ${statusText})`,
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

  // Get user's registrations for history
  myRegistrations: withAuth
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(20),
        status: z
          .enum(["pending", "confirmed", "cancelled", "waitlist"])
          .optional(),
        childId: z.string().optional(),
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
        const userId = context.user.id;
        const offset = (input.page - 1) * input.limit;

        // First, get all families where the current user is a member
        const userFamilies = await db
          .select({ familyId: familyMembers.familyId })
          .from(familyMembers)
          .where(eq(familyMembers.userId, userId));

        const userFamilyIds = userFamilies.map((f) => f.familyId);

        if (userFamilyIds.length === 0) {
          return {
            success: true,
            data: {
              registrations: [],
              total: 0,
              page: input.page,
              limit: input.limit,
            },
          };
        }

        // Build where conditions - now include all children from user's families
        const whereConditions = [];

        // Get all children from user's families
        const familyChildren = await db
          .select({ childId: children.id })
          .from(children)
          .where(inArray(children.familyId, userFamilyIds));

        const childIds = familyChildren.map((c) => c.childId);

        if (childIds.length === 0) {
          return {
            success: true,
            data: {
              registrations: [],
              total: 0,
              page: input.page,
              limit: input.limit,
            },
          };
        }

        whereConditions.push(inArray(eventRegistrations.childId, childIds));

        if (input.status) {
          whereConditions.push(eq(eventRegistrations.status, input.status));
        }
        if (input.childId) {
          whereConditions.push(eq(eventRegistrations.childId, input.childId));
        }

        const whereClause = and(...whereConditions);

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

        // Get all family parents for all registrations
        const familyIds = registrations
          .map((r) => r.family?.id)
          .filter(Boolean) as string[];

        const allFamilyParents =
          familyIds.length > 0
            ? await db
                .select({
                  familyId: familyMembers.familyId,
                  user: userTable,
                })
                .from(familyMembers)
                .leftJoin(userTable, eq(familyMembers.userId, userTable.id))
                .where(
                  and(
                    inArray(familyMembers.familyId, familyIds),
                    eq(familyMembers.role, "parent"),
                  ),
                )
            : [];

        // Group family parents by family ID
        const parentsMap = new Map<string, any[]>();
        allFamilyParents.forEach((item) => {
          if (!parentsMap.has(item.familyId)) {
            parentsMap.set(item.familyId, []);
          }
          if (item.user) {
            parentsMap.get(item.familyId)!.push({
              id: item.user.id,
              name: item.user.name || "",
              email: item.user.email,
              phoneNumber: item.user.phoneNumber,
            });
          }
        });

        // Get authorized persons for each registration
        const authorizedPersonsMap = new Map<string, any[]>();
        authorizedPersonsData.forEach((item) => {
          if (!authorizedPersonsMap.has(item.registrationId)) {
            authorizedPersonsMap.set(item.registrationId, []);
          }
          if (item.person) {
            authorizedPersonsMap.get(item.registrationId)!.push({
              id: item.person!.id,
              fullName: item.person!.fullName,
              relationship: item.person!.relationship,
              phone: item.person!.phone,
              email: item.person!.email,
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
              photoPrivacyConsent: item.registration.photoPrivacyConsent,
              dataPrivacyConsent: item.registration.dataPrivacyConsent,
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
              parents: item.family ? parentsMap.get(item.family.id) || [] : [],
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
        console.error("Error fetching user registrations:", error);
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message: "Failed to fetch registrations",
        });
      }
    }),

  // Cancel registration (for parents)
  cancel: withAuth
    .input(z.object({ id: z.string() }))
    .output(
      SuccessResponse(
        z.object({
          id: z.string(),
          status: z.string(),
        }),
      ),
    )
    .handler(async ({ input, context }) => {
      const userId = context.user.id;

      try {
        // First, verify that this registration belongs to a child from user's families
        const userFamilies = await db
          .select({ familyId: familyMembers.familyId })
          .from(familyMembers)
          .where(eq(familyMembers.userId, userId));

        const userFamilyIds = userFamilies.map((f) => f.familyId);

        if (userFamilyIds.length === 0) {
          throw new ORPCError("FORBIDDEN", {
            message: "Access denied",
          });
        }

        // Get the registration and verify access
        const registration = await db
          .select({
            registration: eventRegistrations,
            child: children,
          })
          .from(eventRegistrations)
          .leftJoin(children, eq(eventRegistrations.childId, children.id))
          .where(eq(eventRegistrations.id, input.id))
          .limit(1);

        if (!registration[0]) {
          throw new ORPCError("NOT_FOUND", {
            message: "Registration not found",
          });
        }

        const reg = registration[0];

        // Verify the child belongs to one of user's families
        if (!reg.child || !userFamilyIds.includes(reg.child.familyId)) {
          throw new ORPCError("FORBIDDEN", {
            message: "You don't have permission to cancel this registration",
          });
        }

        // Check if registration can be cancelled (only pending registrations)
        if (reg.registration.status !== "pending") {
          throw new ORPCError("BAD_REQUEST", {
            message: "Only pending registrations can be cancelled",
          });
        }

        // Update registration status to cancelled
        await db
          .update(eventRegistrations)
          .set({
            status: "cancelled",
            updatedAt: new Date(),
          })
          .where(eq(eventRegistrations.id, input.id));

        return {
          success: true,
          data: {
            id: input.id,
            status: "cancelled",
          },
        };
      } catch (error) {
        console.error("Error cancelling registration:", error);
        if (error instanceof ORPCError) throw error;
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message: "Failed to cancel registration",
        });
      }
    }),
});
