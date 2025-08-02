import type { AppRouter } from "@gestione-eventi-parrocchia/server/client";
import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";

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
