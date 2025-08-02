import { ORPCError, os } from "@orpc/server";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod";
import { db } from "../../db";
import {
  authorizedPersons,
  children,
  families,
  familyMembers,
} from "../../db/schema";
import { checkFamilyMembership, SuccessResponse } from "../helpers";
import { withAuth } from "../middleware";
import { Family } from "../schemas";

export const coreRouter = os.router({
  // Get user's families
  list: withAuth
    .output(
      SuccessResponse(
        z.array(
          z.object({
            family: Family.extend({
              _count: z.object({
                children: z.number(),
                authorizedPersons: z.number(),
              }),
            }),
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

        // Get counts for each family
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

        // Create count maps for quick lookup
        const childrenCountMap = new Map(
          childrenCounts.map((item) => [item.familyId, item.count]),
        );
        const personsCountMap = new Map(
          authorizedPersonsCounts.map((item) => [item.familyId, item.count]),
        );

        return {
          success: true,
          data: userFamilies.map((item) => ({
            family: {
              ...item.family!,
              _count: {
                children: childrenCountMap.get(item.family!.id) || 0,
                authorizedPersons: personsCountMap.get(item.family!.id) || 0,
              },
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
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message: "Failed to fetch families",
        });
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
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message: "Failed to create family",
        });
      }
    }),

  // Update family
  updateFamily: withAuth
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).max(100).optional(),
        description: z.string().max(500).optional(),
      }),
    )
    .output(SuccessResponse(Family))
    .handler(async ({ input, context }) => {
      await checkFamilyMembership(input.id, context.user.id);

      try {
        const updateData: any = {
          updatedAt: Math.floor(Date.now() / 1000),
        };

        if (input.name !== undefined) {
          updateData.name = input.name;
        }
        if (input.description !== undefined) {
          updateData.description = input.description;
        }

        await db
          .update(families)
          .set(updateData)
          .where(eq(families.id, input.id));

        const updatedFamily = await db
          .select()
          .from(families)
          .where(eq(families.id, input.id))
          .limit(1);

        return {
          success: true,
          data: {
            ...updatedFamily[0],
            createdAt: new Date(updatedFamily[0].createdAt).toISOString(),
            updatedAt: new Date(updatedFamily[0].updatedAt).toISOString(),
          },
        };
      } catch (error) {
        console.error("Error updating family:", error);
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message: "Failed to update family",
        });
      }
    }),
});
