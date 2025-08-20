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
			// Convert offset to page since backend expects page-based pagination
			const limit = Number(params.limit) || 50;
			const offset = Number(params.offset) || 0;
			const page = Math.floor(offset / limit) + 1;

			const validatedParams = {
				limit,
				page,
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
		staleTime: 0, // Always fresh data
		gcTime: 0, // No caching
		refetchOnMount: true,
		refetchOnWindowFocus: true,
		refetchOnReconnect: true,
	});
};

// Hook for fetching ALL registrations across pages (admin view)
export const useAllRegistrationsQuery = (
	params: {
		status?: "pending" | "confirmed" | "cancelled" | "waitlist";
		paymentStatus?: "pending" | "completed" | "failed" | "refunded";
		eventId?: string;
	} = {},
) => {
	return useQuery({
		queryKey: ["registrations", "all", params],
		queryFn: async () => {
			const limit = 100; // server-side max
			let page = 1;
			let total = 0;
			const registrations: RegistrationWithDetails[] = [] as any;

			// First page to get total
			const first = await orpc.registrations.list({
				page,
				limit,
				...(params.status && { status: params.status }),
				...(params.paymentStatus && { paymentStatus: params.paymentStatus }),
				...(params.eventId && { eventId: params.eventId }),
			});
			registrations.push(...(first.data.registrations as any));
			total = first.data.total;

			const totalPages = Math.ceil(total / limit);
			// Fetch remaining pages sequentially to avoid server overload
			for (page = 2; page <= totalPages; page++) {
				const res = await orpc.registrations.list({
					page,
					limit,
					...(params.status && { status: params.status }),
					...(params.paymentStatus && { paymentStatus: params.paymentStatus }),
					...(params.eventId && { eventId: params.eventId }),
				});
				registrations.push(...(res.data.registrations as any));
			}

			return { registrations, total };
		},
		staleTime: 0,
		gcTime: 0,
		refetchOnMount: true,
		refetchOnWindowFocus: true,
		refetchOnReconnect: true,
	});
};

// Hook for fetching single registration details
export const useRegistrationQuery = (id: string) => {
	return useQuery<RegistrationWithDetails>({
		queryKey: ["registrations", "details", id],
		queryFn: async () => {
			const response = await orpc.registrations.get({ id });
			return response.data as RegistrationWithDetails;
		},
		enabled: !!id,
		staleTime: 0, // Always fresh data
		gcTime: 0, // No caching
		refetchOnMount: true,
		refetchOnWindowFocus: true,
		refetchOnReconnect: true,
	});
};

// Hook for updating registration status (admin)
export const useUpdateRegistrationMutation = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (data: {
			id: string;
			status?: "pending" | "confirmed" | "cancelled" | "waitlist";
			paymentStatus?: "pending" | "completed" | "failed" | "refunded";
			notes?: string;
			canExitAlone?: boolean;
			allowedExitLocations?: string[];
			authorizedPersonIds?: string[];
			locationAuthorizations?: Array<{
				authorizedPersonId: string;
				location: string;
				canPickup: boolean;
			}>;
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

// Hook for updating registration by parent (limited fields)
export const useUpdateRegistrationByParentMutation = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (data: {
			id: string;
			notes?: string;
			canExitAlone?: boolean;
			allowedExitLocations?: string[];
			authorizedPersonIds?: string[];
			locationAuthorizations?: Array<{
				authorizedPersonId: string;
				location: string;
				canPickup: boolean;
			}>;
		}) => {
			const response = await orpc.registrations.updateByParent(data);

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
			// Invalidate my registrations
			queryClient.invalidateQueries({
				queryKey: ["registrations", "my"],
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
			photoPrivacyConsent?: boolean;
			dataPrivacyConsent?: boolean;
			canExitAlone?: boolean;
			allowedExitLocations?: string[];
			locationAuthorizations?: Array<{
				authorizedPersonId: string;
				location: string;
				canPickup: boolean;
			}>;
		}) => {
			const response = await orpc.registrations.create(data);
			return response.data;
		},
		onSuccess: (_, _variables) => {
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

// Hook for admin creating registration with family/child
export const useAdminCreateRegistrationMutation = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (data: {
			eventId: string;
			// Parent/Family data
			parentEmail?: string;
			parentName: string;
			parentPhone: string;
			// Family data
			familyName?: string;
			createNewFamily?: boolean;
			familyId?: string;
			// Child data
			childFirstName: string;
			childLastName: string;
			childBirthDate: string;
			childBirthPlace?: string;
			childFiscalCode: string;
			childGender?: "M" | "F";
			childAllergies?: string;
			childMedicalNotes?: string;
			// Registration data
			notes?: string;
			photoPrivacyConsent?: boolean;
			dataPrivacyConsent?: boolean;
			status?: "pending" | "confirmed" | "cancelled" | "waitlist";
			paymentStatus?: "pending" | "completed" | "failed" | "refunded";
			// Authorization data
			authorizedPersonIds?: string[];
			canExitAlone?: boolean;
			allowedExitLocations?: string[];
			locationAuthorizations?: Array<{
				authorizedPersonId: string;
				location: string;
				canPickup: boolean;
			}>;
		}) => {
			const response = await orpc.registrations.adminCreate(data);
			return response.data;
		},
		onSuccess: () => {
			// Invalidate registrations list
			queryClient.invalidateQueries({
				queryKey: ["registrations", "list"],
			});
			// Invalidate events list to update participant counts
			queryClient.invalidateQueries({
				queryKey: ["events", "list"],
			});
			// Invalidate families list in case new family was created
			queryClient.invalidateQueries({
				queryKey: ["families", "list"],
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
	parents: Array<{
		id: string;
		name: string;
		email: string;
		phoneNumber: string | null;
	}>;
	event: {
		id: string;
		title: string;
		startDate: string;
		endDate: string | null;
		price: string | null;
		locations: string;
		status: "draft" | "open" | "closed" | "full" | "cancelled";
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
	photoPrivacyConsent: boolean;
	dataPrivacyConsent: boolean;
	canExitAlone: boolean;
	allowedExitLocations: string[] | null;
	locationAuthorizations: Array<{
		id: string;
		authorizedPersonId: string;
		location: string;
		canPickup: boolean;
	}>;
};

// Hook for fetching user's registration history
export const useMyRegistrationsQuery = (
	params: {
		page?: number;
		limit?: number;
		status?: "pending" | "confirmed" | "cancelled" | "waitlist";
		childId?: string;
	} = {},
) => {
	return useQuery({
		queryKey: ["registrations", "my", params],
		queryFn: async () => {
			const validatedParams = {
				page: Number(params.page) || 1,
				limit: Number(params.limit) || 20,
				...(params.status && { status: params.status }),
				...(params.childId && { childId: params.childId }),
			};

			const response =
				await orpc.registrations.myRegistrations(validatedParams);

			return response.data;
		},
		staleTime: 0, // Always fresh data
		gcTime: 0, // No caching
		refetchOnMount: true,
		refetchOnWindowFocus: true,
		refetchOnReconnect: true,
	});
};

// Hook for checking if a child is already registered for an event
export const useCheckChildRegistrationQuery = (
	eventId: string,
	childId: string,
	enabled: boolean = true,
) => {
	return useQuery({
		queryKey: ["registrations", "check", eventId, childId],
		queryFn: async () => {
			if (!eventId || !childId) return null;

			const response = await orpc.registrations.list({
				eventId,
				childId,
				limit: 1,
			});

			return response.data.registrations.length > 0
				? response.data.registrations[0]
				: null;
		},
		enabled: enabled && !!eventId && !!childId,
		staleTime: 0, // Always fresh data
		gcTime: 0, // No caching
		refetchOnMount: true,
		refetchOnWindowFocus: true,
		refetchOnReconnect: true,
	});
};

// Hook for cancelling a registration
export const useCancelRegistrationMutation = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (data: { id: string }) => {
			const response = await orpc.registrations.cancel(data);
			return response.data;
		},
		onSuccess: () => {
			// Invalidate all registration-related queries
			queryClient.invalidateQueries({
				queryKey: ["registrations"],
			});
		},
	});
};

// Hook for deleting a registration completely (admin only)
export const useDeleteRegistrationMutation = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (data: { id: string }) => {
			const response = await orpc.registrations.delete(data);
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
			// Invalidate my registrations in case it was user's own registration
			queryClient.invalidateQueries({
				queryKey: ["registrations", "my"],
			});
		},
	});
};
