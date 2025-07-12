import { createFileRoute, redirect } from "@tanstack/react-router";
import LoginPage from "@/pages/LoginPage";

export const Route = createFileRoute("/login")({
	validateSearch: (search: Record<string, unknown>) => {
		return {
			redirect: (search.redirect as string) || "",
		};
	},
	component: LoginComponent,
	beforeLoad: ({ context, search }) => {
		// Check if user is already authenticated using Better Auth session format
		if (context.auth.data?.user) {
			// If there's a redirect URL, use it, otherwise go to dashboard
			const redirectUrl = (search as any).redirect || "/dashboard";
			throw redirect({
				to: redirectUrl,
			});
		}
	},
});

function LoginComponent() {
	const { redirect } = Route.useSearch();
	return <LoginPage redirectUrl={redirect} />;
}
