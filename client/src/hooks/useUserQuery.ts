import { useMutation, useQueryClient } from "@tanstack/react-query";
import { authClient } from "../lib/auth-client";
import { orpc } from "../lib/orpc-react";

// Hook for updating user profile
export const useUserProfileMutation = () => {
	const queryClient = useQueryClient();
	const session = authClient.useSession();

	return useMutation({
		mutationFn: (data: {
			name?: string;
			email?: string;
			phoneNumber?: string;
		}) => orpc.user.updateProfile(data),
		onSuccess: async () => {
			// Refresh the Better Auth session to get updated user data
			await session.refetch();
			// Invalidate user-related queries
			queryClient.invalidateQueries({ queryKey: ["user"] });
		},
	});
};
