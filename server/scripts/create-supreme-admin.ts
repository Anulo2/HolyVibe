import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import * as readline from "readline";
import { db } from "../src/db";
import * as schema from "../src/db/schema";
import { auth } from "../src/auth";

interface CreateSupremeAdminOptions {
  name: string;
  email: string;
  phone: string;
  birthDate?: string;
}

async function createSupremeAdmin(options: CreateSupremeAdminOptions) {
  const { name, email, phone, birthDate } = options;

  console.log(`👑 Creating supreme admin: ${name} (${email})`);

  try {
    // Check if user already exists
    const existingUser = await db
      .select()
      .from(schema.user)
      .where(eq(schema.user.email, email))
      .limit(1);

    let adminUserId: string;

    if (existingUser.length > 0) {
      adminUserId = existingUser[0].id;
      console.log(`👤 Using existing user: ${name}`);

      // Update user role to admin if not already
      await db
        .update(schema.user)
        .set({
          role: "admin",
          updatedAt: new Date(),
        })
        .where(eq(schema.user.id, adminUserId));
    } else {
      // Create supreme admin user
      adminUserId = nanoid();
      await db.insert(schema.user).values({
        id: adminUserId,
        name: name,
        email: email,
        emailVerified: true,
        phoneNumber: phone,
        phoneNumberVerified: true,
        birthDate: birthDate || null,
        role: "admin", // Set admin role using admin plugin
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      console.log(`✅ Created supreme admin user: ${name}`);
    }

    // Get all existing organizations
    const allOrganizations = await db.select().from(schema.organization);

    if (allOrganizations.length === 0) {
      console.log(
        "⚠️  No organizations found. Create some organizations first.",
      );
      return;
    }

    console.log(`🔍 Found ${allOrganizations.length} organizations`);

    // Check existing memberships to avoid duplicates
    const existingMemberships = await db
      .select()
      .from(schema.organizationMember)
      .where(eq(schema.organizationMember.userId, adminUserId));

    const existingOrgIds = new Set(
      existingMemberships.map((m) => m.organizationId),
    );

    // Add supreme admin to all organizations
    let addedCount = 0;
    for (const org of allOrganizations) {
      if (!existingOrgIds.has(org.id)) {
        await db.insert(schema.organizationMember).values({
          id: nanoid(),
          organizationId: org.id,
          userId: adminUserId,
          role: "amministratore",
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        console.log(`✅ Added to organization: ${org.name}`);
        addedCount++;
      } else {
        console.log(`⏭️  Already member of: ${org.name}`);
      }
    }

    console.log(`\n🎉 Supreme admin created successfully!`);
    console.log(`User ID: ${adminUserId}`);
    console.log(`Total organizations: ${allOrganizations.length}`);
    console.log(`Added to ${addedCount} new organizations`);
    console.log(
      `Already member of ${allOrganizations.length - addedCount} organizations`,
    );
  } catch (error) {
    console.error("❌ Error creating supreme admin:", error);
    throw error;
  }
}

// Function to promote existing user to Supreme Admin
async function promoteUserToSupremeAdmin(userEmail: string) {
  console.log(`🔍 Looking for user: ${userEmail}`);

  try {
    // Find user by email
    const user = await db
      .select()
      .from(schema.user)
      .where(eq(schema.user.email, userEmail))
      .limit(1);

    if (user.length === 0) {
      console.log(`❌ User not found: ${userEmail}`);
      return;
    }

    const userId = user[0].id;
    console.log(`👤 Found user: ${user[0].name} (${user[0].email})`);

    // Update user role to admin
    await db
      .update(schema.user)
      .set({
        role: "admin",
        updatedAt: new Date(),
      })
      .where(eq(schema.user.id, userId));

    console.log(`👑 Promoted user to Supreme Admin role`);

    // Get all organizations
    const allOrganizations = await db.select().from(schema.organization);

    // Get existing memberships
    const existingMemberships = await db
      .select()
      .from(schema.organizationMember)
      .where(eq(schema.organizationMember.userId, userId));

    const existingOrgIds = new Set(
      existingMemberships.map((m) => m.organizationId),
    );

    // Add to all organizations
    let addedCount = 0;
    for (const org of allOrganizations) {
      if (!existingOrgIds.has(org.id)) {
        await db.insert(schema.organizationMember).values({
          id: nanoid(),
          organizationId: org.id,
          userId: userId,
          role: "amministratore",
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        console.log(`✅ Added to organization: ${org.name}`);
        addedCount++;
      } else {
        console.log(`⏭️  Already member of: ${org.name}`);
      }
    }

    console.log(`\n🎉 User promoted to Supreme Admin successfully!`);
    console.log(`Added to ${addedCount} new organizations`);
  } catch (error) {
    console.error("❌ Error promoting user to Supreme Admin:", error);
    throw error;
  }
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function askQuestion(query: string, defaultValue?: string): Promise<string> {
  const fullQuery = defaultValue
    ? `${query} [${defaultValue}]: `
    : `${query}: `;
  return new Promise((resolve) =>
    rl.question(fullQuery, (answer) => {
      const value = answer.trim();
      resolve(value || defaultValue || "");
    }),
  );
}

// Main execution
async function main() {
  const command = process.argv[2];

  if (command === "promote-existing") {
    const userEmail = await askQuestion(
      "Enter the email of the existing user to promote to Supreme Admin",
      process.argv[3],
    );
    if (!userEmail) {
      console.log("❌ Email is required.");
      rl.close();
      process.exit(1);
    }
    await promoteUserToSupremeAdmin(userEmail);
  } else {
    let options: CreateSupremeAdminOptions;
    if (process.argv[2]) {
      options = {
        name: process.argv[2],
        email: process.argv[3],
        phone: process.argv[4],
        birthDate: process.argv[5],
      };
      if (!options.email || !options.phone) {
        console.error(
          "❌ Usage: bun run create-supreme-admin.ts <name> <email> <phone> [birth-date]",
        );
        process.exit(1);
      }
    } else {
      console.log("🚀 Let's create a new supreme admin interactively.");
      const name = await askQuestion("Enter admin's full name", "Super Admin");
      const email = await askQuestion(
        "Enter admin's email",
        "admin@parrocchia.com",
      );
      const phone = await askQuestion(
        "Enter admin's phone number",
        "+39 320 0000000",
      );
      const birthDate = await askQuestion(
        "Enter admin's birth date (YYYY-MM-DD, optional)",
        "1980-01-01",
      );

      options = { name, email, phone, birthDate };
    }
    await createSupremeAdmin(options);
  }

  rl.close();
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

export { createSupremeAdmin, promoteUserToSupremeAdmin };
