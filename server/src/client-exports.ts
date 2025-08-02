// Client-safe exports for the @holy-vibe/server package
// This file only exports TYPES without any runtime dependencies

// IMPORTANT: Do not export the actual appRouter instance as it includes
// server-side dependencies (db, auth, env). Only export types.

import type { RouterClient } from "@orpc/server";
import type { appRouter } from "./orpc/index";

// Export the proper client type instead of the raw router type
export type AppRouter = RouterClient<typeof appRouter>;

// Re-export all types from orpc/types
export type {
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
} from "./orpc/types";
