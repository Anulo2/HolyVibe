import type { InferRouterInputs, InferRouterOutputs } from "@orpc/server";
import type { router } from "./server";

// Export the router type for client use
export type AppRouter = typeof router;

// Export input and output types for all routes
export type RouterInputs = InferRouterInputs<AppRouter>;
export type RouterOutputs = InferRouterOutputs<AppRouter>;

// Convenient type exports for specific routes
export type FamilyInputs = RouterInputs["family"];
export type FamilyOutputs = RouterOutputs["family"];

export type EventsInputs = RouterInputs["events"];
export type EventsOutputs = RouterOutputs["events"];

export type UserInputs = RouterInputs["user"];
export type UserOutputs = RouterOutputs["user"];
