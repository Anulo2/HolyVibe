import { db } from "../src/db";
import * as schema from "../src/db/schema";

async function resetDatabase() {
	console.log("🗑️  Clearing database...");

	try {
		// Delete in order to respect foreign key constraints
		await db.delete(schema.registrationAuthorizedPersons);
		await db.delete(schema.eventRegistrations);
		await db.delete(schema.events);
		await db.delete(schema.invitations);
		await db.delete(schema.authorizedPersons);
		await db.delete(schema.children);
		await db.delete(schema.familyMembers);
		await db.delete(schema.families);
		await db.delete(schema.organizationMember);
		await db.delete(schema.invitation);
		await db.delete(schema.organization);
		await db.delete(schema.verification);
		await db.delete(schema.account);
		await db.delete(schema.session);
		await db.delete(schema.user);
		await db.delete(schema.todos);

		console.log("✅ Database cleared successfully!");

		// Import and run the seed script
		console.log("🌱 Starting seeding process...");
		const { spawn } = await import("child_process");

		const seedProcess = spawn("bun", ["run", "scripts/seed.ts"], {
			stdio: "inherit",
			cwd: process.cwd(),
		});

		seedProcess.on("close", (code) => {
			if (code === 0) {
				console.log("🎉 Reset and seed completed successfully!");
				process.exit(0);
			} else {
				console.error("💥 Seeding process failed!");
				process.exit(1);
			}
		});
	} catch (error) {
		console.error("❌ Error resetting database:", error);
		process.exit(1);
	}
}

resetDatabase();
