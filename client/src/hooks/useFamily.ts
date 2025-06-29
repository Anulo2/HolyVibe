import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { orpcClient } from "@/lib/orpc-client";
import {
	type AuthorizedPerson,
	api,
	type Child,
	type Family,
} from "../lib/api-client";

// Hook for fetching user's families
export const useFamilies = () => {
	const [families, setFamilies] = useState<Family[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchFamilies = async () => {
		try {
			setLoading(true);
			setError(null);

			// Using Eden Treaty for type-safe API call
			const { data, error: apiError } = await api.family.get({
				$headers: {
					"user-id": "mock-user-1",
				},
			});

			if (apiError) {
				setError("Failed to fetch families");
				return;
			}

			if (data?.success) {
				// Transform the response data to extract families
				const familyData =
					data.data?.map((item: any) => item.family).filter(Boolean) || [];
				setFamilies(familyData);
			} else {
				setError(data?.error || "Unknown error");
			}
		} catch (err) {
			setError("Failed to fetch families");
			console.error("Error fetching families:", err);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchFamilies();
	}, []);

	const createFamily = async (familyData: {
		name: string;
		description?: string;
	}) => {
		try {
			const { data, error: apiError } = await api.family.post(
				{
					...familyData,
				},
				{
					$headers: {
						"user-id": "mock-user-1",
					},
				},
			);

			if (apiError) {
				throw new Error("Failed to create family");
			}

			if (data?.success) {
				await fetchFamilies(); // Refresh the list
				return data.data;
			} else {
				throw new Error(data?.error || "Unknown error");
			}
		} catch (err) {
			console.error("Error creating family:", err);
			throw err;
		}
	};

	return {
		families,
		loading,
		error,
		createFamily,
		refetch: fetchFamilies,
	};
};

// Hook for managing children in a family
export const useChildren = (familyId?: string) => {
	const [children, setChildren] = useState<Child[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const fetchChildren = async () => {
		if (!familyId) return;

		try {
			setLoading(true);
			setError(null);

			// Using Eden Treaty for type-safe API call
			const { data, error: apiError } = await api
				.family({ familyId })
				.children.get({
					$headers: {
						"user-id": "mock-user-1",
					},
				});

			if (apiError) {
				setError("Failed to fetch children");
				return;
			}

			if (data?.success) {
				setChildren(data.data || []);
			} else {
				setError(data?.error || "Unknown error");
			}
		} catch (err) {
			setError("Failed to fetch children");
			console.error("Error fetching children:", err);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchChildren();
	}, [familyId]);

	const addChild = async (childData: {
		firstName: string;
		lastName: string;
		birthDate: string;
		birthPlace?: string;
		fiscalCode?: string;
		gender?: "M" | "F" | "O";
		allergies?: string;
		medicalNotes?: string;
	}) => {
		if (!familyId) throw new Error("Family ID is required");

		try {
			const { data, error: apiError } = await api
				.family({ familyId })
				.children.post(
					{
						...childData,
					},
					{
						$headers: {
							"user-id": "mock-user-1",
						},
					},
				);

			if (apiError) {
				throw new Error("Failed to add child");
			}

			if (data?.success) {
				await fetchChildren(); // Refresh the list
				return data.data;
			} else {
				throw new Error(data?.error || "Unknown error");
			}
		} catch (err) {
			console.error("Error adding child:", err);
			throw err;
		}
	};

	return {
		children,
		loading,
		error,
		addChild,
		refetch: fetchChildren,
	};
};

// Hook for managing authorized persons in a family
export const useAuthorizedPersons = (familyId?: string) => {
	const [persons, setPersons] = useState<AuthorizedPerson[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const fetchPersons = async () => {
		if (!familyId) return;

		try {
			setLoading(true);
			setError(null);

			// Using Eden Treaty for type-safe API call
			const { data, error: apiError } = await api
				.family({ familyId })
				["authorized-persons"].get({
					$headers: {
						"user-id": "mock-user-1",
					},
				});

			if (apiError) {
				setError("Failed to fetch authorized persons");
				return;
			}

			if (data?.success) {
				setPersons(data.data || []);
			} else {
				setError(data?.error || "Unknown error");
			}
		} catch (err) {
			setError("Failed to fetch authorized persons");
			console.error("Error fetching authorized persons:", err);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchPersons();
	}, [familyId]);

	const addPerson = async (personData: {
		fullName: string;
		relationship: string;
		phone?: string;
		email?: string;
	}) => {
		if (!familyId) throw new Error("Family ID is required");

		try {
			const { data, error: apiError } = await api
				.family({ familyId })
				["authorized-persons"].post(
					{
						...personData,
					},
					{
						$headers: {
							"user-id": "mock-user-1",
						},
					},
				);

			if (apiError) {
				throw new Error("Failed to add authorized person");
			}

			if (data?.success) {
				await fetchPersons(); // Refresh the list
				return data.data;
			} else {
				throw new Error(data?.error || "Unknown error");
			}
		} catch (err) {
			console.error("Error adding authorized person:", err);
			throw err;
		}
	};

	return {
		persons,
		loading,
		error,
		addPerson,
		refetch: fetchPersons,
	};
};

// Hook per ottenere le famiglie dell'utente
export function useFamiliesQuery() {
	return useQuery({
		queryKey: ["families"],
		queryFn: async () => {
			const result = await orpcClient.family.list();
			if (!result.success) {
				throw new Error("Failed to fetch families");
			}
			return result.data;
		},
		staleTime: 5 * 60 * 1000, // 5 minutes
	});
}

// Hook per creare una famiglia
export function useCreateFamilyMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (data: { name: string; description?: string }) => {
			const result = await orpcClient.family.create(data);
			if (!result.success) {
				throw new Error("Failed to create family");
			}
			return result.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["families"] });
		},
	});
}

// Hook per ottenere i figli di una famiglia
export function useFamilyChildrenQuery(familyId: string) {
	return useQuery({
		queryKey: ["family", familyId, "children"],
		queryFn: async () => {
			const result = await orpcClient.family.getChildren({ familyId });
			if (!result.success) {
				throw new Error("Failed to fetch children");
			}
			return result.data;
		},
		enabled: !!familyId,
		staleTime: 5 * 60 * 1000, // 5 minutes
	});
}

// Hook per aggiungere un figlio
export function useAddChildMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (data: {
			familyId: string;
			firstName: string;
			lastName: string;
			birthDate: string;
			birthPlace?: string;
			fiscalCode?: string;
			gender?: "M" | "F" | "O";
			allergies?: string;
			medicalNotes?: string;
		}) => {
			const result = await orpcClient.family.addChild(data);
			if (!result.success) {
				throw new Error("Failed to add child");
			}
			return result.data;
		},
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({
				queryKey: ["family", variables.familyId, "children"],
			});
			queryClient.invalidateQueries({ queryKey: ["families"] });
		},
	});
}

// Hook per aggiornare un figlio
export function useUpdateChildMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (data: {
			id: string;
			familyId: string;
			firstName?: string;
			lastName?: string;
			birthDate?: string;
			birthPlace?: string;
			fiscalCode?: string;
			gender?: "M" | "F" | "O";
			allergies?: string;
			medicalNotes?: string;
		}) => {
			const result = await orpcClient.family.updateChild(data);
			if (!result.success) {
				throw new Error("Failed to update child");
			}
			return result.data;
		},
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({
				queryKey: ["family", variables.familyId, "children"],
			});
		},
	});
}

// Hook per ottenere le persone autorizzate di una famiglia
export function useFamilyAuthorizedPersonsQuery(familyId: string) {
	return useQuery({
		queryKey: ["family", familyId, "authorizedPersons"],
		queryFn: async () => {
			const result = await orpcClient.family.getAuthorizedPersons({ familyId });
			if (!result.success) {
				throw new Error("Failed to fetch authorized persons");
			}
			return result.data;
		},
		enabled: !!familyId,
		staleTime: 5 * 60 * 1000, // 5 minutes
	});
}

// Hook per aggiungere una persona autorizzata
export function useAddAuthorizedPersonMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (data: {
			familyId: string;
			fullName: string;
			relationship: string;
			phone?: string;
			email?: string;
		}) => {
			const result = await orpcClient.family.addAuthorizedPerson(data);
			if (!result.success) {
				throw new Error("Failed to add authorized person");
			}
			return result.data;
		},
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({
				queryKey: ["family", variables.familyId, "authorizedPersons"],
			});
			queryClient.invalidateQueries({ queryKey: ["families"] });
		},
	});
}

// Hook per aggiornare una persona autorizzata
export function useUpdateAuthorizedPersonMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (data: {
			id: string;
			familyId: string;
			fullName?: string;
			relationship?: string;
			phone?: string;
			email?: string;
			isActive?: boolean;
		}) => {
			const result = await orpcClient.family.updateAuthorizedPerson(data);
			if (!result.success) {
				throw new Error("Failed to update authorized person");
			}
			return result.data;
		},
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({
				queryKey: ["family", variables.familyId, "authorizedPersons"],
			});
		},
	});
}

// NUOVI HOOK PER GLI INVITI

// Hook per ottenere gli inviti di una famiglia
export function useFamilyInvitationsQuery(familyId: string) {
	return useQuery({
		queryKey: ["family", familyId, "invitations"],
		queryFn: async () => {
			const result = await orpcClient.family.getInvitations({ familyId });
			if (!result.success) {
				throw new Error("Failed to fetch invitations");
			}
			return result.data;
		},
		enabled: !!familyId,
		staleTime: 1 * 60 * 1000, // 1 minute (più frequente perché gli inviti cambiano stato)
	});
}

// Hook per inviare un invito
export function useSendInvitationMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (data: {
			familyId: string;
			email: string;
			message?: string;
		}) => {
			const result = await orpcClient.family.sendInvitation(data);
			if (!result.success) {
				throw new Error("Failed to send invitation");
			}
			return result.data;
		},
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({
				queryKey: ["family", variables.familyId, "invitations"],
			});
		},
	});
}

// Hook per accettare un invito
export function useAcceptInvitationMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (data: { token: string }) => {
			const result = await orpcClient.family.acceptInvitation(data);
			if (!result.success) {
				throw new Error("Failed to accept invitation");
			}
			return result.data;
		},
		onSuccess: () => {
			// Invalidate families list as user is now part of a new family
			queryClient.invalidateQueries({ queryKey: ["families"] });
		},
	});
}

// Hook per cancellare un invito
export function useCancelInvitationMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (data: { invitationId: string; familyId: string }) => {
			const result = await orpcClient.family.cancelInvitation({
				invitationId: data.invitationId,
			});
			if (!result.success) {
				throw new Error("Failed to cancel invitation");
			}
			return result.data;
		},
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({
				queryKey: ["family", variables.familyId, "invitations"],
			});
		},
	});
}
