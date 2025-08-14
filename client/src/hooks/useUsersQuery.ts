import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { orpcClient } from "@/lib/orpc-client";

// Type for user with organization details
export type UserWithRole = {
  id: string;
  name: string | null;
  email: string;
  phoneNumber: string | null;
  birthDate: string | null;
  createdAt: string;
  updatedAt: string;
  role: string | null;
  organizationId: string | null;
  joinedAt: string | null;
};

// Query params type
export type UsersQueryParams = {
  search?: string;
  role?: string;
  limit?: number;
  offset?: number;
};

// Hook to fetch users (admin only)
export const useUsersQuery = (params: UsersQueryParams = {}) => {
  return useQuery({
    queryKey: ["users", params],
    queryFn: async () => {
      const response = await orpcClient.user.list({
        search: params.search,
        role: params.role,
        limit: params.limit || 1000,
        offset: params.offset || 0,
      });

      if (!response.success) {
        throw new Error("Failed to fetch users");
      }

      return response.data;
    },
    staleTime: 0, // Always fresh data
    gcTime: 0, // No caching
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
};

// Hook to update user role
export const useUpdateUserRoleMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { userId: string; role: string }) => {
      const response = await orpcClient.user.updateRole({
        userId: params.userId,
        role: params.role as
          | "amministratore"
          | "editor"
          | "animatore"
          | "genitore",
      });

      if (!response.success) {
        throw new Error("Failed to update user role");
      }

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("Ruolo utente aggiornato con successo");
    },
    onError: (error) => {
      console.error("Error updating user role:", error);
      toast.error("Errore nell'aggiornamento del ruolo utente");
    },
  });
};

// Hook to remove user from organization
export const useRemoveUserFromOrganizationMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const response = await orpcClient.user.removeFromOrganization({
        userId,
      });

      if (!response.success) {
        throw new Error("Failed to remove user from organization");
      }

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("Utente rimosso dall'organizzazione");
    },
    onError: (error) => {
      console.error("Error removing user from organization:", error);
      toast.error("Errore nella rimozione dell'utente");
    },
  });
};

// Hook to delete user permanently (Supreme Admin only)
export const useDeleteUserMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const response = await orpcClient.supremeAdmin.deleteUser({
        userId,
      });

      if (!response.success) {
        throw new Error("Failed to delete user");
      }

      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supreme-admin", "users"] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("Utente eliminato definitivamente dal sistema");
    },
    onError: (error) => {
      console.error("Error deleting user:", error);
      toast.error("Errore nell'eliminazione dell'utente");
    },
  });
};
