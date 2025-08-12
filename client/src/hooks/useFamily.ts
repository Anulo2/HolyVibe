import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { orpcClient } from "@/lib/orpc-client";

// Hook per ottenere la lista delle famiglie dell'utente
export function useFamiliesQuery() {
	return useQuery({
		queryKey: ["families"],
		queryFn: async () => {
			const result = await orpcClient.family.list();
			if (!result.success) {
				throw new Error("Failed to fetch families");
			}
			// Extract just the family data from the response structure
			return result.data.map((item: { family: any }) => item.family);
		},
	});
}

// Hook per creare una nuova famiglia
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

// Hook per aggiornare una famiglia
export function useUpdateFamilyMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (data: {
			id: string;
			name?: string;
			description?: string;
		}) => {
			const result = await orpcClient.family.updateFamily(data);
			if (!result.success) {
				throw new Error("Failed to update family");
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
	});
}

// Hook per aggiungere un figlio a una famiglia
export function useAddChildMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (data: {
			familyId: string;
			firstName: string;
			lastName: string;
			birthDate: string;
			birthPlace?: string;
			fiscalCode: string;
			gender?: "M" | "F";
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
		},
	});
}

// Hook per aggiornare un figlio
export function useUpdateChildMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (data: {
			id: string;
			firstName: string;
			lastName: string;
			birthDate: string;
			birthPlace?: string;
			fiscalCode?: string;
			gender?: "M" | "F";
			allergies?: string;
			medicalNotes?: string;
		}) => {
			const result = await orpcClient.family.updateChild(data);
			if (!result.success) {
				throw new Error("Failed to update child");
			}
			return result.data;
		},
		onSuccess: (data) => {
			queryClient.invalidateQueries({
				queryKey: ["family", data.familyId, "children"],
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
		},
	});
}

// Hook per aggiornare una persona autorizzata
export function useUpdateAuthorizedPersonMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (data: {
			id: string;
			fullName: string;
			relationship: string;
			phone?: string;
			email?: string;
		}) => {
			const result = await orpcClient.family.updateAuthorizedPerson(data);
			if (!result.success) {
				throw new Error("Failed to update authorized person");
			}
			return result.data;
		},
		onSuccess: (data) => {
			queryClient.invalidateQueries({
				queryKey: ["family", data.familyId, "authorizedPersons"],
			});
		},
	});
}

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
	});
}

// Hook per inviare un invito
export function useSendInvitationMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (data: {
			familyId: string;
			email?: string;
			phoneNumber?: string;
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

// Hook per ottenere i membri/genitori di una famiglia
export function useFamilyMembersQuery(familyId: string) {
	return useQuery({
		queryKey: ["family", familyId, "members"],
		queryFn: async () => {
			const result = await orpcClient.family.getMembers({ familyId });
			if (!result.success) {
				throw new Error("Failed to fetch family members");
			}
			return result.data;
		},
		enabled: !!familyId,
	});
}

// Hook per ottenere i dettagli di un invito (pubblico)
export function useInvitationDetailsQuery(token: string) {
	return useQuery({
		queryKey: ["invitation", "details", token],
		queryFn: async () => {
			const result = await orpcClient.family.getInvitationDetails({ token });
			if (!result.success) {
				throw new Error("Failed to get invitation details");
			}
			return result.data;
		},
		enabled: !!token,
		retry: false,
		staleTime: 0, // Always fresh
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
			queryClient.invalidateQueries({ queryKey: ["families"] });
		},
	});
}

// Hook per annullare un invito
export function useCancelInvitationMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (data: { id: string }) => {
			const result = await orpcClient.family.cancelInvitation(data);
			if (!result.success) {
				throw new Error("Failed to cancel invitation");
			}
			return result.data;
		},
		onSuccess: (_, _variables) => {
			// Invalidate invitations for all families since we don't know which family this belongs to
			queryClient.invalidateQueries({
				queryKey: ["family"],
				predicate: (query) => {
					const queryKey = query.queryKey as string[];
					return queryKey.includes("invitations");
				},
			});
		},
	});
}

// Hook per controllare e accettare automaticamente gli inviti via telefono
export function useCheckPhoneInvitationsMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async () => {
			const result = await orpcClient.family.checkPhoneInvitations();
			if (!result.success) {
				throw new Error("Failed to check phone invitations");
			}
			return result.data;
		},
		onSuccess: (data) => {
			// If any invitations were accepted, invalidate families list
			if (data.acceptedInvitations > 0) {
				queryClient.invalidateQueries({ queryKey: ["families"] });
			}
		},
	});
}
