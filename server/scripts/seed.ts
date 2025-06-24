import { nanoid } from "nanoid";
import { db } from "../src/db";
import * as schema from "../src/db/schema";

// Helper function to generate realistic Italian names
const italianFirstNames = [
	"Alessandro",
	"Marco",
	"Andrea",
	"Luca",
	"Matteo",
	"Francesco",
	"Lorenzo",
	"Davide",
	"Giuseppe",
	"Roberto",
	"Francesca",
	"Giulia",
	"Chiara",
	"Sara",
	"Anna",
	"Martina",
	"Elena",
	"Valentina",
	"Alessia",
	"Sofia",
];

const italianLastNames = [
	"Rossi",
	"Russo",
	"Ferrari",
	"Esposito",
	"Bianchi",
	"Romano",
	"Colombo",
	"Ricci",
	"Marino",
	"Greco",
	"Bruno",
	"Gallo",
	"Conti",
	"De Luca",
	"Mancini",
	"Costa",
	"Giordano",
	"Rizzo",
	"Lombardi",
	"Moretti",
];

const relationships = [
	"Nonno",
	"Nonna",
	"Zio",
	"Zia",
	"Padrino",
	"Madrina",
	"Amico di famiglia",
	"Babysitter",
];

const allergies = [
	"Nessuna allergia nota",
	"Allergia alle arachidi",
	"Allergia al lattosio",
	"Allergia ai frutti di mare",
	"Allergia agli acari",
	"Allergia al polline",
];

const eventTitles = [
	"Campo Estivo San Giuseppe",
	"Ritiro Spirituale Adolescenti",
	"Corso di Preparazione Cresima",
	"Attività Ricreative Domenicali",
	"Campo Invernale",
	"Laboratorio di Arte Sacra",
	"Corso di Catechismo",
	"Gita Pellegrinaggio Assisi",
	"Torneo di Calcetto Parrocchiale",
	"Corso di Chitarra Gospel",
];

const locations = [
	"Centro Parrocchiale San Marco",
	"Oratorio Don Bosco",
	"Aula Magna Parrocchia",
	"Campo Sportivo Comunale",
	"Sala Multimediale",
	"Giardino della Parrocchia",
	"Auditorium San Paolo",
	"Centro Giovani",
	"Salone delle Feste",
	"Cortile dell'Oratorio",
];

// Helper functions
function randomChoice<T>(arr: T[]): T {
	return arr[Math.floor(Math.random() * arr.length)];
}

function randomDate(start: Date, end: Date): Date {
	return new Date(
		start.getTime() + Math.random() * (end.getTime() - start.getTime()),
	);
}

function randomBirthDate(minAge: number, maxAge: number): string {
	const now = new Date();
	const minDate = new Date(
		now.getFullYear() - maxAge,
		now.getMonth(),
		now.getDate(),
	);
	const maxDate = new Date(
		now.getFullYear() - minAge,
		now.getMonth(),
		now.getDate(),
	);
	return randomDate(minDate, maxDate).toISOString().split("T")[0];
}

function randomEmail(firstName: string, lastName: string): string {
	const domains = [
		"gmail.com",
		"libero.it",
		"virgilio.it",
		"yahoo.it",
		"hotmail.it",
	];
	return `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${randomChoice(domains)}`;
}

function randomPhone(): string {
	return `+39 ${Math.floor(Math.random() * 9) + 3}${Math.floor(Math.random() * 90000000) + 10000000}`;
}

async function seedDatabase() {
	console.log("🌱 Starting database seeding...");

	try {
		// 1. Create Organization
		console.log("Creating organization...");
		const organizationId = nanoid();
		const ownerId = nanoid();

		// Create owner user first
		await db.insert(schema.user).values({
			id: ownerId,
			name: "Don Paolo Benedetti",
			email: "don.paolo@parrocchiasanmarco.it",
			emailVerified: true,
			phoneNumber: "+39 347 1234567",
			phoneNumberVerified: true,
			birthDate: "1975-03-15",
			createdAt: new Date(),
			updatedAt: new Date(),
		});

		await db.insert(schema.organization).values({
			id: organizationId,
			name: "Parrocchia San Marco",
			ownerId: ownerId,
			createdAt: new Date(),
			updatedAt: new Date(),
		});

		// 2. Create Users (Parents)
		console.log("Creating users...");
		const userIds: string[] = [];
		for (let i = 0; i < 15; i++) {
			const firstName = randomChoice(italianFirstNames);
			const lastName = randomChoice(italianLastNames);
			const userId = nanoid();
			userIds.push(userId);

			await db.insert(schema.user).values({
				id: userId,
				name: `${firstName} ${lastName}`,
				email: randomEmail(firstName, lastName),
				emailVerified: Math.random() > 0.2,
				phoneNumber: randomPhone(),
				phoneNumberVerified: Math.random() > 0.3,
				birthDate: randomBirthDate(25, 50),
				createdAt: new Date(),
				updatedAt: new Date(),
			});

			// Add users to organization
			await db.insert(schema.organizationMember).values({
				id: nanoid(),
				organizationId: organizationId,
				userId: userId,
				role: i < 2 ? "amministratore" : i < 5 ? "editor" : "user",
				createdAt: new Date(),
				updatedAt: new Date(),
			});
		}

		// 3. Create Families
		console.log("Creating families...");
		const familyIds: string[] = [];
		for (let i = 0; i < 8; i++) {
			const familyId = nanoid();
			familyIds.push(familyId);
			const creatorId = userIds[i];

			await db.insert(schema.families).values({
				id: familyId,
				name: `Famiglia ${randomChoice(italianLastNames)}`,
				description: `Una famiglia della parrocchia di San Marco`,
				createdBy: creatorId,
				createdAt: new Date(),
				updatedAt: new Date(),
			});

			// Add family creator as admin member
			await db.insert(schema.familyMembers).values({
				id: nanoid(),
				familyId: familyId,
				userId: creatorId,
				role: "parent",
				isAdmin: true,
				joinedAt: new Date(),
				createdAt: new Date(),
				updatedAt: new Date(),
			});

			// Add 1-2 more family members randomly
			const extraMembers = Math.floor(Math.random() * 2) + 1;
			for (let j = 0; j < extraMembers && i + j + 8 < userIds.length; j++) {
				await db.insert(schema.familyMembers).values({
					id: nanoid(),
					familyId: familyId,
					userId: userIds[i + j + 8],
					role: Math.random() > 0.7 ? "guardian" : "parent",
					isAdmin: false,
					joinedAt: new Date(),
					createdAt: new Date(),
					updatedAt: new Date(),
				});
			}
		}

		// 4. Create Children
		console.log("Creating children...");
		const childIds: string[] = [];
		for (const familyId of familyIds) {
			const numChildren = Math.floor(Math.random() * 3) + 1; // 1-3 children per family

			for (let i = 0; i < numChildren; i++) {
				const firstName = randomChoice(italianFirstNames);
				const lastName = randomChoice(italianLastNames);
				const childId = nanoid();
				childIds.push(childId);

				await db.insert(schema.children).values({
					id: childId,
					familyId: familyId,
					firstName: firstName,
					lastName: lastName,
					birthDate: randomBirthDate(3, 17),
					birthPlace: randomChoice([
						"Roma",
						"Milano",
						"Napoli",
						"Torino",
						"Firenze",
					]),
					fiscalCode: `${firstName.substring(0, 3).toUpperCase()}${lastName.substring(0, 3).toUpperCase()}${Math.floor(Math.random() * 90) + 10}A${Math.floor(Math.random() * 90) + 10}B${Math.floor(Math.random() * 900) + 100}X`,
					gender: randomChoice(["M", "F"]),
					allergies: randomChoice(allergies),
					medicalNotes: Math.random() > 0.7 ? "Nessuna nota particolare" : null,
					createdAt: new Date(),
					updatedAt: new Date(),
				});
			}
		}

		// 5. Create Authorized Persons
		console.log("Creating authorized persons...");
		for (const familyId of familyIds) {
			const numAuthorized = Math.floor(Math.random() * 3) + 1; // 1-3 authorized persons per family

			for (let i = 0; i < numAuthorized; i++) {
				const firstName = randomChoice(italianFirstNames);
				const lastName = randomChoice(italianLastNames);

				await db.insert(schema.authorizedPersons).values({
					id: nanoid(),
					familyId: familyId,
					fullName: `${firstName} ${lastName}`,
					relationship: randomChoice(relationships),
					phone: randomPhone(),
					email: Math.random() > 0.3 ? randomEmail(firstName, lastName) : null,
					documentType: randomChoice([
						"Carta d'Identità",
						"Patente di Guida",
						"Passaporto",
					]),
					documentNumber: `${Math.random().toString(36).substring(2, 8).toUpperCase()}${Math.floor(Math.random() * 9000) + 1000}`,
					documentExpiry: randomDate(
						new Date(),
						new Date(Date.now() + 5 * 365 * 24 * 60 * 60 * 1000),
					)
						.toISOString()
						.split("T")[0],
					isActive: Math.random() > 0.1,
					createdAt: new Date(),
					updatedAt: new Date(),
				});
			}
		}

		// 6. Create Events
		console.log("Creating events...");
		const eventIds: string[] = [];
		for (let i = 0; i < 10; i++) {
			const eventId = nanoid();
			eventIds.push(eventId);
			const startDate = randomDate(
				new Date(),
				new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000),
			); // Next 6 months
			const endDate = new Date(
				startDate.getTime() +
					(Math.floor(Math.random() * 7) + 1) * 24 * 60 * 60 * 1000,
			); // 1-7 days later

			const minAge = Math.floor(Math.random() * 12) + 3; // 3-14
			const maxAge = minAge + Math.floor(Math.random() * 8) + 2; // minAge + 2-9
			const maxParticipants = (Math.floor(Math.random() * 4) + 2) * 5; // 10, 15, 20, 25

			await db.insert(schema.events).values({
				id: eventId,
				title: eventTitles[i],
				description: `Un'attività formativa e ricreativa per i giovani della parrocchia. ${eventTitles[i]} è pensato per offrire momenti di crescita spirituale e sociale.`,
				startDate: startDate,
				endDate: endDate,
				location: randomChoice(locations),
				minAge: minAge,
				maxAge: maxAge,
				maxParticipants: maxParticipants,
				currentParticipants: 0,
				price:
					Math.random() > 0.3
						? `${(Math.floor(Math.random() * 8) + 1) * 5}.00`
						: "0.00",
				status: randomChoice(["open", "open", "open", "draft", "closed"]), // Mostly open
				createdBy: randomChoice(userIds.slice(0, 5)), // Created by editors/admins
				createdAt: new Date(),
				updatedAt: new Date(),
			});
		}

		// 7. Create Event Registrations
		console.log("Creating event registrations...");
		let totalRegistrations = 0;

		for (const eventId of eventIds) {
			const numRegistrations =
				Math.floor(Math.random() * Math.min(childIds.length, 15)) + 3; // 3-15 registrations per event
			const shuffledChildren = [...childIds].sort(() => Math.random() - 0.5);

			for (let i = 0; i < numRegistrations; i++) {
				const childId = shuffledChildren[i];
				const registrationId = nanoid();

				// Find the family of this child to get a parent
				const familyMember = await db.query.familyMembers.findFirst({
					where: (familyMembers, { eq }) =>
						eq(
							familyMembers.userId,
							userIds[Math.floor(Math.random() * userIds.length)],
						),
				});

				const parentId = familyMember?.userId || userIds[0];

				await db.insert(schema.eventRegistrations).values({
					id: registrationId,
					eventId: eventId,
					childId: childId,
					parentId: parentId,
					status: randomChoice([
						"confirmed",
						"confirmed",
						"confirmed",
						"pending",
						"waitlist",
					]), // Mostly confirmed
					paymentStatus: randomChoice([
						"completed",
						"completed",
						"pending",
						"failed",
					]), // Mostly completed
					registrationDate: randomDate(
						new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
						new Date(),
					),
					notes: Math.random() > 0.7 ? "Iscrizione regolare" : null,
					createdAt: new Date(),
					updatedAt: new Date(),
				});

				totalRegistrations++;
			}

			// Update event participant count
			await db
				.update(schema.events)
				.set({ currentParticipants: numRegistrations })
				.where(eq(schema.events.id, eventId));
		}

		// 8. Create Family Invitations
		console.log("Creating family invitations...");
		for (let i = 0; i < 5; i++) {
			await db.insert(schema.invitations).values({
				id: nanoid(),
				familyId: randomChoice(familyIds),
				email: `invitato${i + 1}@example.com`,
				invitedBy: randomChoice(userIds),
				message: "Ti invitiamo a unirti alla nostra famiglia nella parrocchia!",
				status: randomChoice(["pending", "pending", "accepted", "rejected"]),
				token: nanoid(),
				expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
				createdAt: new Date(),
				updatedAt: new Date(),
			});
		}

		console.log("✅ Database seeding completed successfully!");
		console.log(`📊 Created:`);
		console.log(`   • 1 Organization`);
		console.log(`   • ${userIds.length + 1} Users`);
		console.log(`   • ${familyIds.length} Families`);
		console.log(`   • ${childIds.length} Children`);
		console.log(`   • ${eventIds.length} Events`);
		console.log(`   • ${totalRegistrations} Event Registrations`);
		console.log(`   • 5 Family Invitations`);
	} catch (error) {
		console.error("❌ Error seeding database:", error);
		throw error;
	}
}

// Import eq function for update query
import { eq } from "drizzle-orm";

// Run the seeding
seedDatabase()
	.then(() => {
		console.log("🎉 Seeding process finished!");
		process.exit(0);
	})
	.catch((err) => {
		console.error("💥 Seeding failed:", err);
		process.exit(1);
	});
