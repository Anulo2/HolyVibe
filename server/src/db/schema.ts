import { sql } from "drizzle-orm";
import { integer, sqliteTable, text, blob } from "drizzle-orm/sqlite-core";

// Better Auth core tables
export const user = sqliteTable("user", {
	id: text("id").primaryKey(),
	name: text("name"),
	email: text("email").notNull().unique(),
	emailVerified: integer("email_verified", { mode: "boolean" }).notNull().default(false),
	image: text("image"),
	phoneNumber: text("phone_number"),
	phoneNumberVerified: integer("phone_number_verified", { mode: "boolean" }).default(false),
	birthDate: text("birth_date"),
	createdAt: integer("created_at", { mode: "timestamp" })
		.default(sql`(strftime('%s', 'now'))`)
		.notNull(),
	updatedAt: integer("updated_at", { mode: "timestamp" })
		.default(sql`(strftime('%s', 'now'))`)
		.notNull(),
});

export const session = sqliteTable("session", {
	id: text("id").primaryKey(),
	token: text("token").notNull().unique(),
	expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	createdAt: integer("created_at", { mode: "timestamp" })
		.default(sql`(strftime('%s', 'now'))`)
		.notNull(),
	updatedAt: integer("updated_at", { mode: "timestamp" })
		.default(sql`(strftime('%s', 'now'))`)
		.notNull(),
});

export const account = sqliteTable("account", {
	id: text("id").primaryKey(),
	accountId: text("account_id").notNull(),
	providerId: text("provider_id").notNull(),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	accessToken: text("access_token"),
	refreshToken: text("refresh_token"),
	idToken: text("id_token"),
	expiresAt: integer("expires_at", { mode: "timestamp" }),
	password: text("password"),
	createdAt: integer("created_at", { mode: "timestamp" })
		.default(sql`(strftime('%s', 'now'))`)
		.notNull(),
	updatedAt: integer("updated_at", { mode: "timestamp" })
		.default(sql`(strftime('%s', 'now'))`)
		.notNull(),
});

export const verification = sqliteTable("verification", {
	id: text("id").primaryKey(),
	identifier: text("identifier").notNull(),
	value: text("value").notNull(),
	expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
	createdAt: integer("created_at", { mode: "timestamp" })
		.default(sql`(strftime('%s', 'now'))`)
		.notNull(),
	updatedAt: integer("updated_at", { mode: "timestamp" })
		.default(sql`(strftime('%s', 'now'))`)
		.notNull(),
});

// Better Auth Organization Tables
export const organization = sqliteTable("organization", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	image: text("image"),
	ownerId: text("owner_id").notNull(),
	createdAt: integer("created_at", { mode: "timestamp" })
		.default(sql`(strftime('%s', 'now'))`)
		.notNull(),
	updatedAt: integer("updated_at", { mode: "timestamp" })
		.default(sql`(strftime('%s', 'now'))`)
		.notNull(),
});

export const organizationMember = sqliteTable("organization_member", {
	id: text("id").primaryKey(),
	organizationId: text("organization_id")
		.notNull()
		.references(() => organization.id, { onDelete: "cascade" }),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	role: text("role").notNull(),
	createdAt: integer("created_at", { mode: "timestamp" })
		.default(sql`(strftime('%s', 'now'))`)
		.notNull(),
	updatedAt: integer("updated_at", { mode: "timestamp" })
		.default(sql`(strftime('%s', 'now'))`)
		.notNull(),
});

export const invitation = sqliteTable("invitation", {
	id: text("id").primaryKey(),
	email: text("email").notNull(),
	token: text("token").notNull().unique(),
	expires: integer("expires", { mode: "timestamp" }).notNull(),
	organizationId: text("organization_id")
		.notNull()
		.references(() => organization.id, { onDelete: "cascade" }),
	inviterId: text("inviter_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	createdAt: integer("created_at", { mode: "timestamp" })
		.default(sql`(strftime('%s', 'now'))`)
		.notNull(),
	updatedAt: integer("updated_at", { mode: "timestamp" })
		.default(sql`(strftime('%s', 'now'))`)
		.notNull(),
});

// Family Management Tables
export const families = sqliteTable("families", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	description: text("description"),
	createdBy: text("created_by")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	createdAt: integer("created_at", { mode: "timestamp" })
		.default(sql`(strftime('%s', 'now'))`)
		.notNull(),
	updatedAt: integer("updated_at", { mode: "timestamp" })
		.default(sql`(strftime('%s', 'now'))`)
		.notNull(),
});

export const familyMembers = sqliteTable("family_members", {
	id: text("id").primaryKey(),
	familyId: text("family_id")
		.notNull()
		.references(() => families.id, { onDelete: "cascade" }),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	role: text("role", { enum: ["parent", "guardian"] }).notNull().default("parent"),
	isAdmin: integer("is_admin", { mode: "boolean" }).notNull().default(false),
	joinedAt: integer("joined_at", { mode: "timestamp" })
		.default(sql`(strftime('%s', 'now'))`)
		.notNull(),
	createdAt: integer("created_at", { mode: "timestamp" })
		.default(sql`(strftime('%s', 'now'))`)
		.notNull(),
	updatedAt: integer("updated_at", { mode: "timestamp" })
		.default(sql`(strftime('%s', 'now'))`)
		.notNull(),
});

export const children = sqliteTable("children", {
	id: text("id").primaryKey(),
	familyId: text("family_id")
		.notNull()
		.references(() => families.id, { onDelete: "cascade" }),
	firstName: text("first_name").notNull(),
	lastName: text("last_name").notNull(),
	birthDate: text("birth_date").notNull(), // ISO date string
	birthPlace: text("birth_place"),
	fiscalCode: text("fiscal_code"),
	gender: text("gender", { enum: ["M", "F", "O"] }),
	allergies: text("allergies"),
	medicalNotes: text("medical_notes"),
	avatarUrl: text("avatar_url"),
	createdAt: integer("created_at", { mode: "timestamp" })
		.default(sql`(strftime('%s', 'now'))`)
		.notNull(),
	updatedAt: integer("updated_at", { mode: "timestamp" })
		.default(sql`(strftime('%s', 'now'))`)
		.notNull(),
});

export const authorizedPersons = sqliteTable("authorized_persons", {
	id: text("id").primaryKey(),
	familyId: text("family_id")
		.notNull()
		.references(() => families.id, { onDelete: "cascade" }),
	fullName: text("full_name").notNull(),
	relationship: text("relationship").notNull(),
	phone: text("phone"),
	email: text("email"),
	avatarUrl: text("avatar_url"),
	documentType: text("document_type"),
	documentNumber: text("document_number"),
	documentExpiry: text("document_expiry"), // ISO date string
	isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
	createdAt: integer("created_at", { mode: "timestamp" })
		.default(sql`(strftime('%s', 'now'))`)
		.notNull(),
	updatedAt: integer("updated_at", { mode: "timestamp" })
		.default(sql`(strftime('%s', 'now'))`)
		.notNull(),
});

export const events = sqliteTable("events", {
	id: text("id").primaryKey(),
	title: text("title").notNull(),
	description: text("description").notNull(),
	startDate: integer("start_date", { mode: "timestamp" }).notNull(),
	endDate: integer("end_date", { mode: "timestamp" }),
	location: text("location").notNull(),
	minAge: integer("min_age").notNull(),
	maxAge: integer("max_age").notNull(),
	maxParticipants: integer("max_participants").notNull(),
	currentParticipants: integer("current_participants").notNull().default(0),
	price: text("price"), // Store as string to handle decimal precision
	status: text("status", { 
		enum: ["draft", "open", "closed", "full", "cancelled"] 
	}).notNull().default("draft"),
	imageUrl: text("image_url"),
	createdBy: text("created_by")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	createdAt: integer("created_at", { mode: "timestamp" })
		.default(sql`(strftime('%s', 'now'))`)
		.notNull(),
	updatedAt: integer("updated_at", { mode: "timestamp" })
		.default(sql`(strftime('%s', 'now'))`)
		.notNull(),
});

export const eventRegistrations = sqliteTable("event_registrations", {
	id: text("id").primaryKey(),
	eventId: text("event_id")
		.notNull()
		.references(() => events.id, { onDelete: "cascade" }),
	childId: text("child_id")
		.notNull()
		.references(() => children.id, { onDelete: "cascade" }),
	parentId: text("parent_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	status: text("status", { 
		enum: ["pending", "confirmed", "cancelled", "waitlist"] 
	}).notNull().default("pending"),
	paymentStatus: text("payment_status", { 
		enum: ["pending", "completed", "failed", "refunded"] 
	}).notNull().default("pending"),
	registrationDate: integer("registration_date", { mode: "timestamp" })
		.default(sql`(strftime('%s', 'now'))`)
		.notNull(),
	notes: text("notes"),
	createdAt: integer("created_at", { mode: "timestamp" })
		.default(sql`(strftime('%s', 'now'))`)
		.notNull(),
	updatedAt: integer("updated_at", { mode: "timestamp" })
		.default(sql`(strftime('%s', 'now'))`)
		.notNull(),
});

export const registrationAuthorizedPersons = sqliteTable("registration_authorized_persons", {
	id: text("id").primaryKey(),
	registrationId: text("registration_id")
		.notNull()
		.references(() => eventRegistrations.id, { onDelete: "cascade" }),
	authorizedPersonId: text("authorized_person_id")
		.notNull()
		.references(() => authorizedPersons.id, { onDelete: "cascade" }),
	createdAt: integer("created_at", { mode: "timestamp" })
		.default(sql`(strftime('%s', 'now'))`)
		.notNull(),
});

export const invitations = sqliteTable("invitations", {
	id: text("id").primaryKey(),
	familyId: text("family_id")
		.notNull()
		.references(() => families.id, { onDelete: "cascade" }),
	email: text("email").notNull(),
	invitedBy: text("invited_by")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	message: text("message"),
	status: text("status", { 
		enum: ["pending", "accepted", "rejected", "expired"] 
	}).notNull().default("pending"),
	token: text("token").notNull().unique(),
	expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
	acceptedAt: integer("accepted_at", { mode: "timestamp" }),
	createdAt: integer("created_at", { mode: "timestamp" })
		.default(sql`(strftime('%s', 'now'))`)
		.notNull(),
	updatedAt: integer("updated_at", { mode: "timestamp" })
		.default(sql`(strftime('%s', 'now'))`)
		.notNull(),
});

// Legacy todos table (can be removed later)
export const todos = sqliteTable("todos", {
	id: text("id").primaryKey(),
	title: text("title").notNull(),
	completed: integer("completed", { mode: "boolean" }).notNull().default(false),
	createdAt: integer("created_at", { mode: "number" })
		.default(sql`(strftime('%s', 'now'))`)
		.notNull(),
	updatedAt: integer("updated_at", { mode: "number" })
		.default(sql`(strftime('%s', 'now'))`)
		.notNull(),
});
