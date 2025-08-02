import { nanoid } from "nanoid";
import { eq } from "drizzle-orm";
import * as readline from "readline";
import { db } from "../src/db";
import * as schema from "../src/db/schema";

interface CreateOrgOptions {
	organizationName: string;
	adminName: string;
	adminEmail: string;
	adminPhone: string;
	adminBirthDate?: string;
}

async function createOrganization(options: CreateOrgOptions) {
	const { organizationName, adminName, adminEmail, adminPhone, adminBirthDate } =
		options;

	console.log(`🏢 Creating organization: ${organizationName}`);
	console.log(`👤 Admin: ${adminName} (${adminEmail})`);

	try {
		// Check if organization already exists
		const existingOrg = await db
			.select()
			.from(schema.organization)
			.where(eq(schema.organization.name, organizationName))
			.limit(1);

		if (existingOrg.length > 0) {
			console.log(`❌ Organization "${organizationName}" already exists`);
			return;
		}

		// Check if admin user already exists
		const existingUser = await db
			.select()
			.from(schema.user)
			.where(eq(schema.user.email, adminEmail))
			.limit(1);

		let adminUserId: string;

		if (existingUser.length > 0) {
			adminUserId = existingUser[0].id;
			console.log(`👤 Using existing user: ${adminName}`);
		} else {
			// Create admin user
			adminUserId = nanoid();
			await db.insert(schema.user).values({
				id: adminUserId,
				name: adminName,
				email: adminEmail,
				emailVerified: true,
				phoneNumber: adminPhone,
				phoneNumberVerified: true,
				birthDate: adminBirthDate || null,
				createdAt: new Date(),
				updatedAt: new Date(),
			});
			console.log(`✅ Created admin user: ${adminName}`);
		}

		// Create organization
		const organizationId = nanoid();
		await db.insert(schema.organization).values({
			id: organizationId,
			name: organizationName,
			ownerId: adminUserId,
			createdAt: new Date(),
			updatedAt: new Date(),
		});
		console.log(`✅ Created organization: ${organizationName}`);

		// Add admin to organization
		await db.insert(schema.organizationMember).values({
			id: nanoid(),
			organizationId: organizationId,
			userId: adminUserId,
			role: "amministratore",
			createdAt: new Date(),
			updatedAt: new Date(),
		});
		console.log(`✅ Added ${adminName} as administrator to ${organizationName}`);

		console.log("\n🎉 Organization created successfully!");
		console.log(`Organization ID: ${organizationId}`);
		console.log(`Admin User ID: ${adminUserId}`);
	} catch (error) {
		console.error("❌ Error creating organization:", error);
		throw error;
	}
}

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
});

function askQuestion(query: string, defaultValue?: string): Promise<string> {
	const fullQuery = defaultValue ? `${query} [${defaultValue}]: ` : `${query}: `;
	return new Promise((resolve) =>
		rl.question(fullQuery, (answer) => {
			const value = answer.trim();
			resolve(value || defaultValue || "");
		}),
	);
}

// Main execution
async function main() {
	let options: CreateOrgOptions;

	if (process.argv[2]) {
		options = {
			organizationName: process.argv[2],
			adminName: process.argv[3],
			adminEmail: process.argv[4],
			adminPhone: process.argv[5],
			adminBirthDate: process.argv[6],
		};
		if (!options.adminName || !options.adminEmail || !options.adminPhone) {
			console.error(
				"❌ Usage: bun run create-organization.ts <org-name> <admin-name> <admin-email> <admin-phone> [admin-birth-date]",
			);
			process.exit(1);
		}
	} else {
		console.log("🚀 Let's set up a new organization interactively.");
		const organizationName = await askQuestion(
			"Enter organization name",
			"Parrocchia San Giuseppe",
		);
		const adminName = await askQuestion(
			"Enter admin's full name",
			"Don Marco Rossi",
		);
		const adminEmail = await askQuestion(
			"Enter admin's email",
			"don.marco@parrocchiasangiuseppe.it",
		);
		const adminPhone = await askQuestion(
			"Enter admin's phone number",
			"+39 347 9876543",
		);
		const adminBirthDate = await askQuestion(
			"Enter admin's birth date (YYYY-MM-DD, optional)",
			"1978-08-20",
		);

		options = {
			organizationName,
			adminName,
			adminEmail,
			adminPhone,
			adminBirthDate,
		};
		rl.close();
	}

	await createOrganization(options);
}

// Run the script
if (require.main === module) {
	main()
		.then(() => {
			process.exit(0);
		})
		.catch((error) => {
			console.error("Script failed:", error);
			rl.close();
			process.exit(1);
		});
}

export { createOrganization };