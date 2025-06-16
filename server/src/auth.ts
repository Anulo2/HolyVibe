import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { phoneNumber, organization } from "better-auth/plugins";
import { db } from "./db";

export const auth = betterAuth({
    appName: "Family Management App",
    baseURL: "http://localhost:3000", // Base URL for the app
    basePath: "/api/auth", // Auth routes will be at /api/auth/*
    trustedOrigins: ["http://localhost:3000", "http://localhost:5173"], // Allow requests from frontend
    database: drizzleAdapter(db, {
        provider: "sqlite",
    }),
    plugins: [
        organization(), // Enable organization management for parishes
        phoneNumber({
            sendOTP: ({ phoneNumber, code }, request) => {
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
                    return `${phoneNumber.replace(/[^\d]/g, '')}@family-app.com`;
                },
                getTempName: (phoneNumber) => {
                    return phoneNumber;
                }
            },
            otpLength: 6,
            expiresIn: 300, // 5 minutes
        })
    ],
    emailAndPassword: {
        enabled: false // Disable email/password auth since we want phone-only
    },
}); 