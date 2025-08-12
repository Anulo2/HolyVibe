"use client";

import { format } from "date-fns";
import { it } from "date-fns/locale";
import { CalendarIcon, Loader2 } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { FileUpload } from "@/components/ui/file-upload";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUpdateEventMutation } from "@/hooks/useEventsQuery";
import { useFileUpload } from "@/hooks/useFileUpload";
import { useOrganizationsQuery } from "@/hooks/useSettings";
import { cn } from "@/lib/utils";

interface EventiDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	evento?: {
		id: string;
		title: string;
		description: string;
		startDate: string;
		endDate?: string | null;
		locations: string | string[];
		minAge: number;
		maxAge: number;
		maxParticipants: number;
		currentParticipants: number;
		price?: string | null;
		status: "draft" | "open" | "closed" | "full" | "cancelled";
		imageUrl?: string | null;
		detailedDescription?: string | null;
		program?: string | null;
		requirements?: string | null;
		whatToBring?: string | null;
		parentNotes?: string | null;
		emergencyContacts?: string | null;
		meetingPoint?: string | null;
		dropOffTime?: string | null;
		pickUpTime?: string | null;
		includesLunch?: boolean;
		includesSnack?: boolean;
		transportProvided?: boolean;
		weatherDependent?: boolean;
		specialNotes?: string | null;
		cancellationPolicy?: string | null;
		photographyConsent?: boolean;
		willTakePhotos?: boolean;
		photosForSocialMedia?: boolean;
		additionalImages?: string | null;
		createdBy: string;
		createdAt: string;
		updatedAt: string;
		organizationId?: string;
		organization?: {
			id: string;
			name: string;
		};
	};
}

export function EventiDialog({
	open,
	onOpenChange,
	evento,
}: EventiDialogProps) {
	const [formData, setFormData] = useState({
		titolo: "",
		descrizione: "",
		dataInizio: null as Date | null,
		dataFine: null as Date | null,
		luoghi: [""],
		etaMin: "",
		etaMax: "",
		postiDisponibili: "",
		prezzo: "",
		status: "draft" as "draft" | "open" | "closed" | "full" | "cancelled",
		immagine: null as File | null,
		imageUrl: "",
		dettagliCompleti: "",
		verrannoScattateFoto: false,
		organizationId: "",
	});

	const updateEventMutation = useUpdateEventMutation();
	const { data: organizations, isLoading: organizationsLoading } =
		useOrganizationsQuery();
	const fileUpload = useFileUpload({
		folder: "events",
		optimize: true,
		onUploadSuccess: (result) => {
			setFormData((prev) => ({
				...prev,
				imageUrl: result.url,
			}));
		},
		showToasts: false,
	});

	useEffect(() => {
		if (evento && open) {
			// Populate form with existing event data
			// Handle locations field - ensure it's always an array
			let luoghi = [""];

			// Check all possible location field variations
			if (Array.isArray(evento.locations) && evento.locations.length > 0) {
				luoghi = evento.locations;
			} else if (
				Array.isArray(evento.locations) &&
				evento.locations.length > 0
			) {
				luoghi = evento.locations;
			} else if (
				typeof evento.locations === "string" &&
				evento.locations.trim()
			) {
				// Try to parse as JSON first (for serialized arrays)
				try {
					const parsedLocations = JSON.parse(evento.locations);
					if (Array.isArray(parsedLocations) && parsedLocations.length > 0) {
						luoghi = parsedLocations;
					} else {
						luoghi = [evento.locations];
					}
				} catch {
					// If JSON parsing fails, treat as regular string
					luoghi = [evento.locations];
				}
			} else if (
				typeof evento.locations === "string" &&
				evento.locations.trim()
			) {
				luoghi = [evento.locations];
			}

			setFormData({
				titolo: evento.title || "",
				descrizione: evento.description || "",
				dataInizio: evento.startDate ? new Date(evento.startDate) : null,
				dataFine: evento.endDate ? new Date(evento.endDate) : null,
				luoghi: luoghi,
				etaMin: evento.minAge?.toString() || "",
				etaMax: evento.maxAge?.toString() || "",
				postiDisponibili: evento.maxParticipants?.toString() || "",
				prezzo: evento.price || "",
				status: evento.status || "draft",
				immagine: null,
				imageUrl: evento.imageUrl || "",
				dettagliCompleti: evento.detailedDescription || "",
				verrannoScattateFoto: evento.willTakePhotos || false,
				organizationId: evento.organizationId || evento.organization?.id || "",
			});
		} else if (!evento && open) {
			// Reset form for new event
			setFormData({
				titolo: "",
				descrizione: "",
				dataInizio: null,
				dataFine: null,
				luoghi: [""],
				etaMin: "",
				etaMax: "",
				postiDisponibili: "",
				prezzo: "",
				status: "draft",
				immagine: null,
				imageUrl: "",
				dettagliCompleti: "",
				verrannoScattateFoto: false,
				organizationId: "",
			});
		}
	}, [evento, open]);

	const handleChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
	) => {
		const { id, value } = e.target;
		setFormData((prev) => ({ ...prev, [id]: value }));
	};

	const handleFileSelect = (file: File) => {
		// Clean up previous preview URL if it exists
		if (formData.imageUrl?.startsWith("blob:")) {
			URL.revokeObjectURL(formData.imageUrl);
		}

		setFormData((prev) => ({
			...prev,
			immagine: file,
			imageUrl: "",
		}));
	};

	const handleFileRemove = () => {
		// Clean up preview URL if it exists
		if (formData.imageUrl?.startsWith("blob:")) {
			URL.revokeObjectURL(formData.imageUrl);
		}

		setFormData((prev) => ({
			...prev,
			immagine: null,
			imageUrl: "",
		}));
		fileUpload.reset();
	};

	const handleDateChange = (
		field: "dataInizio" | "dataFine",
		date: Date | undefined,
	) => {
		setFormData((prev) => ({ ...prev, [field]: date || null }));
	};

	const handleDescriptionChange = (content: string) => {
		setFormData((prev) => ({ ...prev, descrizione: content }));
	};

	const handleDetailedDescriptionChange = (content: string) => {
		setFormData((prev) => ({ ...prev, dettagliCompleti: content }));
	};

	const handleSelectChange = (value: string) => {
		setFormData((prev) => ({
			...prev,
			status: value as "draft" | "open" | "closed" | "full" | "cancelled",
		}));
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!evento?.id) {
			toast.error("ID evento mancante");
			return;
		}

		// Validate required fields
		if (!formData.titolo.trim()) {
			toast.error("Il titolo è obbligatorio");
			return;
		}
		if (!formData.descrizione.trim()) {
			toast.error("La descrizione è obbligatoria");
			return;
		}
		if (!formData.dataInizio) {
			toast.error("La data di inizio è obbligatoria");
			return;
		}
		if (!formData.luoghi.some((luogo) => luogo.trim())) {
			toast.error("Almeno un luogo è obbligatorio");
			return;
		}
		if (!formData.etaMin || !formData.etaMax) {
			toast.error("Le età minima e massima sono obbligatorie");
			return;
		}
		if (!formData.postiDisponibili) {
			toast.error("Il numero di posti disponibili è obbligatorio");
			return;
		}

		try {
			const eventData = {
				id: evento.id,
				title: formData.titolo,
				description: formData.descrizione,
				startDate: formData.dataInizio.toISOString(),
				endDate: formData.dataFine?.toISOString(),
				locations: formData.luoghi.filter((luogo) => luogo.trim()),
				minAge: parseInt(formData.etaMin),
				maxAge: parseInt(formData.etaMax),
				maxParticipants: parseInt(formData.postiDisponibili),
				price: formData.prezzo || "0",
				imageUrl: formData.imageUrl || undefined,
				detailedDescription: formData.dettagliCompleti || undefined,
				willTakePhotos: formData.verrannoScattateFoto,
				status: formData.status,
				organizationId: formData.organizationId || undefined,
			};

			// Upload image if a new file is selected
			if (formData.immagine) {
				const uploadResult = await fileUpload.uploadFile(formData.immagine);
				eventData.imageUrl = uploadResult.url;
			} else if (!formData.imageUrl) {
				// If no file selected and no existing URL, explicitly set to undefined to remove image
				eventData.imageUrl = undefined;
			}

			await updateEventMutation.mutateAsync(eventData);

			toast.success("Evento aggiornato con successo!");
			onOpenChange(false);

			// Clean up preview URL if it's a blob URL
			if (formData.imageUrl?.startsWith("blob:")) {
				URL.revokeObjectURL(formData.imageUrl);
			}
		} catch (error) {
			console.error("Error updating event:", error);
			toast.error("Errore nell'aggiornamento dell'evento");
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-h-[98vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>
						{evento ? "Modifica evento" : "Crea nuovo evento"}
					</DialogTitle>
					<DialogDescription>
						{evento
							? "Modifica i dettagli dell'evento esistente."
							: "Inserisci i dettagli per creare un nuovo evento."}
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="space-y-4 mt-4">
					<Tabs defaultValue="informazioni" className="w-full">
						<TabsList className="grid w-full grid-cols-3">
							<TabsTrigger value="informazioni">Informazioni Base</TabsTrigger>
							<TabsTrigger value="dettagli">Dettagli Estesi</TabsTrigger>
							<TabsTrigger value="media">Media</TabsTrigger>
						</TabsList>

						<TabsContent value="informazioni" className="space-y-4 mt-4">
							<div className="space-y-2">
								<Label htmlFor="titolo">Titolo Evento *</Label>
								<Input
									id="titolo"
									value={formData.titolo}
									onChange={handleChange}
									placeholder="Inserisci il titolo dell'evento"
									required
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="descrizione">Descrizione *</Label>
								<RichTextEditor
									content={formData.descrizione}
									onChange={handleDescriptionChange}
									placeholder="Descrivi l'evento in dettaglio..."
									className="min-h-[200px]"
								/>
							</div>

							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label htmlFor="dataInizio">Data Inizio *</Label>
									<Popover>
										<PopoverTrigger asChild>
											<Button
												id="dataInizio"
												variant="outline"
												className={cn(
													"w-full justify-start text-left font-normal",
													!formData.dataInizio && "text-muted-foreground",
												)}
											>
												<CalendarIcon className="mr-2 h-4 w-4" />
												{formData.dataInizio ? (
													format(formData.dataInizio, "PPP", { locale: it })
												) : (
													<span>Seleziona data</span>
												)}
											</Button>
										</PopoverTrigger>
										<PopoverContent className="w-auto p-0">
											<Calendar
												mode="single"
												selected={formData.dataInizio || undefined}
												onSelect={(date: Date | undefined) =>
													handleDateChange("dataInizio", date)
												}
												initialFocus
											/>
										</PopoverContent>
									</Popover>
								</div>

								<div className="space-y-2">
									<Label htmlFor="dataFine">Data Fine *</Label>
									<Popover>
										<PopoverTrigger asChild>
											<Button
												id="dataFine"
												variant="outline"
												className={cn(
													"w-full justify-start text-left font-normal",
													!formData.dataFine && "text-muted-foreground",
												)}
											>
												<CalendarIcon className="mr-2 h-4 w-4" />
												{formData.dataFine ? (
													format(formData.dataFine, "PPP", { locale: it })
												) : (
													<span>Seleziona data</span>
												)}
											</Button>
										</PopoverTrigger>
										<PopoverContent className="w-auto p-0">
											<Calendar
												mode="single"
												selected={formData.dataFine || undefined}
												onSelect={(date: Date | undefined) =>
													handleDateChange("dataFine", date)
												}
												initialFocus
												disabled={(date: Date) =>
													formData.dataInizio
														? date < formData.dataInizio
														: false
												}
											/>
										</PopoverContent>
									</Popover>
								</div>
							</div>

							<div className="space-y-2">
								<Label>Luoghi dell'evento *</Label>
								{formData.luoghi.map((luogo, index) => (
									<div key={`luogo-${index}`} className="flex gap-2">
										<Input
											value={luogo}
											onChange={(e) => {
												const newLuoghi = [...formData.luoghi];
												newLuoghi[index] = e.target.value;
												setFormData((prev) => ({ ...prev, luoghi: newLuoghi }));
											}}
											placeholder={`Luogo ${index + 1}`}
											required={index === 0}
										/>
										{index > 0 && (
											<Button
												type="button"
												variant="outline"
												size="sm"
												onClick={() => {
													const newLuoghi = formData.luoghi.filter(
														(_, i) => i !== index,
													);
													setFormData((prev) => ({
														...prev,
														luoghi: newLuoghi,
													}));
												}}
											>
												Rimuovi
											</Button>
										)}
									</div>
								))}
								<Button
									type="button"
									variant="outline"
									size="sm"
									onClick={() => {
										setFormData((prev) => ({
											...prev,
											luoghi: [...prev.luoghi, ""],
										}));
									}}
								>
									Aggiungi luogo
								</Button>
							</div>

							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label htmlFor="etaMin">Età Minima *</Label>
									<Input
										id="etaMin"
										type="number"
										value={formData.etaMin}
										onChange={handleChange}
										placeholder="Es: 6"
										required
										min="0"
										max="18"
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="etaMax">Età Massima *</Label>
									<Input
										id="etaMax"
										type="number"
										value={formData.etaMax}
										onChange={handleChange}
										placeholder="Es: 12"
										required
										min="0"
										max="18"
									/>
								</div>
							</div>

							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label htmlFor="postiDisponibili">Posti Disponibili *</Label>
									<Input
										id="postiDisponibili"
										type="number"
										value={formData.postiDisponibili}
										onChange={handleChange}
										placeholder="Es: 20"
										required
										min="1"
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="prezzo">Prezzo (€)</Label>
									<Input
										id="prezzo"
										type="number"
										value={formData.prezzo}
										onChange={handleChange}
										placeholder="Es: 15.00"
										step="0.01"
										min="0"
									/>
								</div>
							</div>

							<div className="space-y-2">
								<Label htmlFor="status">Stato *</Label>
								<Select
									value={formData.status}
									onValueChange={handleSelectChange}
								>
									<SelectTrigger id="status">
										<SelectValue placeholder="Seleziona stato" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="draft">Bozza</SelectItem>
										<SelectItem value="open">Aperto</SelectItem>
										<SelectItem value="closed">Chiuso</SelectItem>
										<SelectItem value="full">Completo</SelectItem>
										<SelectItem value="cancelled">Cancellato</SelectItem>
									</SelectContent>
								</Select>
							</div>

							<div className="space-y-2">
								<Label htmlFor="organizationId">Organizzazione</Label>
								<Select
									value={formData.organizationId || "none"}
									onValueChange={(value) =>
										setFormData((prev) => ({
											...prev,
											organizationId: value === "none" ? "" : value,
										}))
									}
								>
									<SelectTrigger>
										<SelectValue placeholder="Seleziona un'organizzazione (opzionale)" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="none">Nessuna organizzazione</SelectItem>
										{organizationsLoading ? (
											<SelectItem value="loading" disabled>
												<div className="flex items-center gap-2">
													<Loader2 className="h-4 w-4 animate-spin" />
													Caricamento...
												</div>
											</SelectItem>
										) : (
											organizations?.map((org) => (
												<SelectItem key={org.id} value={org.id}>
													{org.name}
												</SelectItem>
											))
										)}
									</SelectContent>
								</Select>
							</div>
						</TabsContent>

						<TabsContent value="dettagli" className="space-y-4">
							<div className="space-y-4">
								<div>
									<Label htmlFor="dettagliCompleti">
										Descrizione Dettagliata
									</Label>
									<RichTextEditor
										content={formData.dettagliCompleti}
										onChange={handleDetailedDescriptionChange}
										placeholder="Descrizione completa e dettagliata dell'evento..."
										className="min-h-[120px]"
									/>
								</div>

								<div className="space-y-3">
									<h4 className="font-medium">Gestione Foto</h4>
									<label className="flex items-center space-x-2">
										<input
											type="checkbox"
											checked={formData.verrannoScattateFoto}
											onChange={(e) =>
												setFormData((prev) => ({
													...prev,
													verrannoScattateFoto: e.target.checked,
												}))
											}
											className="rounded"
										/>
										<span>
											Verranno scattate foto durante l'evento (saranno usate sui
											social della parrocchia)
										</span>
									</label>
									<p className="text-sm text-muted-foreground">
										I genitori possono scegliere se accettare o meno la
										liberatoria foto durante l'iscrizione, ma l'accettazione non
										è obbligatoria per partecipare all'evento.
									</p>
								</div>
							</div>
						</TabsContent>

						<TabsContent value="media" className="space-y-4">
							<div className="space-y-4">
								<div className="space-y-2">
									<Label>Immagine Evento Principale</Label>
									<FileUpload
										onFileSelect={handleFileSelect}
										onFileRemove={handleFileRemove}
										accept="image/*"
										maxSize={5 * 1024 * 1024} // 5MB
										value={formData.immagine || formData.imageUrl}
										placeholder="Trascina qui un'immagine o clicca per caricarla"
										showPreview={true}
										disabled={
											updateEventMutation.isPending || fileUpload.isUploading
										}
										uploadProgress={fileUpload.uploadProgress}
										isUploading={fileUpload.isUploading}
										onValidationError={(error) => toast.error(error)}
									/>
								</div>
								{fileUpload.isError && (
									<p className="text-sm text-destructive">
										{fileUpload.error?.message ||
											"Errore durante il caricamento"}
									</p>
								)}
							</div>
						</TabsContent>
					</Tabs>

					<DialogFooter className="mt-6">
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
							disabled={updateEventMutation.isPending}
						>
							Annulla
						</Button>
						<Button
							type="submit"
							disabled={updateEventMutation.isPending || fileUpload.isUploading}
						>
							{updateEventMutation.isPending || fileUpload.isUploading ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									{fileUpload.isUploading ? "Caricamento..." : "Salvando..."}
								</>
							) : (
								"Salva Modifiche"
							)}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
