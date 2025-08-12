"use client";

import { format } from "date-fns";
import { it } from "date-fns/locale";
import { CalendarIcon, Loader2 } from "lucide-react";
import type React from "react";
import { useState } from "react";
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
	DialogTrigger,
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
import { useCreateEventMutation } from "@/hooks/useEventsQuery";
import { useFileUpload } from "@/hooks/useFileUpload";
import { useOrganizationsQuery } from "@/hooks/useSettings";
import { cn } from "@/lib/utils";

export function AdminCreaEventoDialog({
	children,
}: {
	children: React.ReactNode;
}) {
	const [open, setOpen] = useState(false);
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
		// Extended information fields
		dettagliCompleti: "",
		verrannoScattateFoto: false,
		immaginiAggiuntive: "",
		organizationId: "",
	});

	const createEventMutation = useCreateEventMutation();
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
		showToasts: false, // We'll handle toasts ourselves
	});

	const handleChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
	) => {
		const { id, value } = e.target;
		setFormData((prev) => ({ ...prev, [id]: value }));
	};

	const handleFileSelect = (file: File) => {
		setFormData((prev) => ({
			...prev,
			immagine: file,
			imageUrl: "", // Will be set after upload
		}));
	};

	const handleFileRemove = () => {
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

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

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
				// Extended information fields
				detailedDescription: formData.dettagliCompleti || undefined,
				willTakePhotos: formData.verrannoScattateFoto,
				additionalImages: formData.immaginiAggiuntive || undefined,
				organizationId: formData.organizationId || undefined,
			};

			// Upload image if selected
			if (formData.immagine && !formData.imageUrl) {
				const uploadResult = await fileUpload.uploadFile(formData.immagine);
				eventData.imageUrl = uploadResult.url;
			}

			await createEventMutation.mutateAsync(eventData);

			toast.success("Evento creato con successo!");
			setOpen(false);

			// Clean up preview URL
			if (formData.imageUrl && formData.immagine) {
				URL.revokeObjectURL(formData.imageUrl);
			}

			// Reset form
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
				// Extended information fields
				dettagliCompleti: "",
				verrannoScattateFoto: false,
				immaginiAggiuntive: "",
				organizationId: "",
			});
		} catch (error) {
			console.error("Errore durante la creazione dell'evento:", error);
			toast.error("Errore durante la creazione dell'evento");
		}
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>{children}</DialogTrigger>
			<DialogContent className="max-h-[98vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>Crea Nuovo Evento</DialogTitle>
					<DialogDescription>
						Inserisci i dettagli per creare un nuovo evento. Tutti i campi
						contrassegnati con * sono obbligatori.
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
												Caricamento...
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
						</TabsContent>

						<TabsContent value="dettagli" className="space-y-4">
							<div className="space-y-4">
								<div>
									<Label htmlFor="dettagliCompleti">
										Descrizione Dettagliata
									</Label>
									<RichTextEditor
										content={formData.dettagliCompleti}
										onChange={(content) =>
											setFormData((prev) => ({
												...prev,
												dettagliCompleti: content,
											}))
										}
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
											createEventMutation.isPending || fileUpload.isUploading
										}
										uploadProgress={fileUpload.uploadProgress}
										isUploading={fileUpload.isUploading}
										onValidationError={(error) => toast.error(error)}
									/>
								</div>

								<div className="space-y-2">
									<Label htmlFor="immaginiAggiuntive">
										URL Immagini Aggiuntive (JSON)
									</Label>
									<textarea
										id="immaginiAggiuntive"
										value={formData.immaginiAggiuntive}
										onChange={handleChange}
										className="w-full px-3 py-2 border rounded-md min-h-[80px]"
										placeholder='["https://esempio1.jpg", "https://esempio2.jpg"]'
									/>
									<p className="text-sm text-muted-foreground">
										Inserisci un array JSON di URL immagini aggiuntive per la
										galleria dell'evento
									</p>
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
							onClick={() => setOpen(false)}
							disabled={createEventMutation.isPending}
						>
							Annulla
						</Button>
						<Button
							type="submit"
							disabled={createEventMutation.isPending || fileUpload.isUploading}
						>
							{createEventMutation.isPending || fileUpload.isUploading ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									{fileUpload.isUploading ? "Caricamento..." : "Creazione..."}
								</>
							) : (
								"Crea Evento"
							)}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
