import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import type { AppRouter } from "@holy-vibe/server/client";

// Create HTTP-based oRPC client for browser usage with proper link
const link = new RPCLink({
  url: "/orpc", // Proxy configured in vite.config.ts
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
} from "@holy-vibe/server/client";
