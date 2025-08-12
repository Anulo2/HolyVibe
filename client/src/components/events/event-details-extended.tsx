"use client";

import { format } from "date-fns";
import { it } from "date-fns/locale";
import {
	AlertTriangle,
	ArrowLeft,
	Calendar,
	Camera,
	Car,
	CheckCircle,
	Clock,
	CloudRain,
	Euro,
	FileText,
	Info,
	MapPin,
	Phone,
	Users,
	Utensils,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { buildImageUrl } from "@/lib/image-utils";

interface ExtendedEventDetails {
	id: string;
	title: string;
	description: string;
	startDate: string;
	endDate?: string;
	locations: string[];
	minAge: number;
	maxAge: number;
	maxParticipants: number;
	currentParticipants: number;
	price?: string;
	status: "draft" | "open" | "closed" | "full" | "cancelled";
	imageUrl?: string;
	// Extended fields
	detailedDescription?: string;
	program?: string;
	requirements?: string;
	whatToBring?: string;
	parentNotes?: string;
	emergencyContacts?: string;
	meetingPoint?: string;
	dropOffTime?: string;
	pickUpTime?: string;
	includesLunch?: boolean;
	includesSnack?: boolean;
	transportProvided?: boolean;
	weatherDependent?: boolean;
	specialNotes?: string;
	cancellationPolicy?: string;
	photographyConsent?: boolean;
	willTakePhotos?: boolean;
	additionalImages?: string;
	createdBy: string;
	createdAt: string;
	updatedAt: string;
	// Organization data
	organization?: {
		id: string;
		name: string;
		photoVideoMinorsDeclaration?: string | null;
	};
}

interface EventDetailsExtendedProps {
	event: ExtendedEventDetails;
	onBack?: () => void;
	onRegister?: () => void;
	canRegister?: boolean;
	isRegistered?: boolean;
}

export function EventDetailsExtended({
	event,
	onBack,
	onRegister,
	canRegister = false,
	isRegistered = false,
}: EventDetailsExtendedProps) {
	const _formatDate = (dateString: string) => {
		return format(new Date(dateString), "dd MMMM yyyy", { locale: it });
	};

	const formatDateTime = (dateString: string) => {
		return format(new Date(dateString), "dd MMMM yyyy 'alle' HH:mm", {
			locale: it,
		});
	};

	const getStatusBadge = () => {
		const statusConfig = {
			draft: { label: "Bozza", variant: "secondary" as const },
			open: { label: "Aperto", variant: "default" as const },
			closed: { label: "Chiuso", variant: "destructive" as const },
			full: { label: "Completo", variant: "outline" as const },
			cancelled: { label: "Annullato", variant: "destructive" as const },
		};

		const config = statusConfig[event.status];
		return <Badge variant={config.variant}>{config.label}</Badge>;
	};

	const parseAdditionalImages = () => {
		if (!event.additionalImages) return [];
		try {
			return JSON.parse(event.additionalImages);
		} catch {
			return [];
		}
	};

	const additionalImages = parseAdditionalImages();

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				{onBack && (
					<Button variant="ghost" onClick={onBack} className="mb-4">
						<ArrowLeft className="h-4 w-4 mr-2" />
						Torna alla lista
					</Button>
				)}
			</div>

			{/* Hero Section - Layout orizzontale */}
			<Card>
				<CardContent className="p-0">
					<div className="md:flex">
						{/* Immagine a sinistra */}
						{event.imageUrl && (
							<div className="md:w-2/5 h-64 md:h-96 relative overflow-hidden">
								<img
									src={buildImageUrl(event.imageUrl) || ""}
									alt={event.title}
									className="w-full h-full object-cover"
								/>
								<div className="absolute top-4 right-4">{getStatusBadge()}</div>
							</div>
						)}

						{/* Contenuto informazioni a destra */}
						<div className={`${event.imageUrl ? "md:w-3/5" : "w-full"} p-6`}>
							<div className="flex flex-col h-full">
								<div className="flex-1">
									<h1 className="text-3xl font-bold mb-4">{event.title}</h1>

									<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
										<div className="flex items-center gap-2 text-muted-foreground">
											<Calendar className="h-5 w-5 flex-shrink-0" />
											<div>
												<div className="font-medium text-foreground">
													{formatDateTime(event.startDate)}
												</div>
												{event.endDate && (
													<div className="text-sm">
														fino al {formatDateTime(event.endDate)}
													</div>
												)}
											</div>
										</div>

										<div className="flex items-center gap-2 text-muted-foreground">
											<MapPin className="h-5 w-5 flex-shrink-0" />
											<div>
												<div className="font-medium text-foreground">
													{event.locations.join(", ")}
												</div>
											</div>
										</div>

										<div className="flex items-center gap-2 text-muted-foreground">
											<Users className="h-5 w-5 flex-shrink-0" />
											<div>
												<div className="font-medium text-foreground">
													{event.currentParticipants}/{event.maxParticipants}{" "}
													partecipanti
												</div>
												<div className="text-sm">
													Età: {event.minAge}-{event.maxAge} anni
												</div>
											</div>
										</div>

										{event.price && (
											<div className="flex items-center gap-2 text-muted-foreground">
												<Euro className="h-5 w-5 flex-shrink-0" />
												<div>
													<div className="font-medium text-foreground">
														€{event.price}
													</div>
												</div>
											</div>
										)}
									</div>
								</div>

								{onRegister && (
									<div className="mt-6">
										<Button
											onClick={onRegister}
											disabled={!canRegister || isRegistered}
											size="lg"
											className="w-full sm:w-auto"
										>
											{isRegistered
												? "Già Iscritto"
												: canRegister
													? "Iscriviti"
													: "Iscrizioni Chiuse"}
										</Button>
									</div>
								)}
							</div>
						</div>
					</div>

					{/* Basic Description */}
					{event.description && (
						<div className="p-6 pt-0">
							<div className="text-foreground max-w-none [&_h1]:text-2xl [&_h1]:font-semibold [&_h1]:mt-6 [&_h1]:mb-2 [&_h1]:leading-tight [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mt-5 [&_h2]:mb-2 [&_h2]:leading-tight [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mt-4 [&_h3]:mb-2 [&_h3]:leading-tight [&_p]:my-4 [&_p]:leading-relaxed [&_strong]:font-semibold [&_em]:italic [&_ul]:my-4 [&_ul]:pl-6 [&_ol]:my-4 [&_ol]:pl-6 [&_li]:my-2 [&_ul>li]:list-disc [&_ol>li]:list-decimal [&_blockquote]:italic [&_blockquote]:font-medium [&_blockquote]:text-muted-foreground [&_blockquote]:border-l-4 [&_blockquote]:border-border [&_blockquote]:pl-4 [&_blockquote]:my-6">
								<div dangerouslySetInnerHTML={{ __html: event.description }} />
							</div>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Detailed Information Tabs */}
			<Tabs defaultValue="overview" className="w-full">
				<TabsList className="grid w-full grid-cols-5">
					<TabsTrigger value="overview">Panoramica</TabsTrigger>
					<TabsTrigger value="program">Programma</TabsTrigger>
					<TabsTrigger value="practical">Info Pratiche</TabsTrigger>
					<TabsTrigger value="services">Servizi</TabsTrigger>
					<TabsTrigger value="gallery">Galleria</TabsTrigger>
				</TabsList>

				{/* Overview Tab */}
				<TabsContent value="overview" className="space-y-4">
					<div className="grid gap-4 md:grid-cols-2">
						{event.detailedDescription && (
							<Card>
								<CardHeader>
									<CardTitle className="flex items-center gap-2">
										<FileText className="h-5 w-5" />
										Descrizione Dettagliata
									</CardTitle>
								</CardHeader>
								<CardContent>
									<div
										className="text-foreground max-w-none [&_h1]:text-2xl [&_h1]:font-semibold [&_h1]:mt-6 [&_h1]:mb-2 [&_h1]:leading-tight [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mt-5 [&_h2]:mb-2 [&_h2]:leading-tight [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mt-4 [&_h3]:mb-2 [&_h3]:leading-tight [&_p]:my-4 [&_p]:leading-relaxed [&_strong]:font-semibold [&_em]:italic [&_ul]:my-4 [&_ul]:pl-6 [&_ol]:my-4 [&_ol]:pl-6 [&_li]:my-2 [&_ul>li]:list-disc [&_ol>li]:list-decimal [&_blockquote]:italic [&_blockquote]:font-medium [&_blockquote]:text-muted-foreground [&_blockquote]:border-l-4 [&_blockquote]:border-border [&_blockquote]:pl-4 [&_blockquote]:my-6"
										dangerouslySetInnerHTML={{
											__html: event.detailedDescription,
										}}
									/>
								</CardContent>
							</Card>
						)}

						{(event.requirements || event.whatToBring) && (
							<Card>
								<CardHeader>
									<CardTitle className="flex items-center gap-2">
										<CheckCircle className="h-5 w-5" />
										Requisiti e Cosa Portare
									</CardTitle>
								</CardHeader>
								<CardContent className="space-y-4">
									{event.requirements && (
										<div>
											<h4 className="font-medium mb-2">Requisiti</h4>
											<p className="text-sm text-muted-foreground whitespace-pre-wrap">
												{event.requirements}
											</p>
										</div>
									)}
									{event.whatToBring && (
										<div>
											<h4 className="font-medium mb-2">Cosa Portare</h4>
											<p className="text-sm text-muted-foreground whitespace-pre-wrap">
												{event.whatToBring}
											</p>
										</div>
									)}
								</CardContent>
							</Card>
						)}
					</div>

					{event.parentNotes && (
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<Info className="h-5 w-5" />
									Note per i Genitori
								</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="whitespace-pre-wrap">{event.parentNotes}</p>
							</CardContent>
						</Card>
					)}
				</TabsContent>

				{/* Program Tab */}
				<TabsContent value="program" className="space-y-4">
					{event.program ? (
						<Card>
							<CardHeader>
								<CardTitle>Programma della Giornata</CardTitle>
								<CardDescription>
									Ecco il programma dettagliato dell'evento
								</CardDescription>
							</CardHeader>
							<CardContent>
								<div
									className="text-foreground max-w-none [&_h1]:text-2xl [&_h1]:font-semibold [&_h1]:mt-6 [&_h1]:mb-2 [&_h1]:leading-tight [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mt-5 [&_h2]:mb-2 [&_h2]:leading-tight [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mt-4 [&_h3]:mb-2 [&_h3]:leading-tight [&_p]:my-4 [&_p]:leading-relaxed [&_strong]:font-semibold [&_em]:italic [&_ul]:my-4 [&_ul]:pl-6 [&_ol]:my-4 [&_ol]:pl-6 [&_li]:my-2 [&_ul>li]:list-disc [&_ol>li]:list-decimal [&_blockquote]:italic [&_blockquote]:font-medium [&_blockquote]:text-muted-foreground [&_blockquote]:border-l-4 [&_blockquote]:border-border [&_blockquote]:pl-4 [&_blockquote]:my-6"
									dangerouslySetInnerHTML={{ __html: event.program }}
								/>
							</CardContent>
						</Card>
					) : (
						<Card>
							<CardContent className="p-6 text-center text-muted-foreground">
								<Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
								<p>Il programma dettagliato sarà disponibile a breve.</p>
							</CardContent>
						</Card>
					)}
				</TabsContent>

				{/* Practical Info Tab */}
				<TabsContent value="practical" className="space-y-4">
					<div className="grid gap-4 md:grid-cols-2">
						{/* Meeting and Times */}
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<Clock className="h-5 w-5" />
									Orari e Luogo
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-3">
								{event.meetingPoint && (
									<div>
										<p className="font-medium">Punto di Ritrovo</p>
										<p className="text-sm text-muted-foreground">
											{event.meetingPoint}
										</p>
									</div>
								)}
								{event.dropOffTime && (
									<div>
										<p className="font-medium">Orario Consegna</p>
										<p className="text-sm text-muted-foreground">
											{event.dropOffTime}
										</p>
									</div>
								)}
								{event.pickUpTime && (
									<div>
										<p className="font-medium">Orario Ritiro</p>
										<p className="text-sm text-muted-foreground">
											{event.pickUpTime}
										</p>
									</div>
								)}
							</CardContent>
						</Card>

						{/* Emergency Contacts */}
						{event.emergencyContacts && (
							<Card>
								<CardHeader>
									<CardTitle className="flex items-center gap-2">
										<Phone className="h-5 w-5" />
										Contatti di Emergenza
									</CardTitle>
								</CardHeader>
								<CardContent>
									<p className="text-sm whitespace-pre-wrap">
										{event.emergencyContacts}
									</p>
								</CardContent>
							</Card>
						)}
					</div>

					{/* Special Notes and Policies */}
					<div className="grid gap-4 md:grid-cols-2">
						{event.specialNotes && (
							<Card>
								<CardHeader>
									<CardTitle className="flex items-center gap-2">
										<AlertTriangle className="h-5 w-5" />
										Note Speciali
									</CardTitle>
								</CardHeader>
								<CardContent>
									<p className="text-sm whitespace-pre-wrap">
										{event.specialNotes}
									</p>
								</CardContent>
							</Card>
						)}

						{event.cancellationPolicy && (
							<Card>
								<CardHeader>
									<CardTitle className="flex items-center gap-2">
										<FileText className="h-5 w-5" />
										Politica di Cancellazione
									</CardTitle>
								</CardHeader>
								<CardContent>
									<p className="text-sm whitespace-pre-wrap">
										{event.cancellationPolicy}
									</p>
								</CardContent>
							</Card>
						)}
					</div>
				</TabsContent>

				{/* Services Tab */}
				<TabsContent value="services" className="space-y-4">
					<Card>
						<CardHeader>
							<CardTitle>Servizi Inclusi</CardTitle>
							<CardDescription>Ecco cosa è incluso nell'evento</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="grid gap-3 md:grid-cols-2">
								<div className="flex items-center gap-3">
									<Utensils className="h-5 w-5" />
									<span>Pranzo</span>
									{event.includesLunch ? (
										<Badge variant="default">Incluso</Badge>
									) : (
										<Badge variant="outline">Non incluso</Badge>
									)}
								</div>
								<div className="flex items-center gap-3">
									<Utensils className="h-5 w-5" />
									<span>Merenda</span>
									{event.includesSnack ? (
										<Badge variant="default">Inclusa</Badge>
									) : (
										<Badge variant="outline">Non inclusa</Badge>
									)}
								</div>
								<div className="flex items-center gap-3">
									<Car className="h-5 w-5" />
									<span>Trasporto</span>
									{event.transportProvided ? (
										<Badge variant="default">Fornito</Badge>
									) : (
										<Badge variant="outline">Non fornito</Badge>
									)}
								</div>
								{event.photographyConsent && (
									<div className="flex items-center gap-3">
										<Camera className="h-5 w-5" />
										<span>Consenso Foto</span>
										{event.photographyConsent ? (
											<Badge variant="default">Richiesto</Badge>
										) : (
											<Badge variant="outline">Non richiesto</Badge>
										)}
									</div>
								)}

								{/* Dichiarazione Foto/Video dell'Organizzazione */}
								{event.willTakePhotos &&
									event.organization?.photoVideoMinorsDeclaration && (
										<div className="bg-purple-50 dark:bg-purple-950/20 p-6 rounded-lg border border-purple-200 dark:border-purple-800 col-span-full">
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
								{event.willTakePhotos &&
									!event.organization?.photoVideoMinorsDeclaration && (
										<div className="bg-purple-50 dark:bg-purple-950/20 p-6 rounded-lg border border-purple-200 dark:border-purple-800 col-span-full">
											<h4 className="font-semibold mb-3 text-lg flex items-center gap-2 text-purple-700 dark:text-purple-300">
												<div className="text-2xl">📸</div>
												Informativa Foto/Video
											</h4>
											<div className="text-sm text-muted-foreground bg-background p-4 rounded">
												<p className="mb-2">
													Durante questo evento verranno scattate foto e/o video
													che potrebbero includere i partecipanti minorenni.
												</p>
												<p className="mb-2">
													Durante la registrazione, i genitori potranno
													autorizzare o negare il consenso per il trattamento
													delle immagini del proprio figlio/figlia secondo le
													finalità specificate dall'organizzazione.
												</p>
												<p className="text-xs text-purple-600 dark:text-purple-400">
													Per maggiori dettagli, contattare direttamente
													l'organizzazione.
												</p>
											</div>
										</div>
									)}
							</div>

							{event.weatherDependent && (
								<div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
									<div className="flex items-center gap-2">
										<CloudRain className="h-5 w-5 text-yellow-600" />
										<span className="font-medium text-yellow-800">
											Dipende dal meteo
										</span>
									</div>
									<p className="text-sm text-yellow-700 mt-1">
										Questo evento potrebbe essere modificato o cancellato in
										base alle condizioni meteorologiche.
									</p>
								</div>
							)}
						</CardContent>
					</Card>
				</TabsContent>

				{/* Gallery Tab */}
				<TabsContent value="gallery" className="space-y-4">
					<Card>
						<CardHeader>
							<CardTitle>Galleria Immagini</CardTitle>
							<CardDescription>Foto e immagini dell'evento</CardDescription>
						</CardHeader>
						<CardContent>
							{additionalImages.length > 0 ? (
								<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
									{event.imageUrl && (
										<div className="relative rounded-lg overflow-hidden">
											<img
												src={buildImageUrl(event.imageUrl) || ""}
												alt={`${event.title} - Immagine principale`}
												className="w-full h-48 object-cover"
											/>
											<div className="absolute bottom-2 left-2">
												<Badge variant="secondary">Principale</Badge>
											</div>
										</div>
									)}
									{additionalImages.map((imageUrl: string, index: number) => (
										<div
											key={`image-${imageUrl}-${index}`}
											className="relative rounded-lg overflow-hidden"
										>
											<img
												src={buildImageUrl(imageUrl) || ""}
												alt={`${event.title} - Immagine ${index + 1}`}
												className="w-full h-48 object-cover"
											/>
										</div>
									))}
								</div>
							) : event.imageUrl ? (
								<div className="relative rounded-lg overflow-hidden max-w-md">
									<img
										src={buildImageUrl(event.imageUrl) || ""}
										alt={event.title}
										className="w-full h-64 object-cover"
									/>
								</div>
							) : (
								<div className="text-center py-8 text-muted-foreground">
									<Camera className="h-12 w-12 mx-auto mb-4 opacity-50" />
									<p>Nessuna immagine disponibile</p>
								</div>
							)}
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	);
}
