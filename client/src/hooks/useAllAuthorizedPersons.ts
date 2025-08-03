import { useQueries } from "@tanstack/react-query";
import { useFamiliesQuery } from "./useFamilyQuery";
import { orpc } from "@/lib/orpc-react";

export function useAllAuthorizedPersons() {
  // Load family data
  const { data: families = [], isLoading: familiesLoading } = useFamiliesQuery();

  // Load authorized persons from ALL families with memoized keys
  const familyIds = (families || []).map((family: any) => family.id).filter(Boolean);

  const personsQueries = useQueries({
    queries: familyIds.map((familyId: string) => ({
      queryKey: ["family", familyId, "authorizedPersons"],
      queryFn: () => orpc.family.getAuthorizedPersons({ familyId }),
      enabled: !!familyId,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
    })),
  });

  // Check if any query is loading
  const personsLoading = personsQueries.some((query) => query.isLoading);

  // Combine all authorized persons from all families with family info
  const allAuthorizedPersons = personsQueries
    .filter((query) => query.isSuccess && query.data)
    .flatMap((query, index) => {
      const familyId = familyIds[index];
      const family = families.find((f: any) => f.id === familyId);
      const persons = (query.data as any)?.data || [];
      return persons.map((person: any) => ({
        ...person,
        familyName: family?.family?.name || family?.name || "Famiglia sconosciuta",
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
