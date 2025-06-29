import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@/lib/orpc-react";

// Hook for fetching registrations list
export const useRegistrationsQuery = (
	params: {
		limit?: number;
		offset?: number;
		status?: "pending" | "confirmed" | "cancelled" | "waitlist";
		paymentStatus?: "pending" | "completed" | "failed" | "refunded";
		eventId?: string;
	} = {},
) => {
	return useQuery({
		queryKey: ["registrations", "list", params],
		queryFn: async () => {
			// Ensure parameters are properly typed and validated
			const validatedParams = {
				limit: Number(params.limit) || 50,
				offset: Number(params.offset) || 0,
				...(params.status && { status: params.status }),
				...(params.paymentStatus && { paymentStatus: params.paymentStatus }),
				...(params.eventId && { eventId: params.eventId }),
			};

			console.log(
				"Sending registrations request with params:",
				validatedParams,
			);

			const response = await orpc.registrations.list(validatedParams);
			return response.data;
		},
		staleTime: 1 * 60 * 1000, // 1 minute
	});
};

// Hook for fetching single registration details
export const useRegistrationQuery = (id: string) => {
	return useQuery({
		queryKey: ["registrations", "details", id],
		queryFn: async () => {
			const response = await orpc.registrations.get({ id });
			return response.data;
		},
		enabled: !!id,
		staleTime: 5 * 60 * 1000, // 5 minutes
	});
};

// Hook for updating registration status
export const useUpdateRegistrationMutation = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (data: {
			id: string;
			status?: "pending" | "confirmed" | "cancelled" | "waitlist";
			paymentStatus?: "pending" | "completed" | "failed" | "refunded";
			notes?: string;
		}) => {
			const response = await orpc.registrations.updateStatus(data);
			return response.data;
		},
		onSuccess: (_, variables) => {
			// Invalidate registrations list
			queryClient.invalidateQueries({
				queryKey: ["registrations", "list"],
			});
			// Invalidate specific registration details
			queryClient.invalidateQueries({
				queryKey: ["registrations", "details", variables.id],
			});
		},
	});
};

// Hook for creating a new registration
export const useCreateRegistrationMutation = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (data: {
			eventId: string;
			childId: string;
			authorizedPersonIds?: string[];
			notes?: string;
		}) => {
			const response = await orpc.registrations.create(data);
			return response.data;
		},
		onSuccess: (_, variables) => {
			// Invalidate registrations list
			queryClient.invalidateQueries({
				queryKey: ["registrations", "list"],
			});
			// Invalidate events list to update participant counts
			queryClient.invalidateQueries({
				queryKey: ["events", "list"],
			});
		},
	});
};

// Types for easier use
export type RegistrationWithDetails = {
	id: string;
	eventId: string;
	status: "pending" | "confirmed" | "cancelled" | "waitlist";
	paymentStatus: "pending" | "completed" | "failed" | "refunded";
	registrationDate: string;
	notes: string | null;
	createdAt: string;
	updatedAt: string;
	child: {
		id: string;
		firstName: string;
		lastName: string;
		birthDate: string;
		allergies: string | null;
		medicalNotes: string | null;
	};
	parent: {
		id: string;
		name: string;
		email: string;
		phoneNumber: string | null;
	};
	event: {
		id: string;
		title: string;
		startDate: string;
		endDate: string | null;
		price: string | null;
	};
	family: {
		id: string;
		name: string;
	};
	authorizedPersons: Array<{
		id: string;
		fullName: string;
		relationship: string;
		phone: string | null;
		email: string | null;
	}>;
};
