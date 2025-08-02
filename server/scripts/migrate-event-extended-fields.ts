import { db } from "../src/db";
import { sql } from "drizzle-orm";

async function migrateEventExtendedFields() {
  console.log("Starting migration: Adding extended fields to events table...");

  try {
    // Add extended information fields to events table
    await db.run(sql`
      ALTER TABLE events ADD COLUMN detailed_description TEXT;
    `);

    await db.run(sql`
      ALTER TABLE events ADD COLUMN program TEXT;
    `);

    await db.run(sql`
      ALTER TABLE events ADD COLUMN requirements TEXT;
    `);

    await db.run(sql`
      ALTER TABLE events ADD COLUMN what_to_bring TEXT;
    `);

    await db.run(sql`
      ALTER TABLE events ADD COLUMN parent_notes TEXT;
    `);

    await db.run(sql`
      ALTER TABLE events ADD COLUMN emergency_contacts TEXT;
    `);

    await db.run(sql`
      ALTER TABLE events ADD COLUMN meeting_point TEXT;
    `);

    await db.run(sql`
      ALTER TABLE events ADD COLUMN drop_off_time TEXT;
    `);

    await db.run(sql`
      ALTER TABLE events ADD COLUMN pick_up_time TEXT;
    `);

    await db.run(sql`
      ALTER TABLE events ADD COLUMN includes_lunch INTEGER DEFAULT 0;
    `);

    await db.run(sql`
      ALTER TABLE events ADD COLUMN includes_snack INTEGER DEFAULT 0;
    `);

    await db.run(sql`
      ALTER TABLE events ADD COLUMN transport_provided INTEGER DEFAULT 0;
    `);

    await db.run(sql`
      ALTER TABLE events ADD COLUMN weather_dependent INTEGER DEFAULT 0;
    `);

    await db.run(sql`
      ALTER TABLE events ADD COLUMN special_notes TEXT;
    `);

    await db.run(sql`
      ALTER TABLE events ADD COLUMN cancellation_policy TEXT;
    `);

    await db.run(sql`
      ALTER TABLE events ADD COLUMN photography_consent INTEGER DEFAULT 1;
    `);

    await db.run(sql`
      ALTER TABLE events ADD COLUMN additional_images TEXT;
    `);

    console.log("✅ Migration completed successfully!");
    console.log("Added the following fields to events table:");
    console.log("- detailed_description (TEXT)");
    console.log("- program (TEXT)");
    console.log("- requirements (TEXT)");
    console.log("- what_to_bring (TEXT)");
    console.log("- parent_notes (TEXT)");
    console.log("- emergency_contacts (TEXT)");
    console.log("- meeting_point (TEXT)");
    console.log("- drop_off_time (TEXT)");
    console.log("- pick_up_time (TEXT)");
    console.log("- includes_lunch (INTEGER, default 0)");
    console.log("- includes_snack (INTEGER, default 0)");
    console.log("- transport_provided (INTEGER, default 0)");
    console.log("- weather_dependent (INTEGER, default 0)");
    console.log("- special_notes (TEXT)");
    console.log("- cancellation_policy (TEXT)");
    console.log("- photography_consent (INTEGER, default 1)");
    console.log("- additional_images (TEXT)");

  } catch (error) {
    console.error("❌ Migration failed:", error);

    // Check if the error is about column already existing
    if (error instanceof Error && error.message.includes("duplicate column name")) {
      console.log("🔄 Some columns may already exist. This is normal if migration was run before.");
      console.log("✅ Migration completed with warnings.");
    } else {
      throw error;
    }
  }
}

// Run migration if this file is executed directly
if (import.meta.main) {
  migrateEventExtendedFields()
    .then(() => {
      console.log("🎉 Event extended fields migration completed!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Migration failed:", error);
      process.exit(1);
    });
}

export { migrateEventExtendedFields };
