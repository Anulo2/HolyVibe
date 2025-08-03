import { useQueries } from "@tanstack/react-query";
import { useFamiliesQuery } from "./useFamilyQuery";
import { orpc } from "@/lib/orpc-react";

export function useAllChildren() {
  // Load family data
  const { data: families = [], isLoading: familiesLoading } =
    useFamiliesQuery();

  // Load children from ALL families with memoized keys
  const familyIds = (families || [])
    .map((item: any) => item.family?.id)
    .filter(Boolean);

  const childrenQueries = useQueries({
    queries: familyIds.map((familyId: string) => ({
      queryKey: ["family", familyId, "children"],
      queryFn: () => orpc.family.getChildren({ familyId }),
      enabled: !!familyId,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
    })),
  });

  // Check if any query is loading
  const childrenLoading = childrenQueries.some((query) => query.isLoading);

  // Combine all children from all families with family info
  const allChildren = childrenQueries
    .filter((query) => query.isSuccess && query.data)
    .flatMap((query, index) => {
      const familyId = familyIds[index];
      const family = families.find((f: any) => f.family?.id === familyId);
      const children = (query.data as any)?.data || [];
      return children.map((child: any) => ({
        ...child,
        familyName: family?.family?.name || "Famiglia sconosciuta",
      }));
    });

  // Calculate age for children
  const calculateAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birth.getDate())
    ) {
      age--;
    }
    return age;
  };

  // Check if child is eligible for an event
  const isChildEligible = (birthDate: string, minAge = 0, maxAge = 100) => {
    const age = calculateAge(birthDate);
    return age >= minAge && age <= maxAge;
  };

  // Get eligible children for a specific event
  const getEligibleChildren = (minAge = 0, maxAge = 100) => {
    return allChildren.filter((child) =>
      isChildEligible(child.birthDate, minAge, maxAge),
    );
  };

  return {
    allChildren,
    isLoading: familiesLoading || childrenLoading,
    familiesLoading,
    childrenLoading,
    families,
    calculateAge,
    isChildEligible,
    getEligibleChildren,
  };
}
