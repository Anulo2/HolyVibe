import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { orpc } from "../lib/orpc-react";

// Hook for fetching events list
export const useEventsQuery = (params?: {
	limit?: number;
	offset?: number;
	minAge?: number;
	maxAge?: number;
	search?: string;
}) => {
	return useQuery({
		queryKey: ["events", params],
		queryFn: () => orpc.events.list(params || {}),
	});
};

// Hook for fetching a single event
export const useEventQuery = (eventId: string) => {
	return useQuery({
		queryKey: ["events", eventId],
		queryFn: () => orpc.events.get({ id: eventId }),
		enabled: !!eventId,
	});
};

// Hook for creating a new event
export const useCreateEventMutation = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (data: {
			title: string;
			description?: string;
			startDate: string;
			endDate?: string;
			location?: string;
			minAge?: number;
			maxAge?: number;
			maxParticipants?: number;
			price?: string;
		}) => orpc.events.create(data),
		onSuccess: () => {
			// Invalidate and refetch events
			queryClient.invalidateQueries({ queryKey: ["events"] });
		},
	});
};
