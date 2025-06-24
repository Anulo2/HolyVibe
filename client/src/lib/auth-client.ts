import { phoneNumberClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
	baseURL: "http://localhost:3000", // Better Auth routes are mounted at /api/auth by default
	plugins: [phoneNumberClient()],
});

// Export Better Auth types using $Infer
export type Session = typeof authClient.$Infer.Session;
export type User = Session["user"];

// Keep backward compatibility
export const auth = authClient;
