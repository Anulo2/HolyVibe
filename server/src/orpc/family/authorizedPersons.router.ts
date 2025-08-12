import { ORPCError, os } from "@orpc/server";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod";
import { db } from "../../db";
import { authorizedPersons } from "../../db/schema";
import { checkFamilyMembership, SuccessResponse } from "../helpers";
import { withAuth } from "../middleware";
import { AuthorizedPerson } from "../schemas";

export const authorizedPersonsRouter = os.router({
	// Get authorized persons in family
	getAuthorizedPersons: withAuth
		.input(
			z.object({
				familyId: z.string(),
			}),
		)
		.output(SuccessResponse(z.array(AuthorizedPerson)))
		.handler(async ({ input, context }) => {
			await checkFamilyMembership(input.familyId, context.user.id);

			try {
				const persons = await db
					.select()
					.from(authorizedPersons)
					.where(eq(authorizedPersons.familyId, input.familyId));

				return {
					success: true,
					data: persons.map((person) => ({
						...person,
						createdAt: new Date(person.createdAt).toISOString(),
						updatedAt: new Date(person.updatedAt).toISOString(),
					})),
				};
			} catch (error) {
				console.error("Error fetching authorized persons:", error);
				throw new ORPCError("INTERNAL_SERVER_ERROR", {
					message: "Failed to fetch authorized persons",
				});
			}
		}),

	// Add authorized person to family
	addAuthorizedPerson: withAuth
		.input(
			z.object({
				familyId: z.string(),
				fullName: z.string().min(1).max(100),
				relationship: z.string().min(1).max(50),
				phone: z.string().max(20).optional(),
				email: z.preprocess(
					(val) =>
						typeof val === "string" && val.trim() === "" ? undefined : val,
					z.string().email().max(100).optional(),
				),
			}),
		)
		.output(SuccessResponse(AuthorizedPerson))
		.handler(async ({ input, context }) => {
			await checkFamilyMembership(input.familyId, context.user.id);

			const personId = nanoid();

			try {
				await db.insert(authorizedPersons).values({
					id: personId,
					familyId: input.familyId,
					fullName: input.fullName,
					relationship: input.relationship,
					phone: input.phone || null,
					email: input.email || null,
					avatarUrl: null,
					isActive: true,
				});

				const newPerson = await db
					.select()
					.from(authorizedPersons)
					.where(eq(authorizedPersons.id, personId))
					.limit(1);

				return {
					success: true,
					data: {
						...newPerson[0],
						createdAt: new Date(newPerson[0].createdAt).toISOString(),
						updatedAt: new Date(newPerson[0].updatedAt).toISOString(),
					},
				};
			} catch (error) {
				console.error("Error adding authorized person:", error);
				throw new ORPCError("INTERNAL_SERVER_ERROR", {
					message: "Failed to add authorized person",
				});
			}
		}),

	// Update authorized person
	updateAuthorizedPerson: withAuth
		.input(
			z.object({
				id: z.string(),
				fullName: z.string().min(1).max(100).optional(),
				relationship: z.string().min(1).max(50).optional(),
				phone: z.string().max(20).optional(),
				email: z.preprocess(
					(val) =>
						typeof val === "string" && val.trim() === "" ? undefined : val,
					z.string().email().max(100).optional(),
				),
			}),
		)
		.output(SuccessResponse(AuthorizedPerson))
		.handler(async ({ input, context }) => {
			// First, get the authorized person to check family membership
			const person = await db
				.select()
				.from(authorizedPersons)
				.where(eq(authorizedPersons.id, input.id))
				.limit(1);

			if (person.length === 0) {
				throw new ORPCError("NOT_FOUND", {
					message: "Authorized person not found",
				});
			}

			await checkFamilyMembership(person[0].familyId, context.user.id);

			try {
				const updateData: any = {
					updatedAt: new Date(),
				};

				// Only include fields that are explicitly provided
				if (input.fullName !== undefined) {
					updateData.fullName = input.fullName;
				}
				if (input.relationship !== undefined) {
					updateData.relationship = input.relationship;
				}
				if (input.phone !== undefined) {
					updateData.phone = input.phone || null;
				}
				if (input.email !== undefined) {
					updateData.email = input.email || null;
				}

				await db
					.update(authorizedPersons)
					.set(updateData)
					.where(eq(authorizedPersons.id, input.id));

				const updatedPerson = await db
					.select()
					.from(authorizedPersons)
					.where(eq(authorizedPersons.id, input.id))
					.limit(1);

				return {
					success: true,
					data: {
						...updatedPerson[0],
						createdAt: new Date(
							Number(updatedPerson[0].createdAt) * 1000,
						).toISOString(),
						updatedAt: new Date(updatedPerson[0].updatedAt).toISOString(),
					},
				};
			} catch (error) {
				console.error("Error updating authorized person:", error);
				throw new ORPCError("INTERNAL_SERVER_ERROR", {
					message: "Failed to update authorized person",
				});
			}
		}),
});
