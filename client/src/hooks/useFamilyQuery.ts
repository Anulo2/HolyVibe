import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { orpc } from "../lib/orpc-react";

// Hook for fetching user's families
export const useFamiliesQuery = () => {
	return useQuery({
		queryKey: ["families"],
		queryFn: async () => {
			const response = await orpc.family.list();
			// Extract the families from the response structure
			return response.data.map((item) => item.family);
		},
	});
};

// Hook for creating a new family
export const useCreateFamilyMutation = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (data: { name: string; description?: string }) =>
			orpc.family.create(data),
		onSuccess: () => {
			// Invalidate and refetch families query
			queryClient.invalidateQueries({ queryKey: ["families"] });
		},
	});
};

// Hook for fetching children in a family
export const useFamilyChildrenQuery = (familyId: string) => {
	return useQuery({
		queryKey: ["family", familyId, "children"],
		queryFn: async () => {
			const response = await orpc.family.getChildren({ familyId });
			return response.data;
		},
		enabled: !!familyId,
	});
};

// Hook for adding a child to a family
export const useAddChildMutation = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (data: {
			familyId: string;
			firstName: string;
			lastName: string;
			birthDate: string;
			birthPlace?: string;
			fiscalCode?: string;
			gender?: "M" | "F" | "O";
			allergies?: string;
			medicalNotes?: string;
		}) => orpc.family.addChild(data),
		onSuccess: (_, variables) => {
			// Invalidate children query for this family
			queryClient.invalidateQueries({
				queryKey: ["family", variables.familyId, "children"],
			});
		},
	});
};

// Hook for fetching authorized persons in a family
export const useFamilyAuthorizedPersonsQuery = (familyId: string) => {
	return useQuery({
		queryKey: ["family", familyId, "authorizedPersons"],
		queryFn: async () => {
			const response = await orpc.family.getAuthorizedPersons({ familyId });
			return response.data;
		},
		enabled: !!familyId,
	});
};

// Hook for adding an authorized person to a family
export const useAddAuthorizedPersonMutation = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (data: {
			familyId: string;
			fullName: string;
			relationship: string;
			phone?: string;
			email?: string;
		}) => orpc.family.addAuthorizedPerson(data),
		onSuccess: (_, variables) => {
			// Invalidate authorized persons query for this family
			queryClient.invalidateQueries({
				queryKey: ["family", variables.familyId, "authorizedPersons"],
			});
		},
	});
};

// Hook for updating an authorized person
export const useUpdateAuthorizedPersonMutation = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (data: {
			id: string;
			fullName?: string;
			relationship?: string;
			phone?: string;
			email?: string;
		}) => orpc.family.updateAuthorizedPerson(data),
		onSuccess: () => {
			// Invalidate all authorized persons queries to refresh the data
			queryClient.invalidateQueries({
				queryKey: ["family"],
				predicate: (query) => query.queryKey[2] === "authorizedPersons",
			});
		},
	});
};

// Hook for updating a family
export const useUpdateFamilyMutation = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (data: {
			id: string;
			name?: string;
			description?: string;
		}) => orpc.family.updateFamily(data),
		onSuccess: () => {
			// Invalidate families query to refresh the list
			queryClient.invalidateQueries({ queryKey: ["families"] });
		},
	});
};

// Hook for updating a child
export const useUpdateChildMutation = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (data: {
			id: string;
			firstName?: string;
			lastName?: string;
			birthDate?: string;
			birthPlace?: string;
			fiscalCode?: string;
			gender?: "M" | "F" | "O";
			allergies?: string;
			medicalNotes?: string;
		}) => orpc.family.updateChild(data),
		onSuccess: () => {
			// Invalidate all children queries to refresh the data
			queryClient.invalidateQueries({
				queryKey: ["family"],
				predicate: (query) => query.queryKey[2] === "children",
			});
			// Also invalidate all families queries to refresh any family-level data
			queryClient.invalidateQueries({
				queryKey: ["families"],
			});
		},
		onError: (error) => {
			console.error("Error in updateChild mutation:", error);
		},
	});
};
