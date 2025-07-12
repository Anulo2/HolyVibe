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
		updateAge: 60 * 60 * 24 * 7, // 1 week
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
			sendOTP: ({ phoneNumber, code }) => {
				// For development, we'll just log the OTP
				// In production, implement actual SMS sending
				console.log(`📱 OTP for ${phoneNumber}: ${code}`);

				// You can integrate with services like:
				// - Twilio
				// - AWS SNS
				// - Vonage (Nexmo)
				// - Firebase Cloud Messaging
				return Promise.resolve();
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
