import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { organization, phoneNumber } from "better-auth/plugins";
import { db } from "./db";
import { env } from "./env";
import { isValidPhone, normalizePhoneNumber } from "./utils/phone";

export const auth = betterAuth({
  appName: "Family Management App",
  baseURL: env.BASE_URL,
  basePath: "/api/auth",
  secret: env.AUTH_SECRET,
  trustedOrigins: env.AUTH_TRUSTED_ORIGINS.split(","),
  database: drizzleAdapter(db, {
    provider: "sqlite",
  }),
  session: {
    freshAge: 60 * 60 * 24, // 1 day
    updateAge: 60 * 60 * 24 * 30, // 30 days
  },
  cookieOptions: {
    secure: env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  },
  plugins: [
    organization(), // Enable organization management for parishes
    phoneNumber({
      sendOTP: async ({ phoneNumber, code }) => {
        // Normalize the phone number before sending
        const normalizedPhone = normalizePhoneNumber(phoneNumber);
        if (!normalizedPhone) {
          throw new Error("Invalid phone number format");
        }

        const response = await fetch(
          "https://portal.bulkgate.com/api/1.0/simple/transactional",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              application_id: env.BULKGATE_APPID,
              application_token: env.BULKGATE_TOKEN,
              number: normalizedPhone,
              text: `Il tuo codice di verifica è ${code}`,
              sender_id: "g-35167",
              sender_id_value: "Parrocchia",
            }),
          },
        );

        if (!response.ok) {
          console.error("Error sending OTP:", await response.text());
          throw new Error("Error sending OTP");
        }
      },
      signUpOnVerification: {
        getTempEmail: (phoneNumber: string) => {
          // Generate a temporary email from normalized phone number
          const normalized = normalizePhoneNumber(phoneNumber);
          const cleanNumber =
            normalized?.replace(/[^\d]/g, "") ||
            phoneNumber.replace(/[^\d]/g, "");
          return `${cleanNumber}@family-app.com`;
        },
        getTempName: (phoneNumber: string) => {
          // Use normalized phone number as name
          return normalizePhoneNumber(phoneNumber) || phoneNumber;
        },
      },
      otpLength: 6,
      expiresIn: 300, // 5 minutes
    }),
  ],
  hooks: {
    after: async (context: any) => {
      // Auto-assign new users to default organization if one exists
      if (
        context.path === "/sign-up" &&
        context.method === "POST" &&
        context.returned?.user?.id
      ) {
        const { eq } = await import("drizzle-orm");
        const { nanoid } = await import("nanoid");
        const { organization, organizationMember } = await import(
          "./db/schema"
        );

        try {
          // Find the first organization (default)
          const defaultOrg = await db.select().from(organization).limit(1);

          if (defaultOrg.length > 0) {
            // Check if user is already a member
            const existingMembership = await db
              .select()
              .from(organizationMember)
              .where(eq(organizationMember.userId, context.returned.user.id))
              .limit(1);

            if (existingMembership.length === 0) {
              // Add user to default organization as "genitore"
              await db.insert(organizationMember).values({
                id: nanoid(),
                organizationId: defaultOrg[0].id,
                userId: context.returned.user.id,
                role: "genitore",
                createdAt: new Date(),
                updatedAt: new Date(),
              });
              console.log(
                `🏢 Auto-assigned user ${context.returned.user.id} to organization ${defaultOrg[0].name}`,
              );
            }
          }
        } catch (error) {
          console.error("Error auto-assigning user to organization:", error);
          // Don't throw - user creation should still succeed
        }
      }
    },
  },
  // Remove the problematic hooks for now - we'll handle invitation acceptance via explicit endpoint
  emailAndPassword: {
    enabled: false, // Disable email/password auth since we want phone-only
  },
});
