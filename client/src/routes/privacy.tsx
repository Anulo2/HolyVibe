import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

export const Route = createFileRoute("/privacy")({
	component: PrivacyPage,
});

function PrivacyPage() {
	return (
		<div className="container mx-auto px-4 py-8 max-w-4xl">
			<div className="text-center mb-8">
				<h1 className="text-3xl font-bold text-gray-900 mb-2">
					Informativa Privacy
				</h1>
				<p className="text-gray-600">
					Informativa sul trattamento dei dati personali ex art. 13 e 14 GDPR
					2016/679
				</p>
			</div>

			<div className="space-y-6">
				{/* Informativa Privacy Principale */}
				<Card>
					<CardHeader>
						<CardTitle className="text-xl text-blue-600">
							Informativa sul Trattamento dei Dati Personali
						</CardTitle>
					</CardHeader>
					<CardContent>
						<ScrollArea className="h-96 w-full">
							<div className="space-y-4 text-sm">
								<div className="bg-blue-50 p-4 rounded-lg">
									<h3 className="font-semibold mb-2 text-blue-800">Premessa</h3>
									<p className="text-blue-700">
										La presente informativa è resa ai sensi degli articoli 13 e
										14 del Regolamento UE 2016/679 (GDPR) e del Decreto Generale
										CEI del 24 maggio 2018 relativo alla piattaforma digitale
										per la gestione di eventi parrocchiali e familiari.
									</p>
								</div>

								<div>
									<h3 className="font-semibold mb-2">
										1. Titolare del Trattamento
									</h3>
									<p className="mb-2">
										Il titolare del trattamento è l'organizzazione religiosa a
										cui appartieni, identificabile nella sezione "Le Mie
										Parrocchie" del tuo profilo utente.
									</p>
									<p className="mb-2">
										Per contattare il titolare del trattamento, utilizza i dati
										di contatto disponibili nella pagina dell'organizzazione o
										contatta direttamente l'amministratore.
									</p>
								</div>

								<div>
									<h3 className="font-semibold mb-2">
										2. Finalità del Trattamento
									</h3>
									<p className="mb-2">
										I tuoi dati personali vengono trattati per le seguenti
										finalità:
									</p>
									<ul className="list-disc pl-5 space-y-1 mb-4">
										<li>
											<strong>Gestione dell'account utente:</strong>{" "}
											autenticazione tramite numero di telefono, gestione del
											profilo
										</li>
										<li>
											<strong>Gestione famiglie e membri:</strong>{" "}
											organizzazione dei nuclei familiari e gestione dei dati
											dei minori
										</li>
										<li>
											<strong>Gestione eventi:</strong> creazione, pubblicazione
											e gestione delle iscrizioni agli eventi
										</li>
										<li>
											<strong>Gestione autorizzazioni:</strong> gestione delle
											persone autorizzate al ritiro dei minori
										</li>
										<li>
											<strong>Comunicazioni:</strong> invio di OTP per
											l'autenticazione e comunicazioni relative agli eventi
										</li>
										<li>
											<strong>Amministrazione:</strong> gestione delle
											organizzazioni e reportistica per gli amministratori
										</li>
									</ul>
								</div>

								<div>
									<h3 className="font-semibold mb-2">
										3. Categorie di Dati Trattati
									</h3>
									<p className="mb-2">
										La piattaforma tratta le seguenti categorie di dati:
									</p>

									<h4 className="font-medium mb-1">3.1 Dati dell'utente:</h4>
									<ul className="list-disc pl-5 space-y-1 mb-3">
										<li>Nome e cognome</li>
										<li>Numero di telefono (per autenticazione)</li>
										<li>
											Indirizzo email (generato automaticamente o inserito)
										</li>
										<li>Data di nascita</li>
									</ul>

									<h4 className="font-medium mb-1">3.2 Dati dei minori:</h4>
									<ul className="list-disc pl-5 space-y-1 mb-3">
										<li>Nome, cognome, data e luogo di nascita</li>
										<li>Codice fiscale</li>
										<li>Genere</li>
										<li>Allergie e note mediche</li>
									</ul>

									<h4 className="font-medium mb-1">
										3.3 Dati delle persone autorizzate:
									</h4>
									<ul className="list-disc pl-5 space-y-1 mb-3">
										<li>Nome completo e relazione di parentela</li>
										<li>Numero di telefono ed email</li>
										<li>Autorizzazioni specifiche per luogo</li>
									</ul>

									<h4 className="font-medium mb-1">
										3.4 Dati tecnici e di navigazione:
									</h4>
									<ul className="list-disc pl-5 space-y-1 mb-3">
										<li>
											Indirizzo IP e User Agent (conservati nella sessione)
										</li>
										<li>Token di sessione e cookie di autenticazione</li>
										<li>
											Log di accesso e attività (per la sicurezza del sistema)
										</li>
									</ul>
								</div>

								<div>
									<h3 className="font-semibold mb-2">
										4. Base Giuridica del Trattamento
									</h3>
									<ul className="list-disc pl-5 space-y-1">
										<li>
											<strong>Consenso (art. 6.1.a GDPR):</strong> per i
											trattamenti opzionali come foto/video e comunicazioni non
											essenziali
										</li>
										<li>
											<strong>
												Esecuzione di un contratto (art. 6.1.b GDPR):
											</strong>{" "}
											per la gestione delle iscrizioni agli eventi
										</li>
										<li>
											<strong>Legittimo interesse (art. 6.1.f GDPR):</strong>{" "}
											per la sicurezza del sistema e la prevenzione di accessi
											non autorizzati
										</li>
										<li>
											<strong>Interesse vitale (art. 6.1.d GDPR):</strong> per i
											dati medici essenziali alla sicurezza dei minori
										</li>
									</ul>
								</div>

								<div>
									<h3 className="font-semibold mb-2">
										5. Modalità di Trattamento
									</h3>
									<p className="mb-2">
										Il trattamento è effettuato con modalità informatiche e
										telematiche, con logiche strettamente correlate alle
										finalità indicate e comunque in modo da garantire la
										sicurezza e la riservatezza dei dati.
									</p>
									<ul className="list-disc pl-5 space-y-1">
										<li>Autenticazione sicura tramite OTP via SMS</li>
										<li>Crittografia delle comunicazioni (HTTPS)</li>
										<li>
											Cookie sicuri con configurazione httpOnly e sameSite
										</li>
										<li>Controllo degli accessi basato su ruoli</li>
									</ul>
								</div>

								<div>
									<h3 className="font-semibold mb-2">
										6. Conservazione dei Dati
									</h3>
									<ul className="list-disc pl-5 space-y-1">
										<li>
											<strong>Dati di account:</strong> fino alla cancellazione
											dell'account
										</li>
										<li>
											<strong>Dati delle sessioni:</strong> secondo la
											configurazione del sistema (max 30 giorni di inattività)
										</li>
										<li>
											<strong>Codici OTP:</strong> 5 minuti dalla generazione
										</li>
										<li>
											<strong>Log di sistema:</strong> tempo necessario per la
											sicurezza e risoluzione di problemi tecnici
										</li>
										<li>
											<strong>Dati degli eventi:</strong> per il tempo
											necessario all'organizzazione e documentazione
											dell'attività
										</li>
									</ul>
								</div>

								<div>
									<h3 className="font-semibold mb-2">
										7. Comunicazione e Condivisione
									</h3>
									<p className="mb-2">I dati possono essere comunicati a:</p>
									<ul className="list-disc pl-5 space-y-1">
										<li>
											<strong>Provider del servizio SMS:</strong> BulkGate per
											l'invio degli OTP
										</li>
										<li>
											<strong>Amministratori dell'organizzazione:</strong> per
											la gestione degli eventi e delle famiglie
										</li>
										<li>
											<strong>Animatori:</strong> limitatamente ai dati
											necessari per l'assistenza negli eventi
										</li>
									</ul>
									<p className="mt-2">
										I dati non vengono trasferiti al di fuori dell'Unione
										Europea.
									</p>
								</div>

								<div>
									<h3 className="font-semibold mb-2">
										8. Diritti dell'Interessato
									</h3>
									<p className="mb-2">
										Ai sensi degli artt. 15-22 del GDPR, hai diritto di:
									</p>
									<ul className="list-disc pl-5 space-y-1">
										<li>Accedere ai tuoi dati personali</li>
										<li>Rettificare dati inesatti o incompleti</li>
										<li>Cancellare i dati (diritto all'oblio)</li>
										<li>Limitare il trattamento</li>
										<li>Opporti al trattamento</li>
										<li>Portabilità dei dati</li>
										<li>Revocare il consenso (ove applicabile)</li>
										<li>Proporre reclamo al Garante Privacy</li>
									</ul>
									<p className="mt-2">
										Per esercitare i tuoi diritti, contatta l'amministratore
										della tua organizzazione attraverso i canali indicati nella
										pagina "Le Mie Parrocchie".
									</p>
								</div>

								<div className="bg-amber-50 p-4 rounded-lg">
									<h3 className="font-semibold mb-2 text-amber-800">
										Trattamento di Dati di Minori
									</h3>
									<p className="text-amber-700 text-xs">
										I dati dei minori sono trattati esclusivamente previo
										consenso dei genitori o tutori legali, in conformità
										all'art. 8 del GDPR. La piattaforma implementa misure
										specifiche per la protezione dei dati dei minori, inclusi
										controlli rigorosi sugli accessi e gestione delle
										autorizzazioni per il ritiro.
									</p>
								</div>
							</div>
						</ScrollArea>
					</CardContent>
				</Card>

				<Separator />

				{/* Informazioni sui Cookie */}
				<Card>
					<CardHeader>
						<CardTitle className="text-xl text-green-600">
							Informazioni sui Cookie
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="space-y-4 text-sm">
							<p>
								Questa piattaforma utilizza cookie tecnici necessari per il
								funzionamento del servizio:
							</p>
							<ul className="list-disc pl-5 space-y-1">
								<li>
									<strong>Cookie di autenticazione:</strong> per mantenere la
									sessione utente attiva
								</li>
								<li>
									<strong>Cookie di sicurezza:</strong> per la protezione CSRF e
									la sicurezza delle comunicazioni
								</li>
								<li>
									<strong>Cookie di preferenze:</strong> per salvare le
									impostazioni del tema (chiaro/scuro)
								</li>
							</ul>
							<p className="text-xs text-muted-foreground mt-4">
								Tutti i cookie utilizzati sono configurati come sicuri
								(httpOnly, secure, sameSite) e sono strettamente necessari per
								il funzionamento del servizio.
							</p>
						</div>
					</CardContent>
				</Card>

				<Separator />

				{/* Informativa per foto e video negli eventi */}
				<div className="bg-purple-50 p-4 rounded-lg">
					<h3 className="font-semibold mb-2 text-purple-800">
						Trattamento di Foto e Video negli Eventi
					</h3>
					<p className="text-sm text-purple-700">
						Le dichiarazioni specifiche per l'autorizzazione al trattamento di
						fotografie e video dei minorenni sono gestite individualmente da
						ogni organizzazione e vengono mostrate nei dettagli di ogni evento
						durante la procedura di iscrizione. Ogni organizzazione può definire
						la propria informativa specifica nelle impostazioni amministrative.
					</p>
				</div>

				<div className="text-center text-xs text-gray-500 mt-8">
					<p>
						Per qualsiasi domanda riguardo questa informativa privacy, contatta
						l'amministratore della tua organizzazione.
					</p>
					<p className="mt-2">
						Informativa aggiornata al: {new Date().toLocaleDateString("it-IT")}
						<span className="mx-2">•</span>
						Versione: 2.0
					</p>
					<p className="mt-1">
						<a
							href="https://www.garanteprivacy.it/i-miei-diritti"
							target="_blank"
							rel="noopener noreferrer"
							className="text-blue-600 hover:underline"
						>
							Maggiori informazioni sui tuoi diritti privacy
						</a>
					</p>
				</div>
			</div>
		</div>
	);
}
