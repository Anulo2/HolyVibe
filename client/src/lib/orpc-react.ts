import type { AppRouter } from "@gestione-eventi-parrocchia/server/client";
import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import { QueryClient } from "@tanstack/react-query";

// Create a single query client instance
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0, // Always consider data stale
      gcTime: 0, // Don't cache data
      refetchOnWindowFocus: true,
      refetchOnMount: true,
      refetchOnReconnect: true,
      retry: false, // Don't retry failed requests to avoid stale data
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
  fetch: (input, init?: RequestInit) => {
    const headers = new Headers(init?.headers);
    headers.set("Cache-Control", "no-cache, no-store, must-revalidate");
    headers.set("Pragma", "no-cache");
    headers.set("Expires", "0");

    return fetch(input, {
      ...init,
      credentials: "include", // Include cookies for authentication
      cache: "no-cache", // Disable HTTP caching
      headers,
    });
  },
});

export const orpc = createORPCClient<AppRouter>(link);
