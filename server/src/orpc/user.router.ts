import { ORPCError, os } from "@orpc/server";
import { and, desc, eq, inArray, like, sql } from "drizzle-orm";
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
  user as userTable,
} from "../db/schema";
import { SuccessResponse } from "./helpers";
import { withAuth } from "./middleware";
import { User, UserWithRole } from "./schemas";

export const userRouter = os.router({
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
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message: "Failed to fetch user role",
        });
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
        // Prepare update data - only include fields that are provided
        const updateData: any = {
          updatedAt: new Date(),
        };

        if (input.name !== undefined) {
          updateData.name = input.name;
        }
        if (input.email !== undefined) {
          updateData.email = input.email;
        }
        if (input.phoneNumber !== undefined) {
          updateData.phoneNumber = input.phoneNumber;
        }
        if (input.birthDate !== undefined) {
          updateData.birthDate = input.birthDate;
        }

        // Update the user in the database
        await db
          .update(userTable)
          .set(updateData)
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
          },
        };
      } catch (error) {
        console.error("Error updating user profile:", error);
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message: "Failed to update user profile",
        });
      }
    }),

  // Get users list (admin only)
  list: withAuth
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
        search: z.string().max(100).optional(),
        role: z.string().optional(),
      }),
    )
    .output(
      SuccessResponse(
        z.object({
          users: z.array(UserWithRole),
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

        const isAdmin =
          membership.length > 0 &&
          ["amministratore", "editor"].includes(membership[0].role);

        if (!isAdmin) {
          throw new ORPCError("FORBIDDEN", {
            message: "Access denied",
          });
        }

        // Build query conditions
        const conditions = [];
        if (input.search) {
          const searchTerm = `%${input.search}%`;
          conditions.push(
            sql`(${userTable.name} LIKE ${searchTerm} OR ${userTable.email} LIKE ${searchTerm})`,
          );
        }

        // Get users with role information
        const users = await db
          .select({
            user: userTable,
            membership: organizationMember,
          })
          .from(userTable)
          .leftJoin(
            organizationMember,
            eq(userTable.id, organizationMember.userId),
          )
          .where(conditions.length > 0 ? and(...conditions) : undefined)
          .orderBy(desc(userTable.createdAt))
          .limit(input.limit)
          .offset(input.offset);

        // Get total count
        const [totalResult] = await db
          .select({ count: sql<number>`count(*)` })
          .from(userTable)
          .where(conditions.length > 0 ? and(...conditions) : undefined);

        // Filter by role if specified
        let filteredUsers = users;
        if (input.role) {
          filteredUsers = users.filter(
            (item) => item.membership?.role === input.role,
          );
        }

        return {
          success: true,
          data: {
            users: filteredUsers.map((item) => ({
              ...item.user,
              createdAt: new Date(item.user.createdAt).toISOString(),
              updatedAt: new Date(item.user.updatedAt).toISOString(),
              birthDate: item.user.birthDate
                ? new Date(item.user.birthDate).toISOString()
                : null,
              role: item.membership?.role || null,
              organizationId: item.membership?.organizationId || null,
              joinedAt: item.membership?.createdAt
                ? new Date(item.membership.createdAt).toISOString()
                : null,
            })),
            total: totalResult.count,
          },
        };
      } catch (error) {
        console.error("Error fetching users:", error);
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message: "Failed to fetch users",
        });
      }
    }),

  // Get user details with family information
  getDetails: withAuth
    .input(
      z.object({
        userId: z.string(),
      }),
    )
    .output(
      SuccessResponse(
        z.object({
          user: User,
          families: z.array(
            z.object({
              id: z.string(),
              name: z.string(),
              role: z.string(),
              isAdmin: z.boolean(),
              childrenCount: z.number(),
              authorizedPersonsCount: z.number(),
            }),
          ),
          registrations: z.array(
            z.object({
              id: z.string(),
              eventId: z.string(),
              status: z.string(),
              registrationDate: z.string(),
              event: z.object({
                title: z.string(),
                startDate: z.string(),
              }),
            }),
          ),
        }),
      ),
    )
    .handler(async ({ input, context }) => {
      try {
        // Check if user is admin or requesting own details
        const membership = await db
          .select()
          .from(organizationMember)
          .where(eq(organizationMember.userId, context.user.id))
          .limit(1);

        const isAdmin =
          membership.length > 0 &&
          ["amministratore", "editor"].includes(membership[0].role);

        if (!isAdmin && context.user.id !== input.userId) {
          throw new ORPCError("FORBIDDEN", {
            message: "Access denied",
          });
        }

        // Get user details
        const user = await db
          .select()
          .from(userTable)
          .where(eq(userTable.id, input.userId))
          .limit(1);

        if (user.length === 0) {
          throw new ORPCError("NOT_FOUND", {
            message: "User not found",
          });
        }

        // Get user's families
        const userFamilies = await db
          .select({
            family: families,
            member: familyMembers,
          })
          .from(familyMembers)
          .leftJoin(families, eq(familyMembers.familyId, families.id))
          .where(eq(familyMembers.userId, input.userId));

        // Get children count for each family
        const familyIds = userFamilies.map((item) => item.family!.id);
        let childrenCounts: { familyId: string; count: number }[] = [];
        let authorizedPersonsCounts: { familyId: string; count: number }[] = [];

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

        const childrenCountMap = new Map(
          childrenCounts.map((item) => [item.familyId, item.count]),
        );
        const personsCountMap = new Map(
          authorizedPersonsCounts.map((item) => [item.familyId, item.count]),
        );

        // Get user's registrations
        // Get user's registrations
        const registrations = await db
          .select({
            registration: eventRegistrations,
            event: events,
          })
          .from(eventRegistrations)
          .leftJoin(events, eq(eventRegistrations.eventId, events.id))
          .where(eq(eventRegistrations.parentId, input.userId))
          .orderBy(desc(eventRegistrations.registrationDate));

        return {
          success: true,
          data: {
            user: {
              ...user[0],
              createdAt: new Date(user[0].createdAt).toISOString(),
              updatedAt: new Date(user[0].updatedAt).toISOString(),
            },
            families: userFamilies.map((item) => ({
              id: item.family!.id,
              name: item.family!.name,
              role: item.member.role,
              isAdmin: item.member.isAdmin,
              childrenCount: childrenCountMap.get(item.family!.id) || 0,
              authorizedPersonsCount: personsCountMap.get(item.family!.id) || 0,
            })),
            registrations: registrations.map((item) => ({
              id: item.registration.id,
              eventId: item.registration.eventId,
              status: item.registration.status,
              registrationDate: new Date(
                item.registration.registrationDate,
              ).toISOString(),
              event: {
                title: item.event!.title,
                startDate: new Date(item.event!.startDate).toISOString(),
              },
            })),
          },
        };
      } catch (error) {
        console.error("Error fetching user details:", error);
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message: "Failed to fetch user details",
        });
      }
    }),

  // Update user role
  updateRole: withAuth
    .input(
      z.object({
        userId: z.string(),
        role: z.enum([
          "amministratore",
          "editor",
          "visualizzatore",
          "animatore",
          "genitore",
        ]),
      }),
    )
    .output(
      SuccessResponse(
        z.object({
          userId: z.string(),
          role: z.string(),
        }),
      ),
    )
    .handler(async ({ input, context }) => {
      try {
        // Check if current user is admin
        const currentUserMembership = await db
          .select()
          .from(organizationMember)
          .where(eq(organizationMember.userId, context.user.id))
          .limit(1);

        if (
          currentUserMembership.length === 0 ||
          currentUserMembership[0].role !== "amministratore"
        ) {
          throw new ORPCError("FORBIDDEN", {
            message: "Only administrators can update user roles",
          });
        }

        // Check if target user exists in organization
        const targetUserMembership = await db
          .select()
          .from(organizationMember)
          .where(eq(organizationMember.userId, input.userId))
          .limit(1);

        if (targetUserMembership.length === 0) {
          throw new ORPCError("NOT_FOUND", {
            message: "User not found in organization",
          });
        }

        // Update user role
        await db
          .update(organizationMember)
          .set({
            role: input.role,
            updatedAt: new Date(),
          })
          .where(eq(organizationMember.userId, input.userId));

        return {
          success: true,
          data: {
            userId: input.userId,
            role: input.role,
          },
        };
      } catch (error) {
        console.error("Error updating user role:", error);
        if (error instanceof ORPCError) throw error;
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message: "Failed to update user role",
        });
      }
    }),

  // Remove user from organization
  removeFromOrganization: withAuth
    .input(
      z.object({
        userId: z.string(),
      }),
    )
    .output(
      SuccessResponse(
        z.object({
          userId: z.string(),
          removed: z.boolean(),
        }),
      ),
    )
    .handler(async ({ input, context }) => {
      try {
        // Check if current user is admin
        const currentUserMembership = await db
          .select()
          .from(organizationMember)
          .where(eq(organizationMember.userId, context.user.id))
          .limit(1);

        if (
          currentUserMembership.length === 0 ||
          currentUserMembership[0].role !== "amministratore"
        ) {
          throw new ORPCError("FORBIDDEN", {
            message: "Only administrators can remove users from organization",
          });
        }

        // Prevent admin from removing themselves
        if (input.userId === context.user.id) {
          throw new ORPCError("BAD_REQUEST", {
            message: "Cannot remove yourself from organization",
          });
        }

        // Check if target user exists in organization
        const targetUserMembership = await db
          .select()
          .from(organizationMember)
          .where(eq(organizationMember.userId, input.userId))
          .limit(1);

        if (targetUserMembership.length === 0) {
          throw new ORPCError("NOT_FOUND", {
            message: "User not found in organization",
          });
        }

        // Remove user from organization
        await db
          .delete(organizationMember)
          .where(eq(organizationMember.userId, input.userId));

        return {
          success: true,
          data: {
            userId: input.userId,
            removed: true,
          },
        };
      } catch (error) {
        console.error("Error removing user from organization:", error);
        if (error instanceof ORPCError) throw error;
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message: "Failed to remove user from organization",
        });
      }
    }),
});
