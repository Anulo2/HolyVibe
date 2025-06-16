import { createAuthClient } from "better-auth/client";
import { phoneNumberClient } from "better-auth/client/plugins";

export const auth = createAuthClient({
    baseURL: "http://localhost:3000/api/auth", // Better Auth routes are mounted at /api/auth
    plugins: [
        phoneNumberClient()
    ]
}); 