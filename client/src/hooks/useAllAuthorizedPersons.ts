import { useQueries } from "@tanstack/react-query";
import { orpc } from "@/lib/orpc-react";
import { useFamiliesQuery } from "./useFamilyQuery";

export function useAllAuthorizedPersons() {
  // Load family data
  const { data: families = [], isLoading: familiesLoading } =
    useFamiliesQuery();

  // Load authorized persons from ALL families with memoized keys
  const familyIds = (families || [])
    .map((item: any) => item.family?.id)
    .filter(Boolean);

  const personsQueries = useQueries({
    queries: familyIds.map((familyId: string) => ({
      queryKey: ["family", familyId, "authorizedPersons"],
      queryFn: () => orpc.family.getAuthorizedPersons({ familyId }),
      enabled: !!familyId,
      staleTime: 0, // Always fresh data
      gcTime: 0, // No caching
      refetchOnMount: true,
      refetchOnWindowFocus: true,
    })),
  });

  // Check if any query is loading
  const personsLoading = personsQueries.some((query) => query.isLoading);

  // Combine all authorized persons from all families with family info
  const allAuthorizedPersons = personsQueries
    .filter((query) => query.isSuccess && query.data)
    .flatMap((query, index) => {
      const familyId = familyIds[index];
      const family = families.find((f: any) => f.family?.id === familyId);
      const persons = (query.data as any)?.data || [];
      return persons.map((person: any) => ({
        ...person,
        family: {
          id: familyId,
          name: family?.family?.name || "Famiglia sconosciuta",
        },
        familyName: family?.family?.name || "Famiglia sconosciuta", // Keep for backward compatibility
      }));
    });

  return {
    allAuthorizedPersons,
    isLoading: familiesLoading || personsLoading,
    familiesLoading,
    personsLoading,
    families,
  };
}
