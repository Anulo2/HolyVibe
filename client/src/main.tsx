import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { createRouter, RouterProvider } from "@tanstack/react-router";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { authClient } from "@/lib/auth-client";
import "./index.css";

import { queryClient } from "./lib/orpc-react";
// Import the generated route tree
import { routeTree } from "./routeTree.gen";

// Create a new router instance
const router = createRouter({
	routeTree,
	defaultPreload: "intent",
	scrollRestoration: true,
	context: {
		auth: undefined!, // This will be set in the RouterProvider
	},
});

// Register the router instance for type safety
declare module "@tanstack/react-router" {
	interface Register {
		router: typeof router;
	}
}

function InnerApp() {
	// Use Better Auth's built-in useSession hook and destructure properly
	const session = authClient.useSession();

	// Only log session data in development
	if (import.meta.env.DEV) {
		console.log("Session from useSession hook:", session);
		console.log("Session.data:", session.data);
		console.log("Session.isPending:", session.isPending);
		console.log("Session.error:", session.error);
	}

	// Handle initial loading state or network errors gracefully
	if (session.isPending || (session.error && session.error.status === 0)) {
		return (
			<div className="flex h-screen w-full items-center justify-center">
				<div className="text-center">
					<h1 className="text-2xl font-bold">Loading...</h1>
					<p className="text-muted-foreground">
						{session.error && session.error.status === 0
							? "Connecting to server..."
							: "Please wait while we load your session."}
					</p>
				</div>
			</div>
		);
	}

	return <RouterProvider router={router} context={{ auth: session }} />;
}

function App() {
	return (
		<QueryClientProvider client={queryClient}>
			<ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
				<InnerApp />
				<Toaster />
				<ReactQueryDevtools initialIsOpen={false} />
			</ThemeProvider>
		</QueryClientProvider>
	);
}

const rootElement = document.getElementById("root");
if (rootElement && !rootElement.innerHTML) {
	const root = createRoot(rootElement);
	root.render(
		<StrictMode>
			<App />
		</StrictMode>,
	);
}
