"use client";

import { useQueries } from "@tanstack/react-query";
import {
	AlertCircle,
	CalendarDays,
	Loader2,
	MapPin,
	Users,
} from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFamiliesQuery } from "@/hooks/useFamilyQuery";
import { useCreateRegistrationMutation } from "@/hooks/useRegistrationsQuery";
import { orpc } from "@/lib/orpc-react";

interface IscrizioneFiglioDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	evento: any;
}

export function IscrizioneFiglioDialog({
	open,
	onOpenChange,
	evento,
}: IscrizioneFiglioDialogProps) {
	const [figlioSelezionato, setFiglioSelezionato] = useState<string | null>(
		null,
	);
	const [personeAutorizzate, setPersoneAutorizzate] = useState<string[]>([]);
	const [accettaTermini, setAccettaTermini] = useState(false);

	// Load real family data
	const { data: families = [], isLoading: familiesLoading } =
		useFamiliesQuery();

	// Mutation for creating registration
	const createRegistrationMutation = useCreateRegistrationMutation();

	// Load children from ALL families
	const childrenQueries = useQueries({
		queries: families.map((family) => ({
			queryKey: ["family", family.id, "children"],
			queryFn: () => orpc.family.getChildren({ familyId: family.id }),
			enabled: !!family.id,
		})),
	});

	// Load authorized persons from ALL families
	const personsQueries = useQueries({
		queries: families.map((family) => ({
			queryKey: ["family", family.id, "authorizedPersons"],
			queryFn: () => orpc.family.getAuthorizedPersons({ familyId: family.id }),
			enabled: !!family.id,
		})),
	});

	// Combine all children from all families with family info
	const allChildren = childrenQueries
		.filter((query) => query.data?.success)
		.flatMap((query, index) => {
			const family = families[index];
			return (query.data?.data || []).map((child) => ({
				...child,
				familyName: family?.name || "Famiglia sconosciuta",
			}));
		});

	// Combine all authorized persons from all families with family info
	const allAuthorizedPersons = personsQueries
		.filter((query) => query.data?.success)
		.flatMap((query, index) => {
			const family = families[index];
			return (query.data?.data || []).map((person) => ({
				...person,
				familyName: family?.name || "Famiglia sconosciuta",
			}));
		});

	// Check if any query is loading
	const childrenLoading = childrenQueries.some((query) => query.isLoading);
	const personsLoading = personsQueries.some((query) => query.isLoading);

	// Reset del form quando si apre il dialog
	useEffect(() => {
		if (open) {
			setFiglioSelezionato(null);
			setPersoneAutorizzate([]);
			setAccettaTermini(false);
		}
	}, [open]);

	// Calculate age for children
	const calculateAge = (birthDate: string) => {
		const today = new Date();
		const birth = new Date(birthDate);
		let age = today.getFullYear() - birth.getFullYear();
		const monthDiff = today.getMonth() - birth.getMonth();
		if (
			monthDiff < 0 ||
			(monthDiff === 0 && today.getDate() < birth.getDate())
		) {
			age--;
		}
		return age;
	};

	// Check if child is eligible for the event
	const isChildEligible = (birthDate: string) => {
		const age = calculateAge(birthDate);
		return age >= (evento?.minAge || 0) && age <= (evento?.maxAge || 100);
	};

	const handlePersonaChange = (personaId: string) => {
		setPersoneAutorizzate((current) =>
			current.includes(personaId)
				? current.filter((id) => id !== personaId)
				: [...current, personaId],
		);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!figlioSelezionato) {
			toast.error("Seleziona un figlio da iscrivere");
			return;
		}

		if (!accettaTermini) {
			toast.error("Devi accettare i termini per procedere");
			return;
		}

		try {
			await createRegistrationMutation.mutateAsync({
				eventId: evento.id,
				childId: figlioSelezionato,
				authorizedPersonIds:
					personeAutorizzate.length > 0 ? personeAutorizzate : undefined,
			});

			toast.success("Iscrizione completata con successo!");
			onOpenChange(false);
		} catch (error) {
			console.error("Registration error:", error);
			toast.error("Errore durante l'iscrizione. Riprova.");
		}
	};

	if (!evento) return null;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>Iscrivi tuo figlio a {evento.title}</DialogTitle>
					<DialogDescription>
						Compila il modulo per iscrivere tuo figlio all'evento
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="space-y-6 mt-4">
					<div className="space-y-2">
						<div className="rounded-lg border p-4 space-y-3">
							<div className="flex items-center gap-2">
								<CalendarDays className="h-4 w-4 text-muted-foreground" />
								<span>
									{new Date(evento.startDate).toLocaleDateString("it-IT")}
									{evento.endDate &&
										evento.endDate !== evento.startDate &&
										` - ${new Date(evento.endDate).toLocaleDateString("it-IT")}`}
								</span>
							</div>
							<div className="flex items-center gap-2">
								<MapPin className="h-4 w-4 text-muted-foreground" />
								<span>{evento.location}</span>
							</div>
							<div className="flex items-center gap-2">
								<Users className="h-4 w-4 text-muted-foreground" />
								<span>
									Età: {evento.minAge}-{evento.maxAge} anni
								</span>
							</div>
						</div>
					</div>

					<Tabs defaultValue="figlio" className="w-full">
						<TabsList className="grid w-full grid-cols-2">
							<TabsTrigger value="figlio">Seleziona Figlio</TabsTrigger>
							<TabsTrigger value="autorizzati">Persone Autorizzate</TabsTrigger>
						</TabsList>

						<TabsContent value="figlio" className="space-y-4 mt-4">
							<div className="space-y-2">
								<div className="flex items-center justify-between">
									<Label>Seleziona il figlio da iscrivere *</Label>
									{families.length > 1 && (
										<span className="text-xs text-muted-foreground">
											{allChildren.length} figli da {families.length} famiglie
										</span>
									)}
								</div>
								{childrenLoading ? (
									<div className="flex items-center justify-center p-4">
										<Loader2 className="h-6 w-6 animate-spin" />
									</div>
								) : (
									<div className="space-y-2">
										{allChildren.map((figlio) => {
											const age = calculateAge(figlio.birthDate);
											const eligible = isChildEligible(figlio.birthDate);
											const fullName = `${figlio.firstName} ${figlio.lastName}`;
											return (
												<div
													key={figlio.id}
													className={`flex items-center gap-3 p-3 rounded-lg border ${
														eligible
															? "cursor-pointer"
															: "opacity-50 cursor-not-allowed"
													} ${
														figlioSelezionato === figlio.id
															? "border-primary bg-primary/5"
															: ""
													}`}
													onClick={() =>
														eligible && setFiglioSelezionato(figlio.id)
													}
												>
													<Avatar>
														<AvatarImage
															src={figlio.avatarUrl}
															alt={fullName}
														/>
														<AvatarFallback>
															{figlio.firstName.charAt(0)}
														</AvatarFallback>
													</Avatar>
													<div className="flex-1">
														<p className="font-medium">{fullName}</p>
														<p className="text-sm text-muted-foreground">
															{age} anni • {figlio.familyName}
															{!eligible && " - Non idoneo per questo evento"}
														</p>
													</div>
													{eligible && (
														<div className="ml-auto">
															<div
																className={`size-5 rounded-full border-2 ${
																	figlioSelezionato === figlio.id
																		? "border-primary bg-primary"
																		: "border-muted"
																}`}
															/>
														</div>
													)}
												</div>
											);
										})}
									</div>
								)}
								{allChildren.length === 0 && !childrenLoading && (
									<div className="text-center p-4">
										<p>Non hai ancora aggiunto figli alla tua famiglia</p>
										<Button variant="link" className="mt-2">
											Aggiungi un figlio
										</Button>
									</div>
								)}
							</div>
						</TabsContent>

						<TabsContent value="autorizzati" className="space-y-4 mt-4">
							<div className="space-y-2">
								<div className="flex items-center justify-between">
									<Label>Persone autorizzate a ritirare il bambino</Label>
									<div className="flex items-center gap-2">
										{families.length > 1 && allAuthorizedPersons.length > 0 && (
											<span className="text-xs text-muted-foreground">
												{allAuthorizedPersons.length} persone
											</span>
										)}
										<span className="text-xs text-muted-foreground">
											(Opzionale)
										</span>
									</div>
								</div>
								{personsLoading ? (
									<div className="flex items-center justify-center p-4">
										<Loader2 className="h-6 w-6 animate-spin" />
									</div>
								) : (
									<div className="space-y-2">
										{allAuthorizedPersons.map((persona) => (
											<div
												key={persona.id}
												className="flex items-center gap-3 p-3 rounded-lg border"
											>
												<Checkbox
													id={`persona-${persona.id}`}
													checked={personeAutorizzate.includes(persona.id)}
													onCheckedChange={() =>
														handlePersonaChange(persona.id)
													}
												/>
												<Label
													htmlFor={`persona-${persona.id}`}
													className="flex items-center gap-3 cursor-pointer flex-1"
												>
													<Avatar>
														<AvatarImage
															src={persona.avatarUrl}
															alt={persona.fullName}
														/>
														<AvatarFallback>
															{persona.fullName.charAt(0)}
														</AvatarFallback>
													</Avatar>
													<div>
														<p className="font-medium">{persona.fullName}</p>
														<p className="text-sm text-muted-foreground">
															{persona.relationship} • {persona.familyName}
														</p>
													</div>
												</Label>
											</div>
										))}
									</div>
								)}
								{allAuthorizedPersons.length === 0 && !personsLoading && (
									<div className="text-center p-4">
										<p>Non hai ancora aggiunto persone autorizzate</p>
										<Button variant="link" className="mt-2">
											Aggiungi una persona autorizzata
										</Button>
									</div>
								)}
								<div className="mt-2 rounded-md bg-amber-50 p-3 text-sm flex gap-2">
									<AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0" />
									<p className="text-amber-800">
										Se non selezioni nessuna persona, solo i genitori saranno
										autorizzati a ritirare il bambino.
									</p>
								</div>
							</div>
						</TabsContent>
					</Tabs>

					<div className="space-y-2 border-t pt-4">
						<div className="flex items-center space-x-2">
							<Checkbox
								id="termini"
								checked={accettaTermini}
								onCheckedChange={(checked) =>
									setAccettaTermini(checked === true)
								}
								required
							/>
							<Label htmlFor="termini" className="text-sm">
								Accetto i termini e le condizioni dell'evento, incluse le
								politiche di cancellazione e rimborso *
							</Label>
						</div>
					</div>

					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
							disabled={createRegistrationMutation.isPending}
						>
							Annulla
						</Button>
						<Button
							type="submit"
							disabled={
								!figlioSelezionato ||
								!accettaTermini ||
								createRegistrationMutation.isPending
							}
						>
							{createRegistrationMutation.isPending ? (
								<>
									<Loader2 className="h-4 w-4 animate-spin mr-2" />
									Iscrivendo...
								</>
							) : (
								"Conferma Iscrizione"
							)}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
