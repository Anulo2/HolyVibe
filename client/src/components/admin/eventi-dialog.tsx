"use client";

import { format } from "date-fns";
import { it } from "date-fns/locale";
import { CalendarIcon, Loader2, Upload } from "lucide-react";
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
import { useUpdateEventMutation } from "@/hooks/useEventsQuery";
import { useFileUpload } from "@/hooks/useFileUpload";
import { cn } from "@/lib/utils";

interface EventiDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	evento?: any;
}

export function EventiDialog({
	open,
	onOpenChange,
	evento,
}: EventiDialogProps) {
	const [formData, setFormData] = useState({
		title: "",
		description: "",
		detailedDescription: "",
		startDate: null as Date | null,
		endDate: null as Date | null,
		location: "",
		minAge: "",
		maxAge: "",
		maxParticipants: "",
		price: "",
		status: "draft",
		imageUrl: "",
		imageFile: null as File | null,
		willTakePhotos: false,
		photosForSocialMedia: false,
	});

	const updateEventMutation = useUpdateEventMutation();
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

	useEffect(() => {
		if (evento && open) {
			// Populate form with existing event data
			setFormData({
				title: evento.title || "",
				description: evento.description || "",
				detailedDescription: evento.detailedDescription || "",
				startDate: evento.startDate ? new Date(evento.startDate) : null,
				endDate: evento.endDate ? new Date(evento.endDate) : null,
				location: evento.location || "",
				minAge: evento.minAge?.toString() || "",
				maxAge: evento.maxAge?.toString() || "",
				maxParticipants: evento.maxParticipants?.toString() || "",
				price: evento.price || "",
				status: evento.status || "draft",
				imageUrl: evento.imageUrl || "",
				imageFile: null,
				willTakePhotos: evento.willTakePhotos || false,
				photosForSocialMedia: evento.photosForSocialMedia || false,
			});
		} else if (!evento && open) {
			// Reset form for new event (though this dialog is primarily for editing)
			setFormData({
				title: "",
				description: "",
				detailedDescription: "",
				startDate: null,
				endDate: null,
				location: "",
				minAge: "",
				maxAge: "",
				maxParticipants: "",
				price: "",
				status: "draft",
				imageUrl: "",
				imageFile: null,
				willTakePhotos: false,
				photosForSocialMedia: false,
			});
		}
	}, [evento, open]);

	const handleChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
	) => {
		const { id, value } = e.target;
		setFormData((prev) => ({ ...prev, [id]: value }));
	};

	const handleDescriptionChange = (content: string) => {
		setFormData((prev) => ({ ...prev, description: content }));
	};

	const handleDetailedDescriptionChange = (content: string) => {
		setFormData((prev) => ({ ...prev, detailedDescription: content }));
	};

	const handleSelectChange = (value: string) => {
		setFormData((prev) => ({ ...prev, status: value }));
	};

	const handleFileSelect = (file: File) => {
		setFormData((prev) => ({
			...prev,
			imageFile: file,
			imageUrl: "", // Will be set after upload
		}));
	};

	const handleFileRemove = () => {
		setFormData((prev) => ({
			...prev,
			imageFile: null,
			imageUrl: "",
		}));
		fileUpload.reset();
	};

	const handleDateChange = (field: string, date: Date | null) => {
		setFormData((prev) => ({ ...prev, [field]: date }));
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!evento?.id) {
			toast.error("ID evento mancante");
			return;
		}

		try {
			const updateData = {
				id: evento.id,
				title: formData.title || undefined,
				description: formData.description || undefined,
				detailedDescription: formData.detailedDescription || undefined,
				startDate: formData.startDate?.toISOString(),
				endDate: formData.endDate ? formData.endDate.toISOString() : null,
				location: formData.location || undefined,
				minAge: formData.minAge ? Number(formData.minAge) : undefined,
				maxAge: formData.maxAge ? Number(formData.maxAge) : undefined,
				maxParticipants: formData.maxParticipants
					? Number(formData.maxParticipants)
					: undefined,
				price: formData.price || undefined,
				status: formData.status as any,
				imageFile: formData.imageFile || undefined,
				imageUrl: formData.imageFile
					? undefined
					: formData.imageUrl || undefined,
				willTakePhotos: formData.willTakePhotos,
				photosForSocialMedia: formData.photosForSocialMedia,
			};

			await updateEventMutation.mutateAsync(updateData);

			toast.success("Evento aggiornato con successo!");
			onOpenChange(false);
		} catch (error) {
			console.error("Error updating event:", error);

			if (error instanceof Error) {
				// More specific error messages
				if (error.message.includes("validation")) {
					toast.error("Errore di validazione: verifica i dati inseriti");
				} else if (error.message.includes("file")) {
					toast.error("Errore nel caricamento del file");
				} else {
					toast.error(`Errore nell'aggiornamento: ${error.message}`);
				}
			} else {
				toast.error("Errore nell'aggiornamento dell'evento");
			}
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
					<div className="space-y-2">
						<Label htmlFor="title">Titolo evento *</Label>
						<Input
							id="title"
							value={formData.title}
							onChange={handleChange}
							placeholder="Inserisci il titolo dell'evento"
							required
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="description">Descrizione Breve *</Label>
						<RichTextEditor
							content={formData.description}
							onChange={handleDescriptionChange}
							placeholder="Descrizione breve che appare nelle anteprime..."
							className="min-h-[100px]"
						/>
						<p className="text-xs text-muted-foreground">
							Questa descrizione appare nelle card e nelle anteprime degli
							eventi
						</p>
					</div>

					<div className="space-y-2">
						<Label htmlFor="detailedDescription">Descrizione Dettagliata</Label>
						<RichTextEditor
							content={formData.detailedDescription}
							onChange={handleDetailedDescriptionChange}
							placeholder="Descrizione completa e dettagliata dell'evento..."
							className="min-h-[200px]"
						/>
						<p className="text-xs text-muted-foreground">
							Questa descrizione estesa appare solo quando si aprono i dettagli
							completi dell'evento
						</p>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="startDate">Data inizio *</Label>
							<Popover>
								<PopoverTrigger asChild>
									<Button
										id="startDate"
										variant="outline"
										className={cn(
											"w-full justify-start text-left font-normal",
											!formData.startDate && "text-muted-foreground",
										)}
									>
										<CalendarIcon className="mr-2 h-4 w-4" />
										{formData.startDate ? (
											format(formData.startDate, "PPP", { locale: it })
										) : (
											<span>Seleziona data</span>
										)}
									</Button>
								</PopoverTrigger>
								<PopoverContent className="w-auto p-0">
									<Calendar
										mode="single"
										selected={formData.startDate || undefined}
										onSelect={(date) =>
											handleDateChange("startDate", date || null)
										}
										initialFocus
									/>
								</PopoverContent>
							</Popover>
						</div>

						<div className="space-y-2">
							<Label htmlFor="endDate">Data fine</Label>
							<Popover>
								<PopoverTrigger asChild>
									<Button
										id="endDate"
										variant="outline"
										className={cn(
											"w-full justify-start text-left font-normal",
											!formData.endDate && "text-muted-foreground",
										)}
									>
										<CalendarIcon className="mr-2 h-4 w-4" />
										{formData.endDate ? (
											format(formData.endDate, "PPP", { locale: it })
										) : (
											<span>Seleziona data</span>
										)}
									</Button>
								</PopoverTrigger>
								<PopoverContent className="w-auto p-0">
									<Calendar
										mode="single"
										selected={formData.endDate || undefined}
										onSelect={(date) =>
											handleDateChange("endDate", date || null)
										}
										initialFocus
										disabled={(date) =>
											formData.startDate ? date < formData.startDate : false
										}
									/>
								</PopoverContent>
							</Popover>
						</div>
					</div>

					<div className="space-y-2">
						<Label htmlFor="location">Luogo *</Label>
						<Input
							id="location"
							value={formData.location}
							onChange={handleChange}
							placeholder="Inserisci il luogo dell'evento"
							required
						/>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						<div className="space-y-2">
							<Label htmlFor="minAge">Età minima *</Label>
							<Input
								id="minAge"
								type="number"
								min="6"
								max="100"
								value={formData.minAge}
								onChange={handleChange}
								placeholder="Età"
								required
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="maxAge">Età massima *</Label>
							<Input
								id="maxAge"
								type="number"
								min="6"
								max="100"
								value={formData.maxAge}
								onChange={handleChange}
								placeholder="Età"
								required
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="maxParticipants">Posti disponibili *</Label>
							<Input
								id="maxParticipants"
								type="number"
								min="1"
								value={formData.maxParticipants}
								onChange={handleChange}
								placeholder="Numero posti"
								required
							/>
						</div>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="price">Prezzo (€)</Label>
							<Input
								id="price"
								type="number"
								min="0"
								step="0.01"
								value={formData.price}
								onChange={handleChange}
								placeholder="0.00"
							/>
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
					</div>

					<div className="space-y-2">
						<Label>Immagine Evento</Label>
						<FileUpload
							onFileSelect={handleFileSelect}
							onFileRemove={handleFileRemove}
							accept="image/*"
							maxSize={5 * 1024 * 1024} // 5MB
							value={formData.imageFile || formData.imageUrl}
							placeholder="Trascina qui un'immagine o clicca per caricarla"
							showPreview={true}
							disabled={updateEventMutation.isPending || fileUpload.isUploading}
							uploadProgress={fileUpload.uploadProgress}
							isUploading={fileUpload.isUploading}
							onValidationError={(error) => toast.error(error)}
						/>
						{fileUpload.isError && (
							<p className="text-sm text-destructive">
								{fileUpload.error?.message || "Errore durante il caricamento"}
							</p>
						)}
					</div>

					<div className="space-y-3 border-t pt-4">
						<h4 className="text-sm font-medium">Gestione Foto</h4>

						<div>
							<label className="flex items-center space-x-2">
								<input
									type="checkbox"
									checked={formData.willTakePhotos}
									onChange={(e) =>
										setFormData((prev) => ({
											...prev,
											willTakePhotos: e.target.checked,
											photosForSocialMedia: e.target.checked ? prev.photosForSocialMedia : false,
										}))
									}
									className="rounded"
								/>
								<span className="text-sm">
									Saranno scattate foto durante l'evento
								</span>
							</label>
						</div>

						<div>
							<label className="flex items-center space-x-2">
								<input
									type="checkbox"
									checked={formData.photosForSocialMedia}
									onChange={(e) =>
										setFormData((prev) => ({
											...prev,
											photosForSocialMedia: e.target.checked,
										}))
									}
									className="rounded"
									disabled={!formData.willTakePhotos}
								/>
								<span className={`text-sm ${!formData.willTakePhotos ? "text-gray-400" : ""}`}>
									Le foto verranno usate per i canali social della parrocchia
								</span>
							</label>
						</div>
					</div>

					<DialogFooter className="mt-6">
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
							disabled={updateEventMutation.isPending || fileUpload.isUploading}
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
