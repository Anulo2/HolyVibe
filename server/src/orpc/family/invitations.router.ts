import { ORPCError, os } from "@orpc/server";
import { and, desc, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod";
import { db } from "../../db";
import {
  families,
  familyMembers,
  invitations,
  user as userTable,
} from "../../db/schema";
import { checkFamilyMembership, SuccessResponse } from "../helpers";
import { withAuth } from "../middleware";
import { Invitation } from "../schemas";
import { smsService } from "../../services/sms.service";
import { arePhoneNumbersEquivalent } from "../../utils/phone";

export const invitationsRouter = os.router({
  // Send family invitation
  sendInvitation: withAuth
    .input(
      z
        .object({
          familyId: z.string(),
          email: z.string().email().optional(),
          phoneNumber: z.string().optional(),
          message: z.string().max(500).optional(),
        })
        .refine((data) => data.email || data.phoneNumber, {
          message: "È richiesto almeno uno tra email o numero di telefono",
        }),
    )
    .output(
      SuccessResponse(
        z.object({
          id: z.string(),
          email: z.string().nullable(),
          phoneNumber: z.string().nullable(),
          expiresAt: z.string(),
        }),
      ),
    )
    .handler(async ({ input, context }) => {
      await checkFamilyMembership(input.familyId, context.user.id);

      try {
        // Check if user is already invited and pending
        const existingInvitationConditions = [
          eq(invitations.familyId, input.familyId),
          eq(invitations.status, "pending"),
        ];

        if (input.email) {
          existingInvitationConditions.push(eq(invitations.email, input.email));
        } else if (input.phoneNumber) {
          existingInvitationConditions.push(
            eq(invitations.phoneNumber, input.phoneNumber),
          );
        }

        const existingInvitation = await db
          .select()
          .from(invitations)
          .where(and(...existingInvitationConditions))
          .limit(1);

        if (existingInvitation.length > 0) {
          throw new ORPCError("CONFLICT", {
            message: "User already has a pending invitation to this family",
          });
        }

        // Check if user is already a member of the family
        let existingUser = null;
        if (input.email) {
          const usersByEmail = await db
            .select()
            .from(userTable)
            .where(eq(userTable.email, input.email))
            .limit(1);
          existingUser = usersByEmail.length > 0 ? usersByEmail[0] : null;
        } else if (input.phoneNumber) {
          const usersByPhone = await db
            .select()
            .from(userTable)
            .where(eq(userTable.phoneNumber, input.phoneNumber))
            .limit(1);
          existingUser = usersByPhone.length > 0 ? usersByPhone[0] : null;
        }

        if (existingUser) {
          const existingMember = await db
            .select()
            .from(familyMembers)
            .where(
              and(
                eq(familyMembers.familyId, input.familyId),
                eq(familyMembers.userId, existingUser.id),
              ),
            )
            .limit(1);

          if (existingMember.length > 0) {
            throw new ORPCError("CONFLICT", {
              message: "User is already a member of this family",
            });
          }
        }

        const invitationId = nanoid();
        const token = nanoid(32);
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

        await db.insert(invitations).values({
          id: invitationId,
          familyId: input.familyId,
          email: input.email || null,
          phoneNumber: input.phoneNumber || null,
          invitedBy: context.user.id,
          message: input.message || null,
          token,
          expiresAt,
        });

        // Send SMS invitation if phone number is provided
        if (input.phoneNumber) {
          // Get family name for the invitation message
          const family = await db
            .select({ name: families.name })
            .from(families)
            .where(eq(families.id, input.familyId))
            .limit(1);

          const familyName = family.length > 0 ? family[0].name : "la famiglia";
          const inviteUrl = `${Bun.env.BASE_URL || "http://localhost:3000"}/inviti/accetta?token=${token}`;

          // Debug: Check SMS service status
          const smsStatus = smsService.getStatus();
          console.log("📞 SMS Service Status:", smsStatus);

          // Validate phone number format
          if (!smsService.validatePhoneNumber(input.phoneNumber)) {
            throw new ORPCError("BAD_REQUEST", {
              message: "Formato del numero di telefono non valido",
            });
          }

          // Try to send SMS
          console.log(
            `📱 Attempting to send invitation SMS to ${input.phoneNumber}`,
          );
          const smsResult = await smsService.sendInvitationSMS(
            input.phoneNumber,
            familyName,
            inviteUrl,
          );

          if (!smsResult.success) {
            console.error(
              `❌ Failed to send SMS to ${input.phoneNumber}: ${smsResult.error}`,
            );
            // Log the invitation URL as fallback
            console.log(
              `📱 SMS failed - Manual invitation link for ${input.phoneNumber}: ${inviteUrl}`,
            );

            // Don't fail the entire operation if SMS fails - the invitation is still created
            // but we should log this for manual follow-up
          } else {
            console.log(
              `📱 SMS invitation sent successfully to ${input.phoneNumber} (Message ID: ${smsResult.messageId})`,
            );
          }
        }

        return {
          success: true,
          data: {
            id: invitationId,
            email: input.email || null,
            phoneNumber: input.phoneNumber || null,
            expiresAt: expiresAt.toISOString(),
          },
        };
      } catch (error) {
        console.error("Error sending invitation:", error);
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message: "Failed to send invitation",
        });
      }
    }),

  // Get family invitations
  getInvitations: withAuth
    .input(
      z.object({
        familyId: z.string(),
      }),
    )
    .output(SuccessResponse(z.array(Invitation)))
    .handler(async ({ input, context }) => {
      await checkFamilyMembership(input.familyId, context.user.id);

      try {
        const familyInvitations = await db
          .select()
          .from(invitations)
          .where(eq(invitations.familyId, input.familyId))
          .orderBy(desc(invitations.createdAt));

        return {
          success: true,
          data: familyInvitations.map((invitation) => ({
            ...invitation,
            expiresAt: new Date(invitation.expiresAt).toISOString(),
            acceptedAt: invitation.acceptedAt
              ? new Date(invitation.acceptedAt).toISOString()
              : null,
            createdAt: new Date(invitation.createdAt).toISOString(),
            updatedAt: new Date(invitation.updatedAt).toISOString(),
          })),
        };
      } catch (error) {
        console.error("Error fetching invitations:", error);
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message: "Failed to fetch invitations",
        });
      }
    }),

  // Get invitation details (public endpoint)
  getInvitationDetails: os
    .input(
      z.object({
        token: z.string(),
      }),
    )
    .output(
      SuccessResponse(
        z.object({
          familyId: z.string(),
          familyName: z.string(),
          phoneNumber: z.string().nullable(),
          email: z.string().nullable(),
          message: z.string().nullable(),
          expiresAt: z.string(),
          isExpired: z.boolean(),
        }),
      ),
    )
    .handler(async ({ input }) => {
      try {
        // Find invitation by token
        const invitation = await db
          .select({
            invitation: invitations,
            family: families,
          })
          .from(invitations)
          .leftJoin(families, eq(invitations.familyId, families.id))
          .where(
            and(
              eq(invitations.token, input.token),
              eq(invitations.status, "pending"),
            ),
          )
          .limit(1);

        if (invitation.length === 0) {
          throw new ORPCError("NOT_FOUND", {
            message: "Invalid or expired invitation",
          });
        }

        const invitationData = invitation[0].invitation;
        const familyData = invitation[0].family!;

        // Check if invitation is expired
        const isExpired = new Date() > new Date(invitationData.expiresAt);

        if (isExpired) {
          // Mark as expired
          await db
            .update(invitations)
            .set({ status: "expired" })
            .where(eq(invitations.id, invitationData.id));

          throw new ORPCError("GONE", { message: "Invitation has expired" });
        }

        return {
          success: true,
          data: {
            familyId: invitationData.familyId,
            familyName: familyData.name,
            phoneNumber: invitationData.phoneNumber,
            email: invitationData.email,
            message: invitationData.message,
            expiresAt: new Date(invitationData.expiresAt).toISOString(),
            isExpired,
          },
        };
      } catch (error) {
        console.error("Error getting invitation details:", error);
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message: "Failed to get invitation details",
        });
      }
    }),

  // Accept family invitation (requires authentication)
  acceptInvitation: withAuth
    .input(
      z.object({
        token: z.string(),
      }),
    )
    .output(
      SuccessResponse(
        z.object({
          familyId: z.string(),
          familyName: z.string(),
        }),
      ),
    )
    .handler(async ({ input, context }) => {
      try {
        // Find invitation by token
        const invitation = await db
          .select({
            invitation: invitations,
            family: families,
          })
          .from(invitations)
          .leftJoin(families, eq(invitations.familyId, families.id))
          .where(
            and(
              eq(invitations.token, input.token),
              eq(invitations.status, "pending"),
            ),
          )
          .limit(1);

        if (invitation.length === 0) {
          throw new ORPCError("NOT_FOUND", {
            message: "Invalid or expired invitation",
          });
        }

        const invitationData = invitation[0].invitation;
        const familyData = invitation[0].family!;

        // Check if invitation is expired
        if (new Date() > new Date(invitationData.expiresAt)) {
          // Mark as expired
          await db
            .update(invitations)
            .set({ status: "expired" })
            .where(eq(invitations.id, invitationData.id));

          throw new ORPCError("GONE", { message: "Invitation has expired" });
        }

        // Check if invited email or phone number matches current user
        const emailMatches =
          invitationData.email && invitationData.email === context.user.email;
        const phoneMatches =
          invitationData.phoneNumber &&
          context.user.phoneNumber &&
          arePhoneNumbersEquivalent(
            invitationData.phoneNumber,
            context.user.phoneNumber,
          );

        // Debug logging for phone number matching
        console.log("🔍 Invitation acceptance debug:");
        console.log("  - Invitation phone:", invitationData.phoneNumber);
        console.log("  - User phone:", context.user.phoneNumber);
        console.log("  - Email matches:", emailMatches);
        console.log("  - Phone matches:", phoneMatches);

        if (!emailMatches && !phoneMatches) {
          throw new ORPCError("FORBIDDEN", {
            message: "This invitation is for a different contact method",
          });
        }

        // Check if user is already a member
        const existingMember = await db
          .select()
          .from(familyMembers)
          .where(
            and(
              eq(familyMembers.familyId, invitationData.familyId),
              eq(familyMembers.userId, context.user.id),
            ),
          )
          .limit(1);

        if (existingMember.length > 0) {
          throw new ORPCError("CONFLICT", {
            message: "Already a member of this family",
          });
        }

        // Add user to family
        const memberId = nanoid();
        await db.insert(familyMembers).values({
          id: memberId,
          familyId: invitationData.familyId,
          userId: context.user.id,
          role: "parent",
          isAdmin: false,
        });

        // Mark invitation as accepted
        await db
          .update(invitations)
          .set({
            status: "accepted",
            acceptedAt: new Date(),
          })
          .where(eq(invitations.id, invitationData.id));

        return {
          success: true,
          data: {
            familyId: invitationData.familyId,
            familyName: familyData.name,
          },
        };
      } catch (error) {
        console.error("Error accepting invitation:", error);
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message: "Failed to accept invitation",
        });
      }
    }),

  // Check and accept phone invitations for new users
  checkPhoneInvitations: withAuth
    .output(
      SuccessResponse(
        z.object({
          acceptedInvitations: z.number(),
          familyNames: z.array(z.string()),
        }),
      ),
    )
    .handler(async ({ context }) => {
      try {
        // Check if user has phoneNumber
        const userWithPhone = await db
          .select()
          .from(userTable)
          .where(eq(userTable.id, context.user.id))
          .limit(1);

        if (userWithPhone.length === 0 || !userWithPhone[0].phoneNumber) {
          return {
            success: true,
            data: {
              acceptedInvitations: 0,
              familyNames: [],
            },
          };
        }

        // Look for pending invitations for this phone number
        const pendingInvitations = await db
          .select({
            invitation: invitations,
            family: families,
          })
          .from(invitations)
          .leftJoin(families, eq(invitations.familyId, families.id))
          .where(
            and(
              eq(invitations.phoneNumber, userWithPhone[0].phoneNumber),
              eq(invitations.status, "pending"),
            ),
          );

        console.log(
          `🔍 Found ${pendingInvitations.length} pending invitations for phone ${userWithPhone[0].phoneNumber}`,
        );

        const acceptedFamilyNames: string[] = [];
        let acceptedCount = 0;

        // Process each pending invitation
        for (const row of pendingInvitations) {
          try {
            const invitation = row.invitation;
            const family = row.family;

            if (!family) continue;

            // Check if invitation is not expired
            if (new Date() > new Date(invitation.expiresAt)) {
              // Mark as expired
              await db
                .update(invitations)
                .set({ status: "expired" })
                .where(eq(invitations.id, invitation.id));
              continue;
            }

            // Check if user is already a member of this family
            const existingMember = await db
              .select()
              .from(familyMembers)
              .where(
                and(
                  eq(familyMembers.familyId, invitation.familyId),
                  eq(familyMembers.userId, context.user.id),
                ),
              )
              .limit(1);

            if (existingMember.length > 0) {
              // User is already a member, mark invitation as accepted
              await db
                .update(invitations)
                .set({
                  status: "accepted",
                  acceptedAt: new Date(),
                })
                .where(eq(invitations.id, invitation.id));
              continue;
            }

            // Add user to family
            const memberId = nanoid();
            await db.insert(familyMembers).values({
              id: memberId,
              familyId: invitation.familyId,
              userId: context.user.id,
              role: "parent",
              isAdmin: false,
            });

            // Mark invitation as accepted
            await db
              .update(invitations)
              .set({
                status: "accepted",
                acceptedAt: new Date(),
              })
              .where(eq(invitations.id, invitation.id));

            acceptedFamilyNames.push(family.name);
            acceptedCount++;

            console.log(
              `✅ User ${context.user.id} automatically added to family ${invitation.familyId} via phone invitation`,
            );
          } catch (error) {
            console.error(
              `❌ Error processing invitation ${row.invitation.id}:`,
              error,
            );
          }
        }

        return {
          success: true,
          data: {
            acceptedInvitations: acceptedCount,
            familyNames: acceptedFamilyNames,
          },
        };
      } catch (error) {
        console.error("❌ Error in phone invitation check:", error);
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message: "Failed to check phone invitations",
        });
      }
    }),

  // Cancel family invitation
  cancelInvitation: withAuth
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .output(
      SuccessResponse(
        z.object({
          id: z.string(),
          status: z.string(),
        }),
      ),
    )
    .handler(async ({ input, context }) => {
      try {
        // Find invitation and verify it belongs to a family the user has access to
        const invitation = await db
          .select({
            invitation: invitations,
            family: families,
          })
          .from(invitations)
          .leftJoin(families, eq(invitations.familyId, families.id))
          .where(eq(invitations.id, input.id))
          .limit(1);

        if (invitation.length === 0) {
          throw new ORPCError("NOT_FOUND", {
            message: "Invitation not found",
          });
        }

        const invitationData = invitation[0].invitation;

        // Check if user has access to this family (either created the invitation or is admin)
        await checkFamilyMembership(invitationData.familyId, context.user.id);

        // Only allow canceling pending invitations
        if (invitationData.status !== "pending") {
          throw new ORPCError("BAD_REQUEST", {
            message: "Can only cancel pending invitations",
          });
        }

        // Mark invitation as cancelled
        await db
          .update(invitations)
          .set({
            status: "rejected",
            updatedAt: new Date(),
          })
          .where(eq(invitations.id, input.id));

        return {
          success: true,
          data: {
            id: input.id,
            status: "rejected",
          },
        };
      } catch (error) {
        console.error("Error canceling invitation:", error);
        if (error instanceof ORPCError) throw error;
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message: "Failed to cancel invitation",
        });
      }
    }),
});
