import { ORPCError, os } from "@orpc/server";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod";
import { db } from "../../db";
import { children } from "../../db/schema";
import { checkFamilyMembership, SuccessResponse } from "../helpers";
import { Child } from "../schemas";
import { withAuth } from "../middleware";

export const childrenRouter = os.router({
  // Get children in family
  getChildren: withAuth
    .input(
      z.object({
        familyId: z.string(),
      }),
    )
    .output(SuccessResponse(z.array(Child)))
    .handler(async ({ input, context }) => {
      await checkFamilyMembership(input.familyId, context.user.id);

      try {
        const familyChildren = await db
          .select()
          .from(children)
          .where(eq(children.familyId, input.familyId));

        return {
          success: true,
          data: familyChildren.map((child) => ({
            ...child,
            createdAt: new Date(child.createdAt).toISOString(),
            updatedAt: new Date(child.updatedAt).toISOString(),
          })),
        };
      } catch (error) {
        console.error("Error fetching children:", error);
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message: "Failed to fetch children",
        });
      }
    }),

  // Add child to family
  addChild: withAuth
    .input(
      z.object({
        familyId: z.string(),
        firstName: z.string().min(1).max(50),
        lastName: z.string().min(1).max(50),
        birthDate: z.string(), // ISO date string
        birthPlace: z.string().max(100).optional(),
        fiscalCode: z.string().max(16).optional(),
        gender: z.enum(["M", "F", "O"]).optional(),
        allergies: z.string().max(1000).optional(),
        medicalNotes: z.string().max(1000).optional(),
      }),
    )
    .output(SuccessResponse(Child))
    .handler(async ({ input, context }) => {
      await checkFamilyMembership(input.familyId, context.user.id);

      const childId = nanoid();

      try {
        await db.insert(children).values({
          id: childId,
          familyId: input.familyId,
          firstName: input.firstName,
          lastName: input.lastName,
          birthDate: input.birthDate,
          birthPlace: input.birthPlace || null,
          fiscalCode: input.fiscalCode || null,
          gender: input.gender || null,
          allergies: input.allergies || null,
          medicalNotes: input.medicalNotes || null,
          avatarUrl: null,
        });

        const newChild = await db
          .select()
          .from(children)
          .where(eq(children.id, childId))
          .limit(1);

        return {
          success: true,
          data: {
            ...newChild[0],
            createdAt: new Date(newChild[0].createdAt).toISOString(),
            updatedAt: new Date(newChild[0].updatedAt).toISOString(),
          },
        };
      } catch (error) {
        console.error("Error adding child:", error);
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message: "Failed to add child",
        });
      }
    }),

  // Update child
  updateChild: withAuth
    .input(
      z.object({
        id: z.string(),
        firstName: z.string().min(1).max(50).optional(),
        lastName: z.string().min(1).max(50).optional(),
        birthDate: z.string().optional(), // ISO date string
        birthPlace: z.string().max(100).optional(),
        fiscalCode: z.string().max(16).optional(),
        gender: z.enum(["M", "F", "O"]).optional(),
        allergies: z.string().max(1000).optional(),
        medicalNotes: z.string().max(1000).optional(),
      }),
    )
    .output(SuccessResponse(Child))
    .handler(async ({ input, context }) => {
      // First, get the child to check family membership
      const child = await db
        .select()
        .from(children)
        .where(eq(children.id, input.id))
        .limit(1);

      if (child.length === 0) {
        throw new ORPCError("NOT_FOUND", { message: "Child not found" });
      }

      await checkFamilyMembership(child[0].familyId, context.user.id);

      try {
        const updateData: any = {
          updatedAt: Math.floor(Date.now() / 1000),
        };

        // Only include fields that are explicitly provided
        if (input.firstName !== undefined) {
          updateData.firstName = input.firstName;
        }
        if (input.lastName !== undefined) {
          updateData.lastName = input.lastName;
        }
        if (input.birthDate !== undefined) {
          updateData.birthDate = input.birthDate;
        }
        if (input.birthPlace !== undefined) {
          updateData.birthPlace = input.birthPlace || null;
        }
        if (input.fiscalCode !== undefined) {
          updateData.fiscalCode = input.fiscalCode || null;
        }
        if (input.gender !== undefined) {
          updateData.gender = input.gender || null;
        }
        if (input.allergies !== undefined) {
          updateData.allergies = input.allergies || null;
        }
        if (input.medicalNotes !== undefined) {
          updateData.medicalNotes = input.medicalNotes || null;
        }

        console.log("Updating child with data:", updateData);

        await db
          .update(children)
          .set(updateData)
          .where(eq(children.id, input.id));

        const updatedChild = await db
          .select()
          .from(children)
          .where(eq(children.id, input.id))
          .limit(1);

        return {
          success: true,
          data: {
            ...updatedChild[0],
            createdAt: new Date(
              Number(updatedChild[0].createdAt) * 1000,
            ).toISOString(),
            updatedAt: new Date(child[0].updatedAt).toISOString(),
          },
        };
      } catch (error) {
        console.error("Error adding child:", error);
        console.error("Update data was:", input);
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message: `Failed to update child: ${(error as Error).message}`,
        });
      }
    }),
});
