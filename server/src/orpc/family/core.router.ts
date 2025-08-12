import { ORPCError, os } from "@orpc/server";
import { eq, inArray, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod";
import { db } from "../../db";
import {
	authorizedPersons,
	children,
	families,
	familyMembers,
	user as userTable,
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
				const familyIds = userFamilies.map((item) => item.family?.id);

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
								children: childrenCountMap.get(item.family?.id) || 0,
								authorizedPersons: personsCountMap.get(item.family?.id) || 0,
							},
							createdAt: new Date(item.family?.createdAt).toISOString(),
							updatedAt: new Date(item.family?.updatedAt).toISOString(),
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
					updatedAt: new Date(),
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

	// Get family members (parents/guardians)
	getMembers: withAuth
		.input(
			z.object({
				familyId: z.string(),
			}),
		)
		.output(
			SuccessResponse(
				z.array(
					z.object({
						id: z.string(),
						familyId: z.string(),
						userId: z.string(),
						role: z.enum(["parent", "guardian"]),
						isAdmin: z.boolean(),
						joinedAt: z.string(),
						createdAt: z.string(),
						updatedAt: z.string(),
						user: z.object({
							id: z.string(),
							name: z.string().nullable(),
							email: z.string(),
							phoneNumber: z.string().nullable(),
						}),
					}),
				),
			),
		)
		.handler(async ({ input, context }) => {
			await checkFamilyMembership(input.familyId, context.user.id);

			try {
				const members = await db
					.select({
						id: familyMembers.id,
						familyId: familyMembers.familyId,
						userId: familyMembers.userId,
						role: familyMembers.role,
						isAdmin: familyMembers.isAdmin,
						joinedAt: familyMembers.joinedAt,
						createdAt: familyMembers.createdAt,
						updatedAt: familyMembers.updatedAt,
						user: {
							id: userTable.id,
							name: userTable.name,
							email: userTable.email,
							phoneNumber: userTable.phoneNumber,
						},
					})
					.from(familyMembers)
					.leftJoin(userTable, eq(familyMembers.userId, userTable.id))
					.where(eq(familyMembers.familyId, input.familyId));

				return {
					success: true,
					data: members
						.filter((member) => member.user !== null)
						.map((member) => ({
							...member,
							user: member.user!,
							joinedAt: new Date(member.joinedAt).toISOString(),
							createdAt: new Date(member.createdAt).toISOString(),
							updatedAt: new Date(member.updatedAt).toISOString(),
						})),
				};
			} catch (error) {
				console.error("Error fetching family members:", error);
				throw new ORPCError("INTERNAL_SERVER_ERROR", {
					message: "Failed to fetch family members",
				});
			}
		}),
});
