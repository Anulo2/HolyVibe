import { createFileRoute, redirect } from "@tanstack/react-router";
import DashboardPage from "@/pages/Dashboard";

export const Route = createFileRoute("/dashboard")({
	beforeLoad: ({ context }) => {
		// Debug: Log auth context to understand the structure
		console.log("Dashboard beforeLoad - auth context:", context.auth);
		console.log("Dashboard beforeLoad - auth.data:", context.auth.data);
		console.log(
			"Dashboard beforeLoad - auth.data?.user:",
			context.auth.data?.user,
		);

		if (!context.auth.data?.user) {
			console.log(
				"Dashboard beforeLoad - redirecting to login because no user found",
			);
			throw redirect({
				to: "/login",
				search: {
					redirect: location.href,
				},
			});
		}
	},
	component: DashboardComponent,
});

function DashboardComponent() {
	const { auth } = Route.useRouteContext();
	// Debug: Log the auth data in the component
	console.log("Dashboard component - auth:", auth);
	console.log("Dashboard component - auth.data:", auth.data);

	const session = auth.data!;
	return <DashboardPage session={session} />;
}
