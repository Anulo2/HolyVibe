"use client";

import { format } from "date-fns";
import { it } from "date-fns/locale";
import { Calendar, Edit, Users, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { SafeHTML } from "@/components/ui/safe-html";

interface EventDetailsDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	event: any;
	mode?: "user" | "admin";
	onRegister?: () => void;
	onEdit?: () => void;
	canRegister?: boolean;
	isRegistered?: boolean;
}

export function EventDetailsDialog({
	open,
	onOpenChange,
	event,
	mode = "user",
	onRegister,
	onEdit,
	canRegister = false,
	isRegistered = false,
}: EventDetailsDialogProps) {
	if (!event) return null;

	const formatDate = (date: string | Date) => {
		const dateObj = typeof date === "string" ? new Date(date) : date;
		return dateObj.toLocaleDateString("it-IT", {
			day: "2-digit",
			month: "2-digit",
			year: "numeric",
		});
	};

	const getStatusVariant = (
		status: string,
	): "success" | "warning" | "destructive" | "default" => {
		switch (status) {
			case "open":
				return "success";
			case "full":
				return "warning";
			case "closed":
			case "cancelled":
				return "destructive";
			default:
				return "default";
		}
	};

	const getStatusText = (status: string) => {
		switch (status) {
			case "open":
				return "Aperto";
			case "full":
				return "Completo";
			case "closed":
				return "Chiuso";
			case "draft":
				return "Bozza";
			case "cancelled":
				return "Annullato";
			default:
				return "Sconosciuto";
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="w-[95vw] max-h-[98vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle className="text-2xl">{event.title}</DialogTitle>
					<DialogDescription className="text-base">
						{formatDate(event.startDate)}
						{event.endDate &&
							event.endDate !== event.startDate &&
							` - ${formatDate(event.endDate)}`}{" "}
						• {event.location}
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-6">
					{/* Layout orizzontale principale - occupa tutto lo spazio */}
					<div className="lg:flex lg:gap-8">
						{/* Immagine a sinistra */}
						{event.imageUrl && (
							<div className="lg:w-1/4 mb-4 lg:mb-0">
								<img
									src={event.imageUrl}
									alt={event.title}
									className="w-full h-full  object-cover rounded-lg"
								/>
							</div>
						)}

						{/* Colonna centrale: Informazioni principali */}
						<div
							className={`${
								event.imageUrl ? "lg:w-1/4" : "lg:w-1/3"
							} space-y-4`}
						>
							<div>
								<h4 className="font-semibold mb-2 text-lg">
									Descrizione Breve
								</h4>
								<div className="text-muted-foreground">
									<SafeHTML content={event.description} />
								</div>
							</div>

							<div className="space-y-3">
								<div>
									<h5 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
										Età
									</h5>
									<p className="text-lg font-semibold">
										{event.minAge} - {event.maxAge} anni
									</p>
								</div>
								<div>
									<h5 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
										Prezzo
									</h5>
									<p className="text-lg font-semibold">
										{event.price === "0.00" ? "Gratuito" : `€${event.price}`}
									</p>
								</div>
								<div>
									<h5 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
										Partecipanti
									</h5>
									<p className="text-lg font-semibold">
										{event.currentParticipants}/{event.maxParticipants}
									</p>
								</div>
								<div>
									<h5 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
										Stato
									</h5>
									<Badge
										variant={getStatusVariant(event.status)}
										className="text-sm"
									>
										{getStatusText(event.status)}
									</Badge>
								</div>
								{mode === "admin" && event.createdAt && (
									<div>
										<h5 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
											Data Creazione
										</h5>
										<p className="text-sm text-muted-foreground">
											{formatDate(event.createdAt)}
										</p>
									</div>
								)}
							</div>
						</div>

						{/* Colonna destra: Descrizione dettagliata */}
						{event.detailedDescription && (
							<div
								className={`${
									event.imageUrl ? "lg:w-1/2" : "lg:w-2/3"
								} lg:block hidden`}
							>
								<h4 className="font-semibold mb-3 text-lg">
									Descrizione Dettagliata
								</h4>
								<div className="text-muted-foreground bg-muted/30 p-4 rounded-lg max-h-80 overflow-y-auto">
									<SafeHTML content={event.detailedDescription} />
								</div>
							</div>
						)}
					</div>

					{/* Descrizione dettagliata per mobile */}
					{event.detailedDescription && (
						<div className="lg:hidden">
							<h4 className="font-semibold mb-3 text-lg">
								Descrizione Dettagliata
							</h4>
							<div className="text-muted-foreground bg-muted/30 p-4 rounded-lg">
								<SafeHTML content={event.detailedDescription} />
							</div>
						</div>
					)}

					{/* Informazioni aggiuntive */}
					{(event.program || event.requirements || event.whatToBring) && (
						<div className="bg-muted/20 p-6 rounded-lg">
							<h4 className="font-semibold mb-4 text-lg flex items-center gap-2">
								<div className="w-1 h-6 bg-primary rounded"></div>
								Informazioni Aggiuntive
							</h4>
							<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
								{event.program && (
									<div className="space-y-2">
										<h5 className="font-medium text-primary">📅 Programma</h5>
										<div className="text-sm text-muted-foreground bg-background p-3 rounded">
											<SafeHTML content={event.program} />
										</div>
									</div>
								)}
								{event.requirements && (
									<div className="space-y-2">
										<h5 className="font-medium text-primary">✅ Requisiti</h5>
										<p className="text-sm text-muted-foreground whitespace-pre-wrap bg-background p-3 rounded">
											{event.requirements}
										</p>
									</div>
								)}
								{event.whatToBring && (
									<div className="space-y-2">
										<h5 className="font-medium text-primary">
											🎒 Cosa Portare
										</h5>
										<p className="text-sm text-muted-foreground whitespace-pre-wrap bg-background p-3 rounded">
											{event.whatToBring}
										</p>
									</div>
								)}
							</div>
						</div>
					)}

					{/* Informazioni pratiche */}
					{(event.meetingPoint || event.dropOffTime || event.pickUpTime) && (
						<div className="bg-blue-50 dark:bg-blue-950/20 p-6 rounded-lg border border-blue-200 dark:border-blue-800">
							<h4 className="font-semibold mb-4 text-lg flex items-center gap-2 text-blue-700 dark:text-blue-300">
								<div className="w-1 h-6 bg-blue-500 rounded"></div>
								Informazioni Pratiche
							</h4>
							<div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
								{event.meetingPoint && (
									<div className="flex items-start gap-3">
										<div className="text-blue-600 dark:text-blue-400 mt-0.5">
											📍
										</div>
										<div>
											<h5 className="font-medium mb-1 text-blue-700 dark:text-blue-300">
												Punto di Ritrovo
											</h5>
											<p className="text-sm text-muted-foreground">
												{event.meetingPoint}
											</p>
										</div>
									</div>
								)}
								{event.dropOffTime && (
									<div className="flex items-start gap-3">
										<div className="text-blue-600 dark:text-blue-400 mt-0.5">
											⬇️
										</div>
										<div>
											<h5 className="font-medium mb-1 text-blue-700 dark:text-blue-300">
												Orario Consegna
											</h5>
											<p className="text-sm text-muted-foreground">
												{event.dropOffTime}
											</p>
										</div>
									</div>
								)}
								{event.pickUpTime && (
									<div className="flex items-start gap-3">
										<div className="text-blue-600 dark:text-blue-400 mt-0.5">
											⬆️
										</div>
										<div>
											<h5 className="font-medium mb-1 text-blue-700 dark:text-blue-300">
												Orario Ritiro
											</h5>
											<p className="text-sm text-muted-foreground">
												{event.pickUpTime}
											</p>
										</div>
									</div>
								)}
							</div>
						</div>
					)}

					{/* Note per i genitori */}
					{event.parentNotes && (
						<div className="bg-amber-50 dark:bg-amber-950/20 p-6 rounded-lg border border-amber-200 dark:border-amber-800">
							<h4 className="font-semibold mb-3 text-lg flex items-center gap-2 text-amber-700 dark:text-amber-300">
								<div className="text-2xl">📝</div>
								Note Importanti per i Genitori
							</h4>
							<p className="text-muted-foreground whitespace-pre-wrap bg-background p-4 rounded">
								{event.parentNotes}
							</p>
						</div>
					)}

					{/* Dichiarazione Foto/Video dell'Organizzazione */}
					{event.willTakePhotos && event.organization?.photoVideoMinorsDeclaration && (
						<div className="bg-purple-50 dark:bg-purple-950/20 p-6 rounded-lg border border-purple-200 dark:border-purple-800">
							<h4 className="font-semibold mb-3 text-lg flex items-center gap-2 text-purple-700 dark:text-purple-300">
								<div className="text-2xl">📸</div>
								Dichiarazione Autorizzazione Foto/Video Minorenni
							</h4>
							<div className="text-sm text-muted-foreground bg-background p-4 rounded whitespace-pre-wrap">
								{event.organization.photoVideoMinorsDeclaration}
							</div>
							<div className="mt-3 text-xs text-purple-600 dark:text-purple-400">
								Dichiarazione di: {event.organization.name}
							</div>
						</div>
					)}

					{/* Dichiarazione generica se l'organizzazione non ha una specifica */}
					{event.willTakePhotos && (!event.organization?.photoVideoMinorsDeclaration) && (
						<div className="bg-purple-50 dark:bg-purple-950/20 p-6 rounded-lg border border-purple-200 dark:border-purple-800">
							<h4 className="font-semibold mb-3 text-lg flex items-center gap-2 text-purple-700 dark:text-purple-300">
								<div className="text-2xl">📸</div>
								Informativa Foto/Video
							</h4>
							<div className="text-sm text-muted-foreground bg-background p-4 rounded">
								<p className="mb-2">
									Durante questo evento verranno scattate foto e/o video che potrebbero includere i partecipanti minorenni.
								</p>
								<p className="mb-2">
									Durante la registrazione, i genitori potranno autorizzare o negare il consenso per il trattamento
									delle immagini del proprio figlio/figlia secondo le finalità specificate dall'organizzazione.
								</p>
								<p className="text-xs text-purple-600 dark:text-purple-400">
									Per maggiori dettagli, contattare direttamente l'organizzazione.
								</p>
							</div>
						</div>
					)}

					{/* Azioni */}
					<div className="flex gap-3 pt-4 border-t">
						{mode === "user" && onRegister && (
							<Button
								onClick={onRegister}
								disabled={!canRegister || isRegistered}
								size="lg"
								className="flex-1"
							>
								{isRegistered
									? "Già Iscritto"
									: canRegister
										? "Iscriviti"
										: "Iscrizioni Chiuse"}
							</Button>
						)}

						{mode === "admin" && onEdit && (
							<Button onClick={onEdit} className="flex-1">
								<Edit className="h-4 w-4 mr-2" />
								Modifica Evento
							</Button>
						)}

						<Button variant="outline" onClick={() => onOpenChange(false)}>
							Chiudi
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
