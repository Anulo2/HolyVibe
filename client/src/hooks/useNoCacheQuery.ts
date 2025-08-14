import {
  type UseQueryOptions,
  type UseQueryResult,
  useQuery,
} from "@tanstack/react-query";

/**
 * A wrapper around useQuery that ensures fresh data by disabling all caching mechanisms.
 * Use this hook when you need to guarantee that data is always fetched fresh from the server.
 */
export function useNoCacheQuery<
  TQueryFnData = unknown,
  TError = Error,
  TData = TQueryFnData,
  TQueryKey extends readonly unknown[] = readonly unknown[],
>(
  options: UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
): UseQueryResult<TData, TError> {
  return useQuery({
    ...options,
    // Force fresh data on every request
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    // Add a timestamp to the query key to ensure uniqueness
    queryKey: [...(options.queryKey || []), Date.now()] as unknown as TQueryKey,
  });
}

/**
 * Helper function to create a no-cache query key with timestamp
 */
export function createNoCacheQueryKey(
  baseKey: readonly unknown[],
): readonly unknown[] {
  return [...baseKey, "no-cache", Date.now()];
}

/**
 * Hook that provides utilities for managing fresh data
 */
export function useFreshDataUtils() {
  /**
   * Forces a query to refetch by invalidating it and adding a timestamp
   */
  const forceRefresh = (queryClient: any, queryKey: readonly unknown[]) => {
    queryClient.invalidateQueries({ queryKey });
    queryClient.refetchQueries({ queryKey });
  };

  /**
   * Removes all cached data for a specific query pattern
   */
  const clearCache = (
    queryClient: any,
    queryKeyPattern: readonly unknown[],
  ) => {
    queryClient.removeQueries({ queryKey: queryKeyPattern });
  };

  return {
    forceRefresh,
    clearCache,
  };
}

/**
 * Utility function to apply no-cache settings to any useQuery options
 */
export function applyNoCacheSettings<T>(options: T): T {
  return {
    ...options,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  };
}

/**
 * Creates a fetch function with no-cache headers for manual API calls
 */
export function createNoCacheFetch() {
  return (input: RequestInfo | URL, init?: RequestInit) => {
    return fetch(input, {
      ...init,
      cache: "no-cache",
      headers: {
        ...init?.headers,
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  };
}

/**
 * Hook that provides a no-cache fetch function
 */
export function useNoCacheFetch() {
  return createNoCacheFetch();
}
