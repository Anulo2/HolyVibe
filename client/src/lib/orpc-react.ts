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
const getOrpcUrl = () => {
	const isDev = import.meta.env.DEV;
	const viteServerUrl = import.meta.env.VITE_SERVER_URL;

	// In development, use the provided server URL or localhost
	if (isDev) {
		const serverUrl = viteServerUrl || "http://localhost:3000";
		return `${serverUrl}/orpc`;
	}

	// In production, use the environment variable
	if (!viteServerUrl) {
		throw new Error(
			"VITE_SERVER_URL environment variable is required for production builds",
		);
	}

	return `${viteServerUrl}/orpc`;
};

const link = new RPCLink({
	url: getOrpcUrl(),
	fetch: (input, init) => {
		return fetch(input, {
			...init,
			credentials: "include", // Include cookies for authentication
		});
	},
});

export const orpc = createORPCClient<AppRouter>(link);
