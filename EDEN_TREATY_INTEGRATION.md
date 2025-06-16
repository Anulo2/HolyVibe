# Eden Treaty Integration for End-to-End Type Safety

This project now uses **Eden Treaty** from ElysiaJS to provide complete end-to-end type safety between the Elysia backend and React frontend.

## 🛡️ What is Eden Treaty?

Eden Treaty is a powerful tool that creates an object representation to interact with your Elysia server, featuring:

- **End-to-end type safety** - Types flow from server to client automatically
- **Auto-completion** - Full IDE support with IntelliSense
- **Runtime validation** - Both compile-time and runtime type checking
- **Error handling** - Type-safe error responses
- **No code generation** - Works directly with TypeScript inference

## 🏗️ Architecture

### Server Side (Elysia)

```typescript
// server/src/app.ts
export const app = new Elysia()
  .use(cors())
  .use(auth)
  .use(familyRoutes) // Family management API routes
  .listen(3000)

// server/src/exports.ts
export type App = typeof app
```

### Client Side (React)

```typescript
// client/src/lib/api-client.ts
import { treaty } from '@elysiajs/eden'
import type { App } from '../../../server/src/exports'

// Create type-safe API client
export const api = treaty<App>('localhost:3000')
```

## 🚀 Usage Examples

### 1. Type-Safe API Calls

```typescript
// ✅ Full auto-completion and type checking
const { data, error } = await api.family.get({
  $headers: {
    'user-id': getCurrentUserId()
  }
})

if (data?.success) {
  // TypeScript knows the exact structure
  const families = data.data
}
```

### 2. Dynamic Routes with Parameters

```typescript
// ✅ Eden Treaty handles dynamic routes elegantly
const childrenResponse = await api
  .family({ familyId: 'family-123' })
  .children
  .get({
    $headers: { 'user-id': 'user-1' }
  })
```

### 3. POST Requests with Validation

```typescript
// ✅ Request body is type-checked against server schema
const response = await api.family.post({
  name: "My Family",
  description: "Optional description"
}, {
  $headers: { 'user-id': 'user-1' }
})
```

### 4. Error Handling

```typescript
// ✅ Errors are also type-safe
if (response.error) {
  // TypeScript knows this is an error response
  console.error('API Error:', response.error)
}
```

## 📁 File Structure

```
client/src/
├── lib/
│   ├── api-client.ts       # Eden Treaty client setup
│   └── auth-client.ts      # Better Auth client
├── hooks/
│   └── useFamily.ts        # Custom hooks using Eden Treaty
├── pages/
│   ├── Dashboard.tsx       # Uses Eden Treaty data
│   └── LoginPage.tsx       # Phone authentication
└── components/
    └── EdenTreatyDemo.tsx  # Demo of type safety features

server/src/
├── routes/
│   └── family.ts           # Family management API routes
├── exports.ts              # Export app type for client
├── auth.ts                 # Better Auth configuration
└── app.ts                  # Main Elysia app
```

## 🔄 Custom Hooks with Eden Treaty

The project includes custom React hooks that encapsulate Eden Treaty calls:

```typescript
// client/src/hooks/useFamily.ts
export const useFamilies = () => {
  const [families, setFamilies] = useState<Family[]>([])
  const [loading, setLoading] = useState(true)

  const fetchFamilies = async () => {
    // Using Eden Treaty for type-safe API call
    const { data, error } = await api.family.get({
      $headers: { 'user-id': getCurrentUserId() }
    })
    
    if (data?.success) {
      setFamilies(data.data?.map(item => item.family) || [])
    }
  }

  return { families, loading, createFamily, refetch: fetchFamilies }
}
```

## 🎯 Key Benefits

### 1. **Type Safety**
- Compile-time error checking
- Runtime validation
- No manual type definitions needed

### 2. **Developer Experience**
- Full auto-completion in IDE
- Immediate feedback on API changes
- Self-documenting API calls

### 3. **Maintainability**
- Single source of truth for types
- Automatic updates when server changes
- Reduced bugs from type mismatches

### 4. **Performance**
- No code generation step
- Tree-shakeable imports
- Minimal runtime overhead

## 🔧 API Routes Available

The following family management routes are available with full type safety:

### Families
- `GET /family` - Get user's families
- `POST /family` - Create new family

### Children
- `GET /family/:familyId/children` - Get children in family
- `POST /family/:familyId/children` - Add child to family

### Authorized Persons
- `GET /family/:familyId/authorized-persons` - Get authorized persons
- `POST /family/:familyId/authorized-persons` - Add authorized person

## 🧪 Testing Type Safety

The project includes a demo component (`EdenTreatyDemo.tsx`) that showcases:

- Auto-completion for API endpoints
- Type inference from server schema
- Compile-time error checking
- Runtime validation
- Error handling with proper types

## 🔄 Development Workflow

1. **Define API routes** in Elysia with proper validation schemas
2. **Export app type** from server
3. **Import type in client** and create Eden Treaty client
4. **Use in React components** with full type safety
5. **Enjoy auto-completion** and compile-time error checking!

## 📚 References

- [Eden Treaty Documentation](https://elysiajs.com/eden/treaty/overview.html)
- [ElysiaJS Documentation](https://elysiajs.com/)
- [Better Auth Integration](https://www.better-auth.com/docs/integrations/elysia)

---

This integration provides a robust foundation for building type-safe full-stack applications with Elysia and React! 