# oRPC Migration Documentation

This document outlines the complete migration from Elysia + Eden Treaty to oRPC for the HolyVibe family management application.

## What Changed

### Backend (Server)

#### 1. Dependency Changes
- **Added**: `@orpc/server`, `@orpc/zod`
- **Removed**: Custom Elysia route definitions

#### 2. New Structure
```
server/src/
├── orpc/
│   ├── contract.ts     # Contract-first API definitions
│   ├── server.ts       # oRPC route implementations
│   ├── app.ts          # oRPC + Elysia integration
│   └── types.ts        # Type exports for client
├── auth.ts             # Better Auth (unchanged)
├── db/                 # Database (unchanged)
└── index.ts            # Updated to use oRPC app
```

#### 3. Contract-First Development
- All API endpoints are now defined in `orpc/contract.ts` using Zod schemas
- Type safety is enforced at compile time
- Automatic validation for inputs and outputs

#### 4. Route Implementation
- Authentication middleware using Better Auth sessions
- Proper error handling with oRPC error types
- Consistent response formats across all endpoints

#### 5. Integration with Elysia
- oRPC runs as a fetch handler under `/api/*` routes
- Better Auth continues to handle authentication
- CORS and other middleware work as before

### Frontend (Client)

#### 1. Dependency Changes
- **Added**: `@orpc/client`, `@orpc/react`
- **Removed**: `@elysiajs/eden`

#### 2. New Structure
```
client/src/
├── lib/
│   ├── orpc-client.ts  # oRPC client configuration
│   └── orpc-react.ts   # React hooks integration
├── hooks/
│   ├── useFamilyQuery.ts   # Updated to use oRPC hooks
│   ├── useEventsQuery.ts   # New oRPC event hooks
│   └── useUserQuery.ts     # New oRPC user hooks
└── components/
    └── ORPCDemo.tsx        # Demo component for oRPC
```

#### 3. React Hooks Integration
- Full TanStack Query integration through `@orpc/react`
- Automatic type inference from server contract
- Built-in loading states, error handling, and cache management

#### 4. Type Safety
- End-to-end type safety from server to client
- Auto-completion for all API calls
- Compile-time error checking

## API Endpoints Migrated

### Family Management
- `GET /family` - List user's families
- `POST /family` - Create new family
- `GET /family/{familyId}/children` - Get family children
- `POST /family/{familyId}/children` - Add child to family
- `GET /family/{familyId}/authorized-persons` - Get authorized persons
- `POST /family/{familyId}/authorized-persons` - Add authorized person

### Events
- `GET /events` - List events with filtering
- `GET /events/{id}` - Get single event
- `POST /events` - Create new event

### User
- `PATCH /user/profile` - Update user profile

## Authentication

Authentication continues to use Better Auth with the following changes:
- oRPC middleware extracts user session from Better Auth
- Sessions are passed to route handlers through context
- No changes to client-side authentication flow

## Benefits of Migration

### 1. Type Safety
- **Before**: Manual type definitions, potential runtime errors
- **After**: Contract-first with automatic type inference

### 2. Developer Experience
- **Before**: Separate client/server type definitions
- **After**: Single source of truth with automatic sync

### 3. Error Handling
- **Before**: Custom error response handling
- **After**: Standardized oRPC error types with better debugging

### 4. Validation
- **Before**: Manual validation with TypeBox in Elysia
- **After**: Automatic validation through Zod schemas

### 5. Documentation
- **Before**: Manual API documentation
- **After**: Automatic OpenAPI generation from contracts

## Running the Application

### Server
```bash
cd server
bun run dev
```

### Client
```bash
cd client
bun run dev
```

## Testing the Migration

1. **Start both server and client**
2. **Test authentication flow** - Login with phone number
3. **Test family creation** - Create a new family
4. **Test child management** - Add children to families
5. **Test authorized persons** - Add authorized pickup persons
6. **Test events** - Browse and create events

## Key Files Modified

### Server
- `server/src/index.ts` - Updated to use oRPC app
- `server/src/exports.ts` - Updated to export oRPC types

### Client
- `client/src/main.tsx` - Added oRPC Provider
- `client/src/hooks/useFamilyQuery.ts` - Converted to oRPC hooks
- `client/src/pages/Dashboard.tsx` - Updated to use new hook signatures

## Migration Checklist

- ✅ Created oRPC contract definition
- ✅ Implemented oRPC server with Better Auth integration
- ✅ Created oRPC client configuration
- ✅ Migrated React hooks to use oRPC
- ✅ Updated main components to use new API
- ✅ Removed old Elysia routes and Eden Treaty code
- ✅ Tested core functionality (family management)
- ⏳ Add organization management (if needed)
- ⏳ Add complete event registration flow
- ⏳ Add admin panel functionality

## Troubleshooting

### Common Issues

1. **Type Errors**: Ensure all imports point to new oRPC files
2. **Authentication**: Verify Better Auth session handling in oRPC middleware
3. **CORS**: Check that credentials are included in oRPC client
4. **Routes**: Ensure API calls use `/api/` prefix

### Debug Tips

1. Check browser network tab for API calls
2. Verify server logs for oRPC error messages
3. Use oRPC's built-in debugging features
4. Check React Query DevTools for cache state 