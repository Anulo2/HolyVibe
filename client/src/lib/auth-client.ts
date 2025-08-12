import { adminClient, phoneNumberClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
	baseURL: import.meta.env.VITE_SERVER_URL || "http://localhost:3000", // Better Auth routes are mounted at /api/auth by default
	plugins: [
		phoneNumberClient(),
		adminClient(), // Admin plugin for Supreme Admin functionality
	],
});

// Export Better Auth types using $Infer
export type Session = typeof authClient.$Infer.Session;
export type User = Session["user"];

// Keep backward compatibility
export const auth = authClient;
