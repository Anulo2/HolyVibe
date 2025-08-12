import { ORPCError, os } from "@orpc/server";
import { auth } from "../auth";

// Auth middleware for oRPC
export const withAuth = os.use(async ({ context, next }) => {
	const request = (context as any).req as Request;

	try {
		const session = await auth.api.getSession({
			headers: request.headers,
		});

		if (!session?.user) {
			throw new ORPCError("UNAUTHORIZED", {
				message: "Authentication required",
			});
		}

		return next({
			context: {
				user: session.user,
				session: session.session,
			},
		});
	} catch (error) {
		console.error("Auth middleware error:", error);
		throw new ORPCError("UNAUTHORIZED", { message: "Authentication failed" });
	}
});

// Supreme Admin middleware - requires admin role from better-auth admin plugin
export const withSupremeAdmin = os.use(async ({ context, next }) => {
	const request = (context as any).req as Request;

	try {
		const session = await auth.api.getSession({
			headers: request.headers,
		});

		if (!session?.user) {
			throw new ORPCError("UNAUTHORIZED", {
				message: "Authentication required",
			});
		}

		// Check if user has admin role (Supreme Admin)
		if (session.user.role !== "admin") {
			throw new ORPCError("FORBIDDEN", {
				message: "Supreme Admin privileges required",
			});
		}

		return next({
			context: {
				user: session.user,
				session: session.session,
			},
		});
	} catch (error) {
		console.error("Supreme Admin middleware error:", error);
		if (error instanceof ORPCError) {
			throw error;
		}
		throw new ORPCError("UNAUTHORIZED", { message: "Authentication failed" });
	}
});
