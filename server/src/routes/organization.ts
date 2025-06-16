import { Elysia, t } from "elysia";
import { db } from "../db";
import { organization as organizationTable } from "../db/schema";
import { nanoid } from "nanoid";

export const organizationRoutes = new Elysia({ prefix: "/organizations" })
  .post("/", async ({ body, user, error }) => {
    // For now, only an authenticated user can create a parish.
    // Later, we will add role-based checks (e.g., only system admin).
    if (!user) {
      return error(401, "Unauthorized");
    }

    try {
      const newOrganization = await db
        .insert(organizationTable)
        .values({
          id: nanoid(),
          name: body.name,
          ownerId: user.id,
        })
        .returning();

      return {
        success: true,
        data: newOrganization[0],
      };
    } catch (e) {
      console.error("Error creating organization:", e);
      return error(500, "Failed to create organization");
    }
  }, {
    body: t.Object({
      name: t.String({ minLength: 3, maxLength: 100 }),
    }),
  }); 