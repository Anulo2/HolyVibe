import type { AppRouter } from "@gestione-eventi-parrocchia/server/client";
import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import { QueryClient } from "@tanstack/react-query";

// Create a single query client instance
export const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: 5 * 60 * 1000, // 5 minutes
			refetchOnWindowFocus: false,
		},
	},
});

// Create HTTP-based oRPC client for browser usage with proper link
const link = new RPCLink({
	url: import.meta.env.DEV
		? `${import.meta.env.VITE_SERVER_URL || "http://localhost:3000"}/orpc`
		: "/orpc",
	fetch: (input, init) => {
		return fetch(input, {
			...init,
			credentials: "include", // Include cookies for authentication
		});
	},
});

export const orpc = createORPCClient<AppRouter>(link);
