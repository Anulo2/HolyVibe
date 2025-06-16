import cors from "@elysiajs/cors";
import swagger from "@elysiajs/swagger";
import { logger } from "@tqman/nice-logger";
import { Elysia } from "elysia";

import { auth } from "./auth";
import { familyRoutes } from "./routes/family";
import { userRoutes } from "./routes/user";
import { organizationRoutes } from "./routes/organization";

// Better Auth middleware with session management
const authPlugin = new Elysia({ name: "auth.plugin" })
	.mount(auth.handler)
	.derive(async ({ request }) => {
		const session = await auth.api.getSession({
			headers: request.headers,
		});
		return {
			user: session?.user ?? null,
			session: session?.session ?? null,
		};
	});

export const app = new Elysia()
	.use(cors({
		origin: true,
		credentials: true,
		methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
		allowedHeaders: ['Content-Type', 'Authorization']
	}))
	.use(swagger())
	.use(logger())
	.use(authPlugin) // Auth plugin provides user context
	.use(userRoutes) // These routes can now use the user context
	.use(organizationRoutes)
	.use(familyRoutes);
