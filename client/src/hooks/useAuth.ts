import { useQuery } from "@tanstack/react-query";
import { authClient } from "@/lib/auth-client";
import { orpc } from "@/lib/orpc-react";

export function useAuth() {
	// Get the Better Auth session
	const session = authClient.useSession();

	// Get user's organization role
	const userRoleQuery = useQuery({
		queryKey: ["user", "role"],
		queryFn: async () => {
			try {
				const response = await orpc.user.getCurrentUserRole();
				return response;
			} catch (error) {
				console.error("Error fetching user role:", error);
				return null;
			}
		},
		enabled: !!session.data?.user?.id,
		staleTime: 5 * 60 * 1000, // 5 minutes
	});

	return {
		session: session.data,
		user: session.data?.user,
		userRole: userRoleQuery.data?.data?.role || null,
		loading: session.isPending || userRoleQuery.isLoading,
		error: session.error || userRoleQuery.error,
		signOut: () => authClient.signOut(),
	};
}
