import { Heart, UserPlus, Users } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface Family {
	id: string;
	name: string;
	description?: string;
}

interface CreaFamigliaDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onCreateFamily: (data: {
		name: string;
		description?: string;
	}) => Promise<void>;
	family?: Family;
	onUpdateFamily?: (data: {
		id: string;
		name: string;
		description?: string;
	}) => Promise<void>;
}

export function CreaFamigliaDialog({
	open,
	onOpenChange,
	onCreateFamily,
	family,
	onUpdateFamily,
}: CreaFamigliaDialogProps) {
	const [formData, setFormData] = useState({
		name: family?.name || "",
		description: family?.description || "",
	});
	const [isSubmitting, setIsSubmitting] = useState(false);

	const isEditing = !!family;

	const handleChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
	) => {
		const { id, value } = e.target;
		setFormData((prev) => ({ ...prev, [id]: value }));
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!formData.name.trim()) {
			toast.error("Inserisci un nome per la famiglia");
			return;
		}

		setIsSubmitting(true);

		try {
			if (isEditing && onUpdateFamily && family) {
				await onUpdateFamily({
					id: family.id,
					name: formData.name.trim(),
					description: formData.description.trim() || undefined,
				});
				toast.success(`Famiglia "${formData.name}" modificata con successo! 🎉`);
			} else {
				await onCreateFamily({
					name: formData.name.trim(),
					description: formData.description.trim() || undefined,
				});
				toast.success(`Famiglia "${formData.name}" creata con successo! 🎉`);
			}

			// Reset del form e chiusura del dialog
			setFormData({ name: "", description: "" });
			onOpenChange(false);
		} catch (error) {
			console.error("Error with family:", error);
			toast.error(
				`Si è verificato un errore durante la ${isEditing ? 'modifica' : 'creazione'} della famiglia. Riprova più tardi.`,
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleCancel = () => {
		setFormData({ name: "", description: "" });
		onOpenChange(false);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[600px]">
				<DialogHeader className="text-center space-y-3">
					<div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
						<Heart className="h-6 w-6 text-primary" />
					</div>
					<DialogTitle className="text-2xl">
						{isEditing ? "Modifica famiglia" : "Crea una nuova famiglia"}
					</DialogTitle>
					<DialogDescription className="text-base">
						{isEditing 
							? "Modifica i dati della famiglia. Le modifiche saranno salvate automaticamente."
							: "Stai per creare una nuova famiglia. Potrai aggiungere membri, bambini e gestire le informazioni della tua famiglia per partecipare agli eventi della parrocchia."
						}
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="space-y-6 mt-6">
					{/* Nome famiglia */}
					<div className="space-y-2">
						<Label htmlFor="name" className="text-base font-medium">
							Nome della famiglia *
						</Label>
						<div className="relative">
							<Users className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
							<Input
								id="name"
								type="text"
								value={formData.name}
								onChange={handleChange}
								placeholder="es. Famiglia Rossi"
								className="pl-10 h-11"
								required
							/>
						</div>
						<p className="text-sm text-muted-foreground">
							Scegli un nome che identifichi chiaramente la tua famiglia
						</p>
					</div>

					{/* Descrizione */}
					<div className="space-y-2">
						<Label htmlFor="description" className="text-base font-medium">
							Descrizione (opzionale)
						</Label>
						<Textarea
							id="description"
							value={formData.description}
							onChange={handleChange}
							placeholder="Una breve descrizione della famiglia..."
							rows={3}
							className="resize-none"
						/>
						<p className="text-sm text-muted-foreground">
							Aggiungi una descrizione per personalizzare la tua famiglia
						</p>
					</div>

					{/* Info card */}
					<Card className="border-blue-200 bg-blue-50/50">
						<CardHeader className="pb-3">
							<CardTitle className="text-base flex items-center gap-2">
								<UserPlus className="h-4 w-4" />
								Cosa succede dopo?
							</CardTitle>
						</CardHeader>
						<CardContent className="pt-0">
							<ul className="space-y-2 text-sm text-muted-foreground">
								<li className="flex items-start gap-2">
									<span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600 mt-0.5">
										1
									</span>
									Potrai aggiungere bambini alla famiglia
								</li>
								<li className="flex items-start gap-2">
									<span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600 mt-0.5">
										2
									</span>
									Invitare altri genitori a unirsi
								</li>
								<li className="flex items-start gap-2">
									<span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600 mt-0.5">
										3
									</span>
									Iscrivere i bambini agli eventi della parrocchia
								</li>
							</ul>
						</CardContent>
					</Card>

					<DialogFooter className="gap-3 pt-4">
						<Button
							type="button"
							variant="outline"
							onClick={handleCancel}
							disabled={isSubmitting}
							className="flex-1 sm:flex-none"
						>
							Annulla
						</Button>
						<Button
							type="submit"
							disabled={isSubmitting || !formData.name.trim()}
							className="flex-1 sm:flex-none"
						>
							{isSubmitting ? (
								<>
									<div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent mr-2" />
									Creazione...
								</>
							) : (
								<>
									<Heart className="h-4 w-4 mr-2" />
									{isEditing ? "Salva Modifiche" : "Crea Famiglia"}
								</>
							)}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
