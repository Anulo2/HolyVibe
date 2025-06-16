import { Elysia, t } from "elysia";
import { db } from "../db";
import { user as userTable } from "../db/schema";
import { eq } from "drizzle-orm";

export const userRoutes = new Elysia({ prefix: "/user" })
  .patch("/profile", async ({ user, body, error }) => {
    if (!user) {
      return error(401, "Unauthorized");
    }

    try {
      const [updatedUser] = await db
        .update(userTable)
        .set({
          name: body.name,
          birthDate: body.birthDate,
          updatedAt: new Date(), // Drizzle handles date conversion
        })
        .where(eq(userTable.id, user.id))
        .returning();

      return {
        success: true,
        data: updatedUser,
      };
    } catch (e) {
      console.error("Error updating profile:", e);
      return error(500, "Failed to update profile");
    }
  }, {
    body: t.Object({
      name: t.String({ minLength: 2, maxLength: 100 }),
      birthDate: t.String({ format: "date" }), // YYYY-MM-DD
    }),
  }); 