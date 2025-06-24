import { useMutation, useQueryClient } from "@tanstack/react-query";
import { orpc } from "../lib/orpc-react";

// Hook for updating user profile
export const useUserProfileMutation = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (data: {
			name?: string;
			email?: string;
			phoneNumber?: string;
		}) => orpc.user.updateProfile(data),
		onSuccess: () => {
			// Invalidate any user-related queries if needed
			queryClient.invalidateQueries();
		},
	});
};
