import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { orpc } from "../lib/orpc-react";

// Hook for fetching events
export const useEventsQuery = (params?: {
	search?: string;
	limit?: number;
	offset?: number;
	minAge?: number;
	maxAge?: number;
}) => {
	return useQuery({
		queryKey: ["events", "list", params],
		queryFn: async () => {
			const response = await orpc.events.list({
				limit: params?.limit || 20,
				offset: params?.offset || 0,
				...(params?.search && { search: params.search }),
				...(params?.minAge !== undefined && { minAge: params.minAge }),
				...(params?.maxAge !== undefined && { maxAge: params.maxAge }),
			});
			return response;
		},
		staleTime: 1 * 60 * 1000, // 1 minute
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

// Hook for updating an event
export const useUpdateEventMutation = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (data: {
			id: string;
			title?: string;
			description?: string;
			startDate?: string;
			endDate?: string | null;
			location?: string;
			minAge?: number;
			maxAge?: number;
			maxParticipants?: number;
			price?: string;
			status?: "draft" | "open" | "closed" | "full" | "cancelled";
		}) => orpc.events.update(data),
		onSuccess: (_, variables) => {
			// Invalidate and refetch events
			queryClient.invalidateQueries({ queryKey: ["events"] });
			// Invalidate specific event
			queryClient.invalidateQueries({ queryKey: ["events", variables.id] });
		},
	});
};
