import cors from "@elysiajs/cors";
import swagger from "@elysiajs/swagger";
import { RPCHandler } from "@orpc/server/fetch";
import { logger } from "@tqman/nice-logger";
import { Elysia } from "elysia";
import { auth } from "../auth";
import { router } from "./server";

// Create the oRPC handler
const handler = new RPCHandler(router);

// Better Auth middleware with session management
const authPlugin = new Elysia({ name: "auth.plugin" })
	.mount(auth.handler) // Mount without prefix - Better Auth has basePath configured
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
	.use(logger())
	.use(cors())
	.use(swagger())
	.use(authPlugin)
	// Handle oRPC requests using the correct pattern
	.all("/orpc/*", async ({ request }) => {
		const { matched, response } = await handler.handle(request, {
			prefix: "/orpc",
			context: { request }, // Provide request context
		});

		if (matched) {
			return response;
		}

		return new Response("Not Found", { status: 404 });
	})
	.get("/", () => ({ message: "Holy Vibe API with oRPC" }));
