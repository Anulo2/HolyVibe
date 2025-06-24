import type React from "react";
import { orpcClient } from "../lib/orpc-client";

/**
 * This component demonstrates oRPC's end-to-end type safety features:
 *
 * 1. Type-safe API calls with auto-completion
 * 2. Automatic type inference from contract definition
 * 3. Runtime and compile-time type checking
 * 4. Error handling with proper types
 * 5. Contract-first development approach
 */
export const ORPCDemo: React.FC = () => {
	const handleApiDemo = async () => {
		// 🚀 oRPC provides full type safety with contract-first approach!

		try {
			// ✅ Type-safe API call with auto-completion
			const familiesResponse = await orpcClient.family.list();

			// ✅ TypeScript knows the exact response structure
			if (familiesResponse.success) {
				// TypeScript auto-completes .data, .success, etc.
				const families = familiesResponse.data;
				console.log("Families:", families);
			}

			// ✅ Type-safe POST request with validation
			const createResponse = await orpcClient.family.create({
				name: "Demo Family",
				description: "Created via oRPC",
			});

			// ✅ oRPC handles all routing automatically
			if (createResponse.success && createResponse.data?.id) {
				const familyId = createResponse.data.id;

				// oRPC knows this requires familyId parameter
				const childrenResponse = await orpcClient.family.getChildren({
					familyId,
				});

				// ✅ Type-safe child creation
				const addChildResponse = await orpcClient.family.addChild({
					familyId,
					firstName: "Demo",
					lastName: "Child",
					birthDate: "2020-01-01",
					// TypeScript will error if we miss required fields
					// or use wrong types
				});

				console.log("Child added:", addChildResponse);
			}
		} catch (error) {
			// ✅ Error handling is also type-safe
			console.error("oRPC Error:", error);
		}
	};

	return (
		<div className="p-4 border rounded-lg bg-green-50">
			<h3 className="text-lg font-semibold mb-2">🛡️ oRPC Type Safety Demo</h3>
			<p className="text-sm text-gray-600 mb-4">
				This demo shows how oRPC provides end-to-end type safety with
				contract-first development between your server and React frontend.
			</p>

			<div className="space-y-2 text-sm">
				<div className="flex items-center space-x-2">
					<span className="text-green-600">✅</span>
					<span>Contract-first development</span>
				</div>
				<div className="flex items-center space-x-2">
					<span className="text-green-600">✅</span>
					<span>Auto-completion for API endpoints</span>
				</div>
				<div className="flex items-center space-x-2">
					<span className="text-green-600">✅</span>
					<span>Type inference from contract schema</span>
				</div>
				<div className="flex items-center space-x-2">
					<span className="text-green-600">✅</span>
					<span>Compile-time error checking</span>
				</div>
				<div className="flex items-center space-x-2">
					<span className="text-green-600">✅</span>
					<span>Runtime validation</span>
				</div>
				<div className="flex items-center space-x-2">
					<span className="text-green-600">✅</span>
					<span>Automatic OpenAPI generation</span>
				</div>
			</div>

			<button
				onClick={handleApiDemo}
				className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
				type="button"
			>
				Test oRPC APIs
			</button>
		</div>
	);
};
