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

## Development Notes

- The seed script uses realistic Italian naming conventions
- All timestamps are properly formatted for SQLite
- Foreign key relationships are properly maintained
- Sample data includes edge cases (draft events, pending payments, etc.)
- The script is idempotent when adding to existing data
- Uses nanoid for unique identifiers matching the schema 