import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { organization, phoneNumber } from "better-auth/plugins";
import { db } from "./db";
import { env } from "./env";

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
        const response = await fetch("https://portal.bulkgate.com/api/1.0/simple/transactional", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            application_id: env.BULKGATE_APPID,
            application_token: env.BULKGATE_TOKEN,
            number: phoneNumber,
            text: `Il tuo codice di verifica per HolyVibe è ${code}`,
            sender_id: "g-35167",
            sender_id_value: "HolyVibe",
          }),
        });

        if (!response.ok) {
          console.error("Error sending OTP:", await response.text());
          throw new Error("Error sending OTP");
        }
      },
			signUpOnVerification: {
				getTempEmail: (phoneNumber) => {
					// Generate a temporary email from phone number
					return `${phoneNumber.replace(/[^\d]/g, "")}@family-app.com`;
				},
				getTempName: (phoneNumber) => {
					return phoneNumber;
				},
			},
			otpLength: 6,
			expiresIn: 300, // 5 minutes
		}),
	],
	// Remove the problematic hooks for now - we'll handle invitation acceptance via explicit endpoint
	emailAndPassword: {
		enabled: false, // Disable email/password auth since we want phone-only
	},
});
