import type { AppRouter } from "@gestione-eventi-parrocchia/server/client";
import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";

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
			cache: "no-cache", // Disable HTTP caching
			headers: {
				...init?.headers,
				"Cache-Control": "no-cache, no-store, must-revalidate",
				Pragma: "no-cache",
				Expires: "0",
			},
		});
	},
});

export const orpcClient = createORPCClient<AppRouter>(link);

// Export types for convenience
export type {
	AppRouter,
	EventsInputs,
	EventsOutputs,
	FamilyInputs,
	FamilyOutputs,
	RegistrationsInputs,
	RegistrationsOutputs,
	RouterInputs,
	RouterOutputs,
	UserInputs,
	UserOutputs,
} from "@gestione-eventi-parrocchia/server/client";
