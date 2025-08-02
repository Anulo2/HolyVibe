import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import { QueryClient } from "@tanstack/react-query";
import type { AppRouter } from "@holy-vibe/server/client";

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
  url: "/orpc", // Proxy configured in vite.config.ts
});

export const orpc = createORPCClient<AppRouter>(link);
