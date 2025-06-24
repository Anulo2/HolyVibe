import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import type { AppRouter } from "../../../server/src/orpc/types";

const link = new RPCLink({
	url: "http://localhost:3000/orpc",
	fetch: (input, init) => {
		return fetch(input, {
			...init,
			credentials: "include", // Include cookies for Better Auth
		});
	},
});

// Create the oRPC client
export const orpcClient = createORPCClient<AppRouter>(link);

// Export types for convenience
export type {
	AppRouter,
	EventsInputs,
	EventsOutputs,
	FamilyInputs,
	FamilyOutputs,
	RouterInputs,
	RouterOutputs,
	UserInputs,
	UserOutputs,
} from "../../../server/src/orpc/types";
