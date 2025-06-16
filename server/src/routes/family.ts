import { Elysia, t } from "elysia";
import { db } from "../db";
import { families, familyMembers, children, authorizedPersons, user } from "../db/schema";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";

export const familyRoutes = new Elysia({ prefix: "/family" })
  // Get user's families
  .get("/", async ({ headers }) => {
    try {
      // For now, use headers until Better Auth integration is fully working
      const userId = headers["user-id"] || "mock-user-1";
      
      const userFamilies = await db
        .select({
          family: families,
          member: familyMembers,
        })
        .from(familyMembers)
        .leftJoin(families, eq(familyMembers.familyId, families.id))
        .where(eq(familyMembers.userId, userId));

      return {
        success: true,
        data: userFamilies,
      };
    } catch (error) {
      return {
        success: false,
        error: "Failed to fetch families",
      };
    }
  })

  // Create a new family
  .post("/", async ({ body, headers }) => {
    const userId = headers["user-id"] || "mock-user-1";
    const familyId = nanoid();
    const memberId = nanoid();

    try {
      // Create family
      await db.insert(families).values({
        id: familyId,
        name: body.name,
        description: body.description,
        createdBy: userId,
      });

      // Add creator as admin member
      await db.insert(familyMembers).values({
        id: memberId,
        familyId,
        userId,
        role: "parent",
        isAdmin: true,
      });

      return {
        success: true,
        data: { id: familyId, name: body.name },
      };
    } catch (error) {
      return {
        success: false,
        error: "Failed to create family",
      };
    }
  }, {
    body: t.Object({
      name: t.String({ minLength: 1, maxLength: 100 }),
      description: t.Optional(t.String({ maxLength: 500 })),
    }),
  })

  // Get children in a family
  .get("/:familyId/children", async ({ params, headers }) => {
    try {
      const userId = headers["user-id"] || "mock-user-1";
      
      // Verify user is a member of this family
      const membership = await db
        .select()
        .from(familyMembers)
        .where(
          and(
            eq(familyMembers.familyId, params.familyId),
            eq(familyMembers.userId, userId)
          )
        )
        .limit(1);

      if (membership.length === 0) {
        return {
          success: false,
          error: "Access denied",
        };
      }

      const familyChildren = await db
        .select()
        .from(children)
        .where(eq(children.familyId, params.familyId));

      return {
        success: true,
        data: familyChildren,
      };
    } catch (error) {
      return {
        success: false,
        error: "Failed to fetch children",
      };
    }
  }, {
    params: t.Object({
      familyId: t.String(),
    }),
  })

  // Add a child to family
  .post("/:familyId/children", async ({ params, body, headers }) => {
    try {
      const userId = headers["user-id"] || "mock-user-1";
      const childId = nanoid();

      // Verify user is a member of this family
      const membership = await db
        .select()
        .from(familyMembers)
        .where(
          and(
            eq(familyMembers.familyId, params.familyId),
            eq(familyMembers.userId, userId)
          )
        )
        .limit(1);

      if (membership.length === 0) {
        return {
          success: false,
          error: "Access denied",
        };
      }

      await db.insert(children).values({
        id: childId,
        familyId: params.familyId,
        firstName: body.firstName,
        lastName: body.lastName,
        birthDate: body.birthDate,
        birthPlace: body.birthPlace,
        fiscalCode: body.fiscalCode,
        gender: body.gender,
        allergies: body.allergies,
        medicalNotes: body.medicalNotes,
      });

      return {
        success: true,
        data: { id: childId },
      };
    } catch (error) {
      return {
        success: false,
        error: "Failed to add child",
      };
    }
  }, {
    params: t.Object({
      familyId: t.String(),
    }),
    body: t.Object({
      firstName: t.String({ minLength: 1, maxLength: 50 }),
      lastName: t.String({ minLength: 1, maxLength: 50 }),
      birthDate: t.String(), // ISO date string
      birthPlace: t.Optional(t.String({ maxLength: 100 })),
      fiscalCode: t.Optional(t.String({ maxLength: 16 })),
      gender: t.Optional(t.Union([t.Literal("M"), t.Literal("F"), t.Literal("O")])),
      allergies: t.Optional(t.String({ maxLength: 500 })),
      medicalNotes: t.Optional(t.String({ maxLength: 500 })),
    }),
  })

  // Get authorized persons for a family
  .get("/:familyId/authorized-persons", async ({ params, headers }) => {
    try {
      const userId = headers["user-id"] || "mock-user-1";
      
      // Verify user is a member of this family
      const membership = await db
        .select()
        .from(familyMembers)
        .where(
          and(
            eq(familyMembers.familyId, params.familyId),
            eq(familyMembers.userId, userId)
          )
        )
        .limit(1);

      if (membership.length === 0) {
        return {
          success: false,
          error: "Access denied",
        };
      }

      const persons = await db
        .select()
        .from(authorizedPersons)
        .where(
          and(
            eq(authorizedPersons.familyId, params.familyId),
            eq(authorizedPersons.isActive, true)
          )
        );

      return {
        success: true,
        data: persons,
      };
    } catch (error) {
      return {
        success: false,
        error: "Failed to fetch authorized persons",
      };
    }
  }, {
    params: t.Object({
      familyId: t.String(),
    }),
  })

  // Add authorized person
  .post("/:familyId/authorized-persons", async ({ params, body, headers }) => {
    try {
      const userId = headers["user-id"] || "mock-user-1";
      const personId = nanoid();

      // Verify user is a member of this family
      const membership = await db
        .select()
        .from(familyMembers)
        .where(
          and(
            eq(familyMembers.familyId, params.familyId),
            eq(familyMembers.userId, userId)
          )
        )
        .limit(1);

      if (membership.length === 0) {
        return {
          success: false,
          error: "Access denied",
        };
      }

      await db.insert(authorizedPersons).values({
        id: personId,
        familyId: params.familyId,
        fullName: body.fullName,
        relationship: body.relationship,
        phone: body.phone,
        email: body.email,
        documentType: body.documentType,
        documentNumber: body.documentNumber,
        documentExpiry: body.documentExpiry,
      });

      return {
        success: true,
        data: { id: personId },
      };
    } catch (error) {
      return {
        success: false,
        error: "Failed to add authorized person",
      };
    }
  }, {
    params: t.Object({
      familyId: t.String(),
    }),
    body: t.Object({
      fullName: t.String({ minLength: 1, maxLength: 100 }),
      relationship: t.String({ minLength: 1, maxLength: 50 }),
      phone: t.Optional(t.String({ maxLength: 20 })),
      email: t.Optional(t.String({ format: "email" })),
      documentType: t.Optional(t.String({ maxLength: 50 })),
      documentNumber: t.Optional(t.String({ maxLength: 50 })),
      documentExpiry: t.Optional(t.String()), // ISO date string
    }),
  }); 