# Database Scripts

This directory contains scripts for managing the database and sample data.

## Available Scripts

### Migration
```bash
bun run db:migrate
```
Runs database migrations to update the schema.

### Seeding
```bash
bun run db:seed
```
Populates the database with sample data including:
- 1 Organization (Parrocchia San Marco)
- 16 Users (1 priest + 15 parents with different roles)
- 8 Families with 1-3 members each
- 15+ Children (1-3 per family)
- Authorized persons for child pickup
- 10 Events with realistic Italian parish activities
- Event registrations linking children to events
- Family invitations

### Reset and Seed
```bash
bun run db:reset
```
Clears all existing data and runs the seed script. Useful for development when you want to start fresh.

### Organization Management
```bash
bun run create-org                    # Create new organization with default values
bun run create-org "My Church" "Pastor John" "john@church.com" "+39 123 456789"
```
Creates a new organization and adds an admin user to it.

### Supreme Admin Management
```bash
bun run create-supreme-admin          # Create supreme admin with default values
bun run create-supreme-admin "Super Admin" "admin@parrocchia.com" "+39 320 0000000"
bun run create-supreme-admin add-existing "existing@email.com"
```
Creates a supreme admin user that has administrator access to all organizations.

### Other Database Operations
```bash
bun run db:studio    # Open Drizzle Studio for database inspection
bun run db:drop      # Drop all tables
bun run db:push      # Push schema changes without migrations
```

## Sample Data Details

### Organization
- **Parrocchia San Marco** - A sample parish with Don Paolo Benedetti as owner

### Users & Roles
- **Amministratore** (2 users): Full system access
- **Editor** (3 users): Event management capabilities  
- **User** (10 users): Basic family and child management

### Events
The seed script creates 10 realistic Italian parish events:
- Campo Estivo San Giuseppe
- Ritiro Spirituale Adolescenti
- Corso di Preparazione Cresima
- Attività Ricreative Domenicali
- Campo Invernale
- Laboratorio di Arte Sacra
- Corso di Catechismo
- Gita Pellegrinaggio Assisi
- Torneo di Calcetto Parrocchiale
- Corso di Chitarra Gospel

### Realistic Data Features
- Italian names and surnames
- Italian phone numbers (+39 format)
- Italian email domains (.it domains)
- Age-appropriate event filtering
- Proper fiscal codes for children
- Document types and numbers for authorized persons
- Various event statuses and payment states

## Usage Examples

1. **Initial Setup**: After cloning the repo and setting up the database
   ```bash
   bun run db:migrate
   bun run db:seed
   ```

2. **Development Reset**: When you want to start with fresh sample data
   ```bash
   bun run db:reset
   ```

3. **Add More Data**: If you want to add more sample data to existing database
   ```bash
   bun run db:seed
   ```

## Script Usage Details

### Create Organization Script
The `create-organization.ts` script allows you to create new organizations with an admin user:

**Parameters (all optional, will use defaults if not provided):**
1. Organization name (default: "Parrocchia San Giuseppe")
2. Admin name (default: "Don Marco Rossi")
3. Admin email (default: "don.marco@parrocchiasangiuseppe.it")
4. Admin phone (default: "+39 347 9876543")
5. Admin birth date (default: "1978-08-20")

**Features:**
- Checks for existing organizations and users to avoid duplicates
- Creates the admin user if they don't exist
- Automatically sets the admin as organization owner
- Adds the admin to the organization with "amministratore" role

### Create Supreme Admin Script
The `create-supreme-admin.ts` script has two modes:

**Mode 1: Create new supreme admin**
```bash
bun run create-supreme-admin [name] [email] [phone] [birthdate]
```
Creates a new user and adds them as administrator to ALL existing organizations.

**Mode 2: Add existing user to all organizations**
```bash
bun run create-supreme-admin add-existing <email>
```
Finds an existing user by email and adds them as administrator to all organizations.

**Features:**
- Automatically detects and adds to all existing organizations
- Avoids duplicate memberships
- Provides detailed logging of actions taken
- Handles the case where no organizations exist

## Development Notes

- The seed script uses realistic Italian naming conventions
- All timestamps are properly formatted for SQLite
- Foreign key relationships are properly maintained
- Sample data includes edge cases (draft events, pending payments, etc.)
- The script is idempotent when adding to existing data
- Uses nanoid for unique identifiers matching the schema
- Organization and supreme admin scripts include comprehensive error handling 