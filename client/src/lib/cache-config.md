# Cache Configuration Documentation

This document outlines the no-cache configuration implemented in this application to ensure fresh data on every request.

## Overview

The application has been configured to disable all caching mechanisms to guarantee that users always receive the most up-to-date data from the server. This includes:

1. **HTTP Cache Headers** - Disabled at the fetch level
2. **React Query Caching** - Disabled with `staleTime: 0` and `cacheTime: 0`
3. **Browser Caching** - Prevented with cache-control headers

## Configuration Files

### 1. React Query Global Configuration

**File**: `src/lib/orpc-react.ts`

```typescript
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0,           // Always consider data stale
      cacheTime: 0,           // Don't cache data
      refetchOnWindowFocus: true,
      refetchOnMount: true,
      refetchOnReconnect: true,
      retry: false,           // Don't retry to avoid stale data
    },
  },
});
```

### 2. ORPC Client Configuration

**Files**: `src/lib/orpc-client.ts` and `src/lib/orpc-react.ts`

Both files include custom fetch configuration with no-cache headers:

```typescript
const link = new RPCLink({
  url: getOrpcUrl(),
  fetch: (input, init) => {
    return fetch(input, {
      ...init,
      credentials: "include",
      cache: "no-cache",
      headers: {
        ...init?.headers,
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  },
});
```

## Individual Hook Configurations

All hooks have been updated to include no-cache settings:

```typescript
// Example hook configuration
const useExampleQuery = () => {
  return useQuery({
    queryKey: ["example"],
    queryFn: fetchData,
    staleTime: 0,               // Always fresh data
    cacheTime: 0,               // No caching
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
};
```

## Updated Hooks

The following hooks have been updated to disable caching:

- `useAdvancedReports.ts`
- `useAllAuthorizedPersons.ts`
- `useAllChildren.ts`
- `useAuth.ts`
- `useEventDetailsExtended.ts`
- `useEventsQuery.ts`
- `useRegistrationsQuery.ts`
- `useUsersQuery.ts`

## Utility Hook

**File**: `src/hooks/useNoCacheQuery.ts`

A utility hook is available for components that need guaranteed fresh data:

```typescript
import { useNoCacheQuery } from '@/hooks/useNoCacheQuery';

const { data } = useNoCacheQuery({
  queryKey: ['fresh-data'],
  queryFn: fetchFreshData,
});
```

## HTTP Headers Explained

### Cache-Control: no-cache, no-store, must-revalidate
- `no-cache`: Forces caches to validate with the server before using cached data
- `no-store`: Prevents storing the response in any cache
- `must-revalidate`: Forces cache validation when content becomes stale

### Pragma: no-cache
- Legacy HTTP/1.0 header for older browsers

### Expires: 0
- Sets expiration date to the past, ensuring content is always stale

## Performance Considerations

⚠️ **Important**: Disabling all caching will increase:
- Server load (more requests)
- Network traffic
- Loading times
- Data usage

This configuration prioritizes data freshness over performance. Consider re-enabling selective caching for:
- Static content
- Rarely changing data
- Non-critical updates

## Monitoring

Monitor the following metrics after deployment:
- Server response times
- Database query performance
- Network bandwidth usage
- User experience metrics

## Exceptions

Some queries may retain specific behaviors:

1. **System Info Query** (`useSettings.ts`):
   ```typescript
   refetchInterval: 60000, // Refresh every minute for real-time monitoring
   ```

2. **Invitation Details** (`useFamily.ts`):
   ```typescript
   staleTime: 0, // Always fresh for security
   ```

## Future Considerations

If performance becomes an issue, consider implementing:

1. **Selective Caching**: Enable caching for specific, less critical data
2. **Time-based Invalidation**: Short cache times (30s-2min) for some queries
3. **Manual Refresh**: User-triggered refresh buttons for heavy queries
4. **Background Sync**: Periodic background updates with cached display data

## Testing

To verify no-cache behavior:

1. Open browser dev tools → Network tab
2. Perform actions that trigger queries
3. Check request headers include no-cache directives
4. Verify each request hits the server (no 304 responses)
5. Check response headers confirm no caching

## Rollback Plan

To re-enable caching:

1. Update `queryClient` configuration in `orpc-react.ts`
2. Remove no-cache headers from fetch configuration
3. Update individual hooks to include appropriate `staleTime` values
4. Test thoroughly in staging environment