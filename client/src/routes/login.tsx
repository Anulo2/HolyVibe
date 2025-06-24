import { createFileRoute, redirect } from "@tanstack/react-router";
import LoginPage from "@/pages/LoginPage";

export const Route = createFileRoute("/login")({
	component: LoginComponent,
	beforeLoad: ({ context }) => {
		// Check if user is already authenticated using Better Auth session format
		if (context.auth.data?.user) {
			throw redirect({
				to: "/dashboard",
			});
		}
	},
});

function LoginComponent() {
	// No need to pass auth functions - LoginPage will use authClient directly
	return <LoginPage />;
}
