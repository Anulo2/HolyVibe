import { db } from "../src/db";
import { events } from "../src/db/schema";
import { nanoid } from "nanoid";

async function seedExtendedEvents() {
  console.log("🌱 Seeding extended events...");

  try {
    // Event 1: Campo Estivo Avventura - Completo
    const event1Id = nanoid();
    await db.insert(events).values({
      id: event1Id,
      title: "Campo Estivo Avventura",
      description: "Una settimana di avventure nella natura per ragazzi coraggiosi!",
      startDate: Math.floor(new Date("2024-07-15T09:00:00").getTime() / 1000),
      endDate: Math.floor(new Date("2024-07-21T16:00:00").getTime() / 1000),
      location: "Rifugio Monte Bianco, Val d'Aosta",
      minAge: 10,
      maxAge: 16,
      maxParticipants: 25,
      currentParticipants: 18,
      price: "180.00",
      status: "open",
      imageUrl: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800",
      // Extended fields
      detailedDescription: `
        <h3>Un'esperienza indimenticabile in montagna</h3>
        <p>Il Campo Estivo Avventura è progettato per far vivere ai ragazzi un'esperienza unica a contatto con la natura. Durante questa settimana i partecipanti avranno l'opportunità di:</p>
        <ul>
          <li>Imparare tecniche di orientamento e sopravvivenza</li>
          <li>Partecipare a escursioni guidate sui sentieri montani</li>
          <li>Costruire rifugi e accendere fuochi</li>
          <li>Conoscere la flora e fauna alpina</li>
          <li>Sviluppare lo spirito di squadra attraverso giochi e sfide</li>
        </ul>
        <p>Tutti i nostri educatori sono qualificati e hanno esperienza pluriennale nell'accompagnamento di gruppi giovanili in montagna.</p>
      `,
      program: `
        <h4>Programma Giornaliero</h4>
        <p><strong>Lunedì:</strong> Arrivo e sistemazione - Presentazione del gruppo - Giochi di conoscenza - Cena comunitaria</p>
        <p><strong>Martedì:</strong> Escursione al lago alpino - Pranzo al sacco - Laboratorio di riconoscimento piante</p>
        <p><strong>Mercoledì:</strong> Corso di orientamento - Costruzione rifugi - Serata sotto le stelle</p>
        <p><strong>Giovedì:</strong> Arrampicata su roccia (con istruttori qualificati) - Pranzo in rifugio - Giochi di squadra</p>
        <p><strong>Venerdì:</strong> Escursione fotografica - Laboratorio manuale - Preparazione spettacolo serale</p>
        <p><strong>Sabato:</strong> Grande gioco finale - Pranzo di saluto - Partenza</p>
      `,
      requirements: `Buona forma fisica per escursioni di media difficoltà
Capacità di adattamento alla vita comunitaria
Nessuna paura dell'altezza (attività di arrampicata)
Autorizzazione medica per attività sportive`,
      whatToBring: `Zaino da escursione (almeno 30L)
Scarponi da trekking (obbligatori)
Sacco a pelo (temperatura comfort 5°C)
Giacca antipioggia e pile
Biancheria intima e calze di ricambio
Crema solare alta protezione
Borraccia (almeno 1L)
Torcia frontale
Kit igiene personale`,
      parentNotes: `I ragazzi saranno sempre accompagnati da educatori qualificati durante tutte le attività.
Il rifugio dispone di acqua calda e servizi igienici adeguati.
Non è consentito portare dispositivi elettronici (smartphone, tablet).
Le attività potrebbero subire modifiche in base alle condizioni meteorologiche.
I genitori saranno contattati quotidianamente con aggiornamenti via WhatsApp.`,
      emergencyContacts: `Responsabile campo: Marco Rossi - 348.123.4567
Soccorso alpino: 118
Rifugio Monte Bianco: 0165.987.654
Medico di base: Dr. Luigi Bianchi - 347.765.4321`,
      meetingPoint: "Piazzale della Chiesa, ore 8:30",
      dropOffTime: "08:30",
      pickUpTime: "16:00",
      includesLunch: true,
      includesSnack: true,
      transportProvided: true,
      weatherDependent: true,
      specialNotes: `IMPORTANTE: Il campo si svolge in alta montagna, le temperature notturne possono scendere sotto i 5°C.
È necessario un abbigliamento adeguato.
In caso di maltempo persistente, alcune attività all'aperto potrebbero essere sostituite con laboratori al coperto.`,
      cancellationPolicy: `Cancellazione gratuita fino a 15 giorni prima della partenza.
Da 14 a 7 giorni: rimborso del 50%.
Meno di 7 giorni: nessun rimborso salvo gravi motivi di salute certificati.
In caso di annullamento da parte dell'organizzazione: rimborso completo.`,
      photographyConsent: true,
      additionalImages: JSON.stringify([
        "https://images.unsplash.com/photo-1464207687429-7505649dae38?w=600",
        "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600",
        "https://images.unsplash.com/photo-1551632811-561732d1e306?w=600"
      ]),
      createdBy: "admin_user_id",
      createdAt: Math.floor(Date.now() / 1000),
      updatedAt: Math.floor(Date.now() / 1000)
    });

    // Event 2: Laboratorio di Cucina per Bambini - Semplice
    const event2Id = nanoid();
    await db.insert(events).values({
      id: event2Id,
      title: "Piccoli Chef - Laboratorio di Cucina",
      description: "Un pomeriggio divertente per imparare a cucinare dolci semplici!",
      startDate: Math.floor(new Date("2024-06-20T14:30:00").getTime() / 1000),
      endDate: Math.floor(new Date("2024-06-20T17:30:00").getTime() / 1000),
      location: "Sala parrocchiale San Giuseppe",
      minAge: 6,
      maxAge: 12,
      maxParticipants: 15,
      currentParticipants: 8,
      price: "15.00",
      status: "open",
      imageUrl: "https://images.unsplash.com/photo-1556908153-1055164fe2df?w=800",
      // Extended fields con informazioni basilari
      detailedDescription: `
        <p>I bambini impareranno a preparare biscotti colorati e cupcakes semplici, seguiti da una chef esperta.</p>
        <p>Ogni bambino tornerà a casa con le proprie creazioni in una scatola personalizzata!</p>
      `,
      program: `
        <p><strong>14:30</strong> - Accoglienza e vestizione da chef</p>
        <p><strong>15:00</strong> - Preparazione impasto biscotti</p>
        <p><strong>15:45</strong> - Merenda</p>
        <p><strong>16:15</strong> - Decorazione cupcakes</p>
        <p><strong>17:00</strong> - Confezionamento dolci</p>
        <p><strong>17:30</strong> - Ritiro bambini</p>
      `,
      whatToBring: `Grembiule da cucina
Contenitore per portare a casa i dolci`,
      parentNotes: `I bambini lavoreranno con ingredienti comuni (farina, uova, burro, zucchero).
Segnalare eventuali allergie alimentari all'iscrizione.`,
      emergencyContacts: "Suor Maria - 345.678.9012",
      meetingPoint: "Ingresso principale della parrocchia",
      dropOffTime: "14:30",
      pickUpTime: "17:30",
      includesLunch: false,
      includesSnack: true,
      transportProvided: false,
      weatherDependent: false,
      photographyConsent: true,
      createdBy: "admin_user_id",
      createdAt: Math.floor(Date.now() / 1000),
      updatedAt: Math.floor(Date.now() / 1000)
    });

    // Event 3: Ritiro Spirituale Adolescenti - Completo con politiche
    const event3Id = nanoid();
    await db.insert(events).values({
      id: event3Id,
      title: "Ritiro Spirituale - Alla Ricerca di Sé",
      description: "Weekend di riflessione, preghiera e condivisione per adolescenti",
      startDate: Math.floor(new Date("2024-08-10T18:00:00").getTime() / 1000),
      endDate: Math.floor(new Date("2024-08-12T16:00:00").getTime() / 1000),
      location: "Casa di Spiritualità Madonna delle Rose",
      minAge: 14,
      maxAge: 18,
      maxParticipants: 20,
      currentParticipants: 12,
      price: "65.00",
      status: "open",
      imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800",
      detailedDescription: `
        <h3>Un weekend per fermarsi e riflettere</h3>
        <p>In un mondo che corre veloce, questo ritiro offre ai ragazzi uno spazio e un tempo per:</p>
        <ul>
          <li>Riflettere sui propri valori e aspirazioni</li>
          <li>Confrontarsi con coetanei su temi importanti</li>
          <li>Sperimentare momenti di preghiera e meditazione</li>
          <li>Scoprire il proprio posto nel mondo</li>
        </ul>
        <p>Il ritiro è guidato da don Francesco e da animatori esperti nel lavoro con i giovani.</p>
      `,
      program: `
        <h4>Venerdì sera</h4>
        <p>18:00 - Arrivo e sistemazione</p>
        <p>19:30 - Cena</p>
        <p>21:00 - Momento di accoglienza e presentazione</p>
        <p>22:30 - Riposo</p>

        <h4>Sabato</h4>
        <p>08:00 - Colazione</p>
        <p>09:30 - Primo momento di riflessione: "Chi sono io?"</p>
        <p>11:00 - Pausa</p>
        <p>11:30 - Lavoro a gruppi</p>
        <p>12:30 - Pranzo</p>
        <p>15:00 - Secondo momento: "Dove sto andando?"</p>
        <p>16:30 - Tempo libero e sport</p>
        <p>19:30 - Cena</p>
        <p>21:00 - Serata di condivisione</p>

        <h4>Domenica</h4>
        <p>08:00 - Colazione</p>
        <p>09:30 - Momento di preghiera comunitaria</p>
        <p>10:30 - Sintesi del weekend</p>
        <p>12:00 - Pranzo di saluto</p>
        <p>14:00 - Pulizie e preparazione partenza</p>
        <p>16:00 - Partenza</p>
      `,
      requirements: `Apertura al confronto e alla condivisione
Rispetto per i momenti di silenzio e preghiera
Partecipazione attiva alle attività proposte`,
      whatToBring: `Bibbia o libro di preghiere (se posseduto)
Abbigliamento comodo per attività all'aperto
Pigiama e pantofole
Kit igiene personale
Quaderno per appunti
Materiale per eventuale talent show del sabato sera`,
      parentNotes: `Il ritiro ha carattere spirituale ma è aperto a ragazzi di diverse sensibilità religiose.
Non sono ammessi smartphone durante le attività (saranno custoditi e restituiti per comunicazioni urgenti).
È previsto un colloquio individuale facoltativo con don Francesco.
I ragazzi dormiranno in camerette da 2-4 persone, divisi per sesso.`,
      emergencyContacts: `Don Francesco Marchetti - 333.111.2222
Casa di Spiritualità - 0432.987.123
Coordinatrice: Elena Verdi - 340.555.6677`,
      meetingPoint: "Sagrato della Chiesa",
      dropOffTime: "18:00",
      pickUpTime: "16:00",
      includesLunch: true,
      includesSnack: true,
      transportProvided: true,
      weatherDependent: false,
      specialNotes: `Il ritiro prevede momenti di silenzio e raccoglimento che potrebbero non essere adatti a tutti i ragazzi.
È importante che i partecipanti siano motivati e preparati a questa esperienza.
Non è richiesta una fede particolare, ma è necessario rispetto per i momenti spirituali.`,
      cancellationPolicy: `Cancellazione gratuita fino a 7 giorni prima.
Da 6 a 2 giorni prima: rimborso del 70%.
Meno di 48 ore: rimborso del 30%.
Il giorno stesso: nessun rimborso.
Casi di malattia certificata: rimborso completo.`,
      photographyConsent: false,
      additionalImages: JSON.stringify([
        "https://images.unsplash.com/photo-1544717440-6d4c36efe45b?w=600",
        "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=600"
      ]),
      createdBy: "admin_user_id",
      createdAt: Math.floor(Date.now() / 1000),
      updatedAt: Math.floor(Date.now() / 1000)
    });

    // Event 4: Gita al Parco - Solo informazioni base
    const event4Id = nanoid();
    await db.insert(events).values({
      id: event4Id,
      title: "Gita al Parco Avventura",
      description: "Una giornata di divertimento tra ponti tibetani e percorsi acrobatici!",
      startDate: Math.floor(new Date("2024-09-05T09:00:00").getTime() / 1000),
      endDate: Math.floor(new Date("2024-09-05T17:00:00").getTime() / 1000),
      location: "Parco Avventura Green Park",
      minAge: 8,
      maxAge: 16,
      maxParticipants: 30,
      currentParticipants: 22,
      price: "25.00",
      status: "open",
      imageUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800",
      // Solo alcuni campi estesi per testare visualizzazione parziale
      whatToBring: `Abbigliamento sportivo
Scarpe da ginnastica chiuse (obbligatorie)
Pranzo al sacco
Borraccia`,
      includesLunch: false,
      includesSnack: false,
      transportProvided: true,
      weatherDependent: true,
      dropOffTime: "09:00",
      pickUpTime: "17:00",
      photographyConsent: true,
      createdBy: "admin_user_id",
      createdAt: Math.floor(Date.now() / 1000),
      updatedAt: Math.floor(Date.now() / 1000)
    });

    console.log("✅ Extended events seeded successfully!");
    console.log(`Created events with IDs: ${event1Id}, ${event2Id}, ${event3Id}, ${event4Id}`);

  } catch (error) {
    console.error("❌ Error seeding extended events:", error);
    throw error;
  }
}

// Run seeding if this file is executed directly
if (import.meta.main) {
  seedExtendedEvents()
    .then(() => {
      console.log("🎉 Extended events seeding completed!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Seeding failed:", error);
      process.exit(1);
    });
}

export { seedExtendedEvents };
