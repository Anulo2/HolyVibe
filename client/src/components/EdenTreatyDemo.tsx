import React from 'react';
import { api } from '../lib/api-client';

/**
 * This component demonstrates Eden Treaty's end-to-end type safety features:
 * 
 * 1. Type-safe API calls with auto-completion
 * 2. Automatic type inference from Elysia server
 * 3. Runtime and compile-time type checking
 * 4. Error handling with proper types
 */
export const EdenTreatyDemo: React.FC = () => {
  const handleApiDemo = async () => {
    // 🚀 Eden Treaty provides full type safety!
    
    // ✅ Type-safe API call with auto-completion
    const familiesResponse = await api.family.get({
      $headers: {
        'user-id': 'demo-user'
      }
    });

    // ✅ TypeScript knows the exact response structure
    if (familiesResponse.data?.success) {
      // TypeScript auto-completes .data, .success, etc.
      const families = familiesResponse.data.data;
      console.log('Families:', families);
    }

    // ✅ Type-safe POST request with validation
    const createResponse = await api.family.post({
      name: "Demo Family",
      description: "Created via Eden Treaty"
    }, {
      $headers: {
        'user-id': 'demo-user'
      }
    });

    // ✅ Dynamic route parameters with type safety
    if (createResponse.data?.success && createResponse.data.data?.id) {
      const familyId = createResponse.data.data.id;
      
      // Eden Treaty knows this requires familyId parameter
      const childrenResponse = await api.family({ familyId }).children.get({
        $headers: {
          'user-id': 'demo-user'
        }
      });

      // ✅ Type-safe child creation
      const addChildResponse = await api.family({ familyId }).children.post({
        firstName: "Demo",
        lastName: "Child",
        birthDate: "2020-01-01",
        // TypeScript will error if we miss required fields
        // or use wrong types
      }, {
        $headers: {
          'user-id': 'demo-user'
        }
      });
    }

    // ✅ Error handling is also type-safe
    if (familiesResponse.error) {
      // TypeScript knows this is an error response
      console.error('API Error:', familiesResponse.error);
    }
  };

  return (
    <div className="p-4 border rounded-lg bg-blue-50">
      <h3 className="text-lg font-semibold mb-2">🛡️ Eden Treaty Type Safety Demo</h3>
      <p className="text-sm text-gray-600 mb-4">
        This demo shows how Eden Treaty provides end-to-end type safety between
        your Elysia backend and React frontend.
      </p>
      
      <div className="space-y-2 text-sm">
        <div className="flex items-center space-x-2">
          <span className="text-green-600">✅</span>
          <span>Auto-completion for API endpoints</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-green-600">✅</span>
          <span>Type inference from server schema</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-green-600">✅</span>
          <span>Compile-time error checking</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-green-600">✅</span>
          <span>Runtime validation</span>
        </div>
      </div>

      <button 
        onClick={handleApiDemo}
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Test Eden Treaty APIs
      </button>
    </div>
  );
}; 