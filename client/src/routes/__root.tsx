import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import type { authClient } from "@/lib/auth-client";

// Better Auth session type from their useSession hook
type AuthSession = ReturnType<typeof authClient.useSession>;

interface MyRouterContext {
	auth: AuthSession;
}

// Error boundary component for router errors
function RouterErrorComponent({ error }: { error: Error }) {
	return (
		<div className="flex h-screen w-full items-center justify-center">
			<div className="text-center">
				<h1 className="text-2xl font-bold text-red-600 mb-4">
					Something went wrong!
				</h1>
				<p className="text-muted-foreground mb-4">{error.message}</p>
				<button
					type="button"
					onClick={() => window.location.reload()}
					className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
				>
					Reload Page
				</button>
			</div>
		</div>
	);
}

// Not found component for 404 errors
function NotFoundComponent() {
	return (
		<div className="flex h-screen w-full items-center justify-center">
			<div className="text-center">
				<h1 className="text-2xl font-bold mb-4">Page Not Found</h1>
				<p className="text-muted-foreground mb-4">
					The page you're looking for doesn't exist.
				</p>
				<a
					href="/"
					className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
				>
					Go Home
				</a>
			</div>
		</div>
	);
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
	component: RootComponent,
	errorComponent: RouterErrorComponent,
	notFoundComponent: NotFoundComponent,
});

function RootComponent() {
	const { auth } = Route.useRouteContext();
	const currentUser = auth.data?.user;

	// For routes like /login, we don't want to show the sidebar/header
	const showLayout = auth.data?.user;

	return (
		<>
			{showLayout ? (
				<div className="min-h-screen bg-background">
					<Header currentUser={currentUser} />
					<div className="container mx-auto flex">
						<Sidebar />
						<main className="flex-1 p-6">
							<Outlet />
						</main>
					</div>
				</div>
			) : (
				<Outlet />
			)}
			
			{process.env.NODE_ENV === "development" && (
				<>
					<ReactQueryDevtools initialIsOpen={false} />
					<TanStackRouterDevtools position="bottom-left" />
				</>
			)}
		</>
	);
}
