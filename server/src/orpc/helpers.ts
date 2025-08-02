import { ORPCError } from "@orpc/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db";
import { familyMembers } from "../db/schema";

// Helper to check if user is member of family
export const checkFamilyMembership = async (familyId: string, userId: string) => {
	const membership = await db
		.select()
		.from(familyMembers)
		.where(
			and(
				eq(familyMembers.familyId, familyId),
				eq(familyMembers.userId, userId),
			),
		)
		.limit(1);

	if (membership.length === 0) {
		throw new ORPCError("FORBIDDEN", {
			message: "Access denied to this family",
		});
	}

	return membership[0];
};

// Success response helper
export const SuccessResponse = <T extends z.ZodType>(data: T) =>
	z.object({
		success: z.boolean(),
		data,
	});
