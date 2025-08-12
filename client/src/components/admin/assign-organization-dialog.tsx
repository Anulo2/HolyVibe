"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useAssignEventToOrganizationMutation } from "@/hooks/useEventsQuery";
import { useOrganizationsQuery } from "@/hooks/useSettings";

interface AssignOrganizationDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	event: {
		id: string;
		title: string;
		organization?: {
			id: string;
			name: string;
		};
	} | null;
}

export function AssignOrganizationDialog({
	open,
	onOpenChange,
	event,
}: AssignOrganizationDialogProps) {
	const [selectedOrganizationId, setSelectedOrganizationId] = useState<
		string | null
	>(null);

	const { data: organizations, isLoading: organizationsLoading } =
		useOrganizationsQuery();
	const assignMutation = useAssignEventToOrganizationMutation();

	// Reset selection when dialog opens/closes or event changes
	useEffect(() => {
		if (open && event) {
			setSelectedOrganizationId(event.organization?.id || null);
		}
	}, [open, event]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!event) return;

		try {
			await assignMutation.mutateAsync({
				eventId: event.id,
				organizationId: selectedOrganizationId,
			});

			toast.success("Organizzazione assegnata con successo!");
			onOpenChange(false);
		} catch (error) {
			console.error("Error assigning organization:", error);
			toast.error("Errore durante l'assegnazione dell'organizzazione");
		}
	};

	if (!event) return null;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Assegna Organizzazione</DialogTitle>
					<DialogDescription>
						Assegna l'evento "{event.title}" a un'organizzazione specifica.
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="organization">Organizzazione</Label>
						<Select
							value={selectedOrganizationId || "none"}
							onValueChange={(value) =>
								setSelectedOrganizationId(value === "none" ? null : value)
							}
						>
							<SelectTrigger>
								<SelectValue placeholder="Seleziona un'organizzazione" />
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

					{event.organization && (
						<div className="rounded-md bg-blue-50 p-3 text-sm">
							<p className="text-blue-800">
								<strong>Organizzazione attuale:</strong>{" "}
								{event.organization.name}
							</p>
						</div>
					)}

					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
							disabled={assignMutation.isPending}
						>
							Annulla
						</Button>
						<Button type="submit" disabled={assignMutation.isPending}>
							{assignMutation.isPending ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Assegnando...
								</>
							) : (
								"Assegna"
							)}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
