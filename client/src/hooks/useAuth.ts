import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { authClient } from "@/lib/auth-client";
import { orpc } from "@/lib/orpc-react";
import { useCheckPhoneInvitationsMutation } from "./useFamily";
import { toast } from "@/hooks/use-toast";

export function useAuth() {
  // Keep track of whether we've already checked invitations this session
  const hasCheckedInvitations = useRef(false);

  // Get the Better Auth session
  const session = authClient.useSession();

  // Get user's organization role
  const userRoleQuery = useQuery({
    queryKey: ["user", "role"],
    queryFn: async () => {
      try {
        const response = await orpc.user.getCurrentUserRole();
        return response;
      } catch (error) {
        console.error("Error fetching user role:", error);
        return null;
      }
    },
    enabled: !!session.data?.user,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  // Phone invitation checking mutation
  const checkPhoneInvitationsMutation = useCheckPhoneInvitationsMutation();

  // Check for phone invitations only once per session when user is authenticated
  useEffect(() => {
    if (
      session.data?.user &&
      !hasCheckedInvitations.current &&
      !checkPhoneInvitationsMutation.isPending
    ) {
      hasCheckedInvitations.current = true;

      checkPhoneInvitationsMutation.mutate(undefined, {
        onSuccess: (data) => {
          if (data.acceptedInvitations > 0) {
            toast({
              title: "Inviti accettati automaticamente",
              description: `Sei stato aggiunto automaticamente a ${data.acceptedInvitations} ${
                data.acceptedInvitations === 1 ? "famiglia" : "famiglie"
              }: ${data.familyNames.join(", ")}`,
            });
          }
        },
        onError: (error) => {
          console.error("Error checking phone invitations:", error);
          // Reset the flag so we can try again later
          hasCheckedInvitations.current = false;
        },
      });
    }
  }, [session.data?.user, checkPhoneInvitationsMutation]);

  // Reset the flag when user logs out
  useEffect(() => {
    if (!session.data?.user) {
      hasCheckedInvitations.current = false;
    }
  }, [session.data?.user]);

  return {
    ...session,
    userRole: userRoleQuery.data?.data?.role || null,
    isLoadingRole: userRoleQuery.isLoading,
    loading: session.isPending || userRoleQuery.isLoading,
    session: session.data,
    signOut: authClient.signOut,
  };
}
