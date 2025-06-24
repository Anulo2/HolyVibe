import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import { QueryClient } from "@tanstack/react-query";
import type { AppRouter } from "../../../server/src/orpc/types";

// Create a single query client instance
export const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: 5 * 60 * 1000, // 5 minutes
			refetchOnWindowFocus: false,
		},
	},
});

// Create an explicit RPCLink to ensure correct client initialization
const link = new RPCLink({
	url: "http://localhost:3000/orpc",
	fetch: (input, init) => {
		return fetch(input, {
			...init,
			credentials: "include", // Include cookies for Better Auth
		});
	},
});

// Create the oRPC client using the explicit link
export const orpc = createORPCClient<AppRouter>(link);
