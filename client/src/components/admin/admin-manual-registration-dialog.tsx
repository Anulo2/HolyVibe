import { format } from "date-fns";
import { it } from "date-fns/locale";
import { AlertCircle, CalendarIcon, Loader2, Plus, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useAllAuthorizedPersons } from "@/hooks/useAllAuthorizedPersons";
import { useEventsQuery } from "@/hooks/useEventsQuery";
import { useFamiliesQuery } from "@/hooks/useFamilyQuery";
import { useAdminCreateRegistrationMutation } from "@/hooks/useRegistrationsQuery";
import { cn } from "@/lib/utils";
import type { AuthorizedPersonWithFamily } from "@/types/authorized-person";

interface AdminManualRegistrationDialogProps {
	eventId?: string;
	eventTitle?: string;
	children?: React.ReactNode;
}

export function AdminManualRegistrationDialog({
	eventId,
	eventTitle,
	children,
}: AdminManualRegistrationDialogProps) {
	const [open, setOpen] = useState(false);
	const [createNewFamily, setCreateNewFamily] = useState(true);
	const [birthDate, setBirthDate] = useState<Date>();
	const [selectedEventId, setSelectedEventId] = useState(eventId || "");

	// Authorization states
	const [selectedAuthorizedPersons, setSelectedAuthorizedPersons] = useState<
		string[]
	>([]);
	const [canExitAlone, setCanExitAlone] = useState(false);
	const [allowedExitLocations, setAllowedExitLocations] = useState<string[]>(
		[],
	);
	const [locationAuthorizations, setLocationAuthorizations] = useState<{
		[key: string]: { [key: string]: boolean };
	}>({});

	// Form state
	const [formData, setFormData] = useState({
		// Parent data
		parentEmail: "",
		parentName: "",
		parentPhone: "",
		// Family data
		familyName: "",
		familyId: "",
		// Child data
		childFirstName: "",
		childLastName: "",
		childBirthPlace: "",
		childFiscalCode: "",
		childGender: "",
		childAllergies: "",
		childMedicalNotes: "",
		// Registration data
		notes: "",
		status: "confirmed" as const,
		paymentStatus: "pending" as const,
		// Privacy consents
		photoPrivacyConsent: true,
		dataPrivacyConsent: true,
	});

	const { data: familiesData } = useFamiliesQuery();
	const { data: eventsData } = useEventsQuery();
	const adminCreateMutation = useAdminCreateRegistrationMutation();
	const { allAuthorizedPersons, isLoading: personsLoading } =
		useAllAuthorizedPersons();

	const handleInputChange = (field: string, value: string) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
	};

	// Get selected event to extract locations
	const selectedEvent = eventsData?.data?.find((e) => e.id === selectedEventId);
	const eventLocations = selectedEvent?.locations
		? typeof selectedEvent.locations === "string"
			? JSON.parse(selectedEvent.locations)
			: selectedEvent.locations
		: [selectedEvent?.locations].filter(Boolean);

	const handleAuthorizedPersonChange = (personId: string) => {
		setSelectedAuthorizedPersons((current) =>
			current.includes(personId)
				? current.filter((id) => id !== personId)
				: [...current, personId],
		);
	};

	const handleLocationAuthorizationChange = (
		personId: string,
		location: string,
		canPickup: boolean,
	) => {
		setLocationAuthorizations((current) => ({
			...current,
			[personId]: {
				...current[personId],
				[location]: canPickup,
			},
		}));
	};

	const handleExitLocationChange = (location: string, allowed: boolean) => {
		setAllowedExitLocations((current) =>
			allowed
				? [...current.filter((loc) => loc !== location), location]
				: current.filter((loc) => loc !== location),
		);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!selectedEventId) {
			toast.error("Seleziona un evento");
			return;
		}

		if (
			!formData.parentPhone ||
			!formData.parentName ||
			!formData.childFirstName ||
			!formData.childLastName ||
			!formData.childFiscalCode ||
			!birthDate
		) {
			toast.error("Compila tutti i campi obbligatori");
			return;
		}

		if (createNewFamily && !formData.familyName) {
			toast.error("Inserisci il nome della famiglia");
			return;
		}

		if (!createNewFamily && !formData.familyId) {
			toast.error("Seleziona una famiglia esistente");
			return;
		}

		try {
			// Prepare location authorizations data
			const locationAuthData = [];
			for (const personId of selectedAuthorizedPersons) {
				for (const location of eventLocations) {
					if (locationAuthorizations[personId]?.[location]) {
						locationAuthData.push({
							authorizedPersonId: personId,
							location: location,
							canPickup: true,
						});
					}
				}
			}

			await adminCreateMutation.mutateAsync({
				eventId: selectedEventId,
				parentEmail: formData.parentEmail || undefined,
				parentName: formData.parentName,
				parentPhone: formData.parentPhone,
				familyName: formData.familyName || undefined,
				createNewFamily,
				familyId: formData.familyId || undefined,
				childFirstName: formData.childFirstName,
				childLastName: formData.childLastName,
				childBirthDate: birthDate.toISOString().split("T")[0],
				childBirthPlace: formData.childBirthPlace || undefined,
				childFiscalCode: formData.childFiscalCode,
				childGender: (formData.childGender || undefined) as
					| "M"
					| "F"
					| undefined,
				childAllergies: formData.childAllergies || undefined,
				childMedicalNotes: formData.childMedicalNotes || undefined,
				notes: formData.notes || undefined,
				status: formData.status,
				paymentStatus: formData.paymentStatus,
				photoPrivacyConsent: formData.photoPrivacyConsent,
				dataPrivacyConsent: formData.dataPrivacyConsent,
				// Authorization data
				authorizedPersonIds:
					selectedAuthorizedPersons.length > 0
						? selectedAuthorizedPersons
						: undefined,
				canExitAlone: canExitAlone,
				allowedExitLocations:
					canExitAlone && allowedExitLocations.length > 0
						? allowedExitLocations
						: undefined,
				locationAuthorizations:
					locationAuthData.length > 0 ? locationAuthData : undefined,
			});

			toast.success("Iscrizione creata con successo!");
			setOpen(false);

			// Reset form
			setFormData({
				parentEmail: "",
				parentName: "",
				parentPhone: "",
				familyName: "",
				familyId: "",
				childFirstName: "",
				childLastName: "",
				childBirthPlace: "",
				childFiscalCode: "",
				childGender: "",
				childAllergies: "",
				childMedicalNotes: "",
				notes: "",
				status: "confirmed",
				paymentStatus: "pending",
				photoPrivacyConsent: true,
				dataPrivacyConsent: true,
			});
			setBirthDate(undefined);
			setSelectedEventId(eventId || "");

			// Reset authorization states
			setSelectedAuthorizedPersons([]);
			setCanExitAlone(false);
			setAllowedExitLocations([]);
			setLocationAuthorizations({});
		} catch (error) {
			console.error("Error creating registration:", error);
			toast.error("Errore durante la creazione dell'iscrizione");
		}
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				{children || (
					<Button>
						<Plus className="h-4 w-4 mr-2" />
						Aggiungi Iscrizione
					</Button>
				)}
			</DialogTrigger>
			<DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>Aggiungi Iscrizione Manualmente</DialogTitle>
					<DialogDescription>
						Crea una nuova iscrizione per un evento. Puoi creare una nuova
						famiglia oppure aggiungere a una famiglia esistente.
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="space-y-6">
					{/* Event Selection */}
					<div className="space-y-4">
						<h3 className="text-lg font-medium">Selezione Evento</h3>
						<div>
							<Label htmlFor="eventId">Evento *</Label>
							<Select
								value={selectedEventId}
								onValueChange={setSelectedEventId}
								required
							>
								<SelectTrigger>
									<SelectValue placeholder="Seleziona un evento" />
								</SelectTrigger>
								<SelectContent>
									{eventsData?.data?.map((event) => (
										<SelectItem key={event.id} value={event.id}>
											<div className="flex flex-col">
												<span>{event.title}</span>
												<span className="text-xs text-muted-foreground">
													{format(new Date(event.startDate), "dd/MM/yyyy", {
														locale: it,
													})}
												</span>
											</div>
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>

					{/* Parent Information */}
					<div className="space-y-4">
						<h3 className="text-lg font-medium">Informazioni Genitore</h3>
						<div className="grid grid-cols-2 gap-4">
							<div>
								<Label htmlFor="parentName">Nome Completo *</Label>
								<Input
									id="parentName"
									value={formData.parentName}
									onChange={(e) =>
										handleInputChange("parentName", e.target.value)
									}
									placeholder="Mario Rossi"
									required
								/>
							</div>
							<div>
								<Label htmlFor="parentEmail">Email</Label>
								<Input
									id="parentEmail"
									type="email"
									value={formData.parentEmail}
									onChange={(e) =>
										handleInputChange("parentEmail", e.target.value)
									}
									placeholder="mario.rossi@email.com"
								/>
							</div>
						</div>
						<div>
							<Label htmlFor="parentPhone">Telefono *</Label>
							<Input
								id="parentPhone"
								value={formData.parentPhone}
								onChange={(e) =>
									handleInputChange("parentPhone", e.target.value)
								}
								placeholder="+39 123 456 7890"
								required
							/>
						</div>
					</div>

					{/* Family Information */}
					<div className="space-y-4">
						<h3 className="text-lg font-medium">Informazioni Famiglia</h3>
						<div className="flex items-center space-x-2">
							<Switch
								id="createNewFamily"
								checked={createNewFamily}
								onCheckedChange={setCreateNewFamily}
							/>
							<Label htmlFor="createNewFamily">Crea nuova famiglia</Label>
						</div>

						{createNewFamily ? (
							<div>
								<Label htmlFor="familyName">Nome Famiglia *</Label>
								<Input
									id="familyName"
									value={formData.familyName}
									onChange={(e) =>
										handleInputChange("familyName", e.target.value)
									}
									placeholder="Famiglia Rossi"
									required
								/>
							</div>
						) : (
							<div>
								<Label htmlFor="familyId">Seleziona Famiglia Esistente *</Label>
								<Select
									value={formData.familyId}
									onValueChange={(value) =>
										handleInputChange("familyId", value)
									}
									required
								>
									<SelectTrigger>
										<SelectValue placeholder="Seleziona una famiglia" />
									</SelectTrigger>
									<SelectContent>
										{familiesData?.map((familyData) => (
											<SelectItem
												key={familyData.family.id}
												value={familyData.family.id}
											>
												{familyData.family.name}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						)}
					</div>

					{/* Child Information */}
					<div className="space-y-4">
						<h3 className="text-lg font-medium">Informazioni Bambino/a</h3>
						<div className="grid grid-cols-2 gap-4">
							<div>
								<Label htmlFor="childFirstName">Nome *</Label>
								<Input
									id="childFirstName"
									value={formData.childFirstName}
									onChange={(e) =>
										handleInputChange("childFirstName", e.target.value)
									}
									placeholder="Luca"
									required
								/>
							</div>
							<div>
								<Label htmlFor="childLastName">Cognome *</Label>
								<Input
									id="childLastName"
									value={formData.childLastName}
									onChange={(e) =>
										handleInputChange("childLastName", e.target.value)
									}
									placeholder="Rossi"
									required
								/>
							</div>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<div>
								<Label>Data di Nascita *</Label>
								<Popover>
									<PopoverTrigger asChild>
										<Button
											variant="outline"
											className={cn(
												"w-full justify-start text-left font-normal",
												!birthDate && "text-muted-foreground",
											)}
										>
											<CalendarIcon className="mr-2 h-4 w-4" />
											{birthDate ? (
												format(birthDate, "PPP", { locale: it })
											) : (
												<span>Seleziona data</span>
											)}
										</Button>
									</PopoverTrigger>
									<PopoverContent className="w-auto p-0">
										<div className="p-3">
											<div className="flex items-center justify-between space-x-2 mb-3">
												<Select
													value={
														birthDate ? birthDate.getFullYear().toString() : ""
													}
													onValueChange={(year) => {
														const currentDate = birthDate || new Date();
														const newDate = new Date(currentDate);
														newDate.setFullYear(parseInt(year));
														setBirthDate(newDate);
													}}
												>
													<SelectTrigger className="w-[100px]">
														<SelectValue placeholder="Anno" />
													</SelectTrigger>
													<SelectContent>
														{Array.from({ length: 35 }, (_, i) => {
															const year = new Date().getFullYear() - i;
															return (
																<SelectItem key={year} value={year.toString()}>
																	{year}
																</SelectItem>
															);
														})}
													</SelectContent>
												</Select>

												<Select
													value={
														birthDate ? birthDate.getMonth().toString() : ""
													}
													onValueChange={(month) => {
														const currentDate = birthDate || new Date();
														const newDate = new Date(currentDate);
														newDate.setMonth(parseInt(month));
														setBirthDate(newDate);
													}}
												>
													<SelectTrigger className="w-[120px]">
														<SelectValue placeholder="Mese" />
													</SelectTrigger>
													<SelectContent>
														{[
															"Gennaio",
															"Febbraio",
															"Marzo",
															"Aprile",
															"Maggio",
															"Giugno",
															"Luglio",
															"Agosto",
															"Settembre",
															"Ottobre",
															"Novembre",
															"Dicembre",
														].map((month, index) => (
															<SelectItem key={month} value={index.toString()}>
																{month}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
											</div>

											<Calendar
												mode="single"
												selected={birthDate || undefined}
												onSelect={setBirthDate}
												disabled={(date) => date > new Date()}
												month={birthDate || undefined}
												className="border-0"
												required={false}
											/>
										</div>
									</PopoverContent>
								</Popover>
							</div>
							<div>
								<Label htmlFor="childGender">Genere</Label>
								<Select
									value={formData.childGender}
									onValueChange={(value) =>
										handleInputChange("childGender", value)
									}
								>
									<SelectTrigger>
										<SelectValue placeholder="Seleziona genere" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="M">Maschio</SelectItem>
										<SelectItem value="F">Femmina</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<div>
								<Label htmlFor="childBirthPlace">Luogo di Nascita</Label>
								<Input
									id="childBirthPlace"
									value={formData.childBirthPlace}
									onChange={(e) =>
										handleInputChange("childBirthPlace", e.target.value)
									}
									placeholder="Milano"
								/>
							</div>
							<div>
								<Label htmlFor="childFiscalCode">Codice Fiscale</Label>
								<Input
									id="childFiscalCode"
									value={formData.childFiscalCode}
									onChange={(e) =>
										handleInputChange("childFiscalCode", e.target.value)
									}
									placeholder="RSSLCU10A01F205X"
								/>
							</div>
						</div>

						<div>
							<Label htmlFor="childAllergies">Allergie</Label>
							<Textarea
								id="childAllergies"
								value={formData.childAllergies}
								onChange={(e) =>
									handleInputChange("childAllergies", e.target.value)
								}
								placeholder="Eventuali allergie del bambino..."
								rows={2}
							/>
						</div>

						<div>
							<Label htmlFor="childMedicalNotes">Note Mediche</Label>
							<Textarea
								id="childMedicalNotes"
								value={formData.childMedicalNotes}
								onChange={(e) =>
									handleInputChange("childMedicalNotes", e.target.value)
								}
								placeholder="Eventuali note mediche..."
								rows={2}
							/>
						</div>
					</div>

					{/* Authorized Persons Section */}
					<div className="space-y-4">
						<h3 className="text-lg font-medium flex items-center gap-2">
							<Users className="h-5 w-5" />
							Persone Autorizzate
						</h3>
						<div className="space-y-3">
							<Label className="text-sm font-medium">
								Persone autorizzate a ritirare il bambino
							</Label>
							{personsLoading ? (
								<div className="flex items-center justify-center p-4">
									<Loader2 className="h-6 w-6 animate-spin" />
								</div>
							) : allAuthorizedPersons.length > 0 ? (
								<div className="space-y-2 max-h-48 overflow-y-auto">
									{allAuthorizedPersons.map(
										(person: AuthorizedPersonWithFamily) => (
											<div
												key={person.id}
												className="flex items-center gap-3 p-3 rounded-lg border"
											>
												<Checkbox
													id={`admin-person-${person.id}`}
													checked={selectedAuthorizedPersons.includes(
														person.id,
													)}
													onCheckedChange={() =>
														handleAuthorizedPersonChange(person.id)
													}
												/>
												<Label
													htmlFor={`admin-person-${person.id}`}
													className="flex items-center gap-3 cursor-pointer flex-1"
												>
													<Avatar className="h-8 w-8">
														<AvatarImage
															src={person.avatarUrl || undefined}
															alt={person.fullName}
														/>
														<AvatarFallback>
															{person.fullName.charAt(0)}
														</AvatarFallback>
													</Avatar>
													<div>
														<p className="font-medium">{person.fullName}</p>
														<p className="text-sm text-muted-foreground">
															{person.relationship} • {person.family.name}
														</p>
													</div>
												</Label>
											</div>
										),
									)}
								</div>
							) : (
								<p className="text-sm text-muted-foreground">
									Nessuna persona autorizzata disponibile
								</p>
							)}
						</div>
					</div>

					{/* Exit Permissions Section */}
					<div className="space-y-4">
						<h3 className="text-lg font-medium">Permessi di Uscita</h3>
						<div className="space-y-4">
							<div className="flex items-center space-x-2">
								<Checkbox
									id="admin-exit-alone"
									checked={canExitAlone}
									onCheckedChange={(checked) =>
										setCanExitAlone(checked === true)
									}
								/>
								<Label
									htmlFor="admin-exit-alone"
									className="text-sm font-medium"
								>
									Il bambino può uscire in autonomia (senza accompagnatore)
								</Label>
							</div>

							{canExitAlone && eventLocations.length > 0 && (
								<div className="ml-6 space-y-2">
									<Label className="text-sm text-muted-foreground">
										Seleziona i luoghi da cui può uscire autonomamente:
									</Label>
									{eventLocations.map((location: string) => (
										<div key={location} className="flex items-center space-x-2">
											<Checkbox
												id={`admin-exit-location-${location}`}
												checked={allowedExitLocations.includes(location)}
												onCheckedChange={(checked) =>
													handleExitLocationChange(location, checked === true)
												}
											/>
											<Label
												htmlFor={`admin-exit-location-${location}`}
												className="text-sm"
											>
												{location}
											</Label>
										</div>
									))}
								</div>
							)}

							{selectedAuthorizedPersons.length > 0 &&
								eventLocations.length > 1 && (
									<div className="space-y-3 border-t pt-4">
										<Label className="text-sm font-medium">
											Autorizzazioni specifiche per luogo
										</Label>
										<div className="space-y-3 max-h-48 overflow-y-auto">
											{allAuthorizedPersons
												.filter((person: AuthorizedPersonWithFamily) =>
													selectedAuthorizedPersons.includes(person.id),
												)
												.map((person: AuthorizedPersonWithFamily) => (
													<div
														key={person.id}
														className="border rounded-lg p-3 space-y-2"
													>
														<div className="flex items-center gap-2">
															<Avatar className="h-6 w-6">
																<AvatarImage
																	src={person.avatarUrl || undefined}
																	alt={person.fullName}
																/>
																<AvatarFallback className="text-xs">
																	{person.fullName.charAt(0)}
																</AvatarFallback>
															</Avatar>
															<span className="font-medium text-sm">
																{person.fullName}
															</span>
														</div>
														<div className="space-y-1 ml-8">
															{eventLocations.map((location: string) => (
																<div
																	key={location}
																	className="flex items-center space-x-2"
																>
																	<Checkbox
																		id={`admin-auth-${person.id}-${location}`}
																		checked={
																			locationAuthorizations[person.id]?.[
																				location
																			] || false
																		}
																		onCheckedChange={(checked) =>
																			handleLocationAuthorizationChange(
																				person.id,
																				location,
																				checked === true,
																			)
																		}
																	/>
																	<Label
																		htmlFor={`admin-auth-${person.id}-${location}`}
																		className="text-xs"
																	>
																		Può ritirare da: {location}
																	</Label>
																</div>
															))}
														</div>
													</div>
												))}
										</div>
									</div>
								)}

							<div className="rounded-md bg-blue-50 p-3 text-sm flex gap-2">
								<AlertCircle className="h-5 w-5 text-blue-500 flex-shrink-0" />
								<div className="text-blue-800">
									<p className="font-medium mb-1">Importante:</p>
									<ul className="text-xs space-y-1 list-disc list-inside">
										<li>
											Se il bambino può uscire autonomamente, specificare da
											quali luoghi
										</li>
										<li>
											Per eventi con più luoghi, puoi autorizzare persone
											specifiche per luoghi specifici
										</li>
										<li>
											Se non specifichi autorizzazioni per luogo, le persone
											autorizzate potranno ritirare da qualsiasi luogo
										</li>
									</ul>
								</div>
							</div>
						</div>
					</div>

					{/* Registration Information */}
					<div className="space-y-4">
						<h3 className="text-lg font-medium">Informazioni Iscrizione</h3>
						<div className="grid grid-cols-2 gap-4">
							<div>
								<Label htmlFor="status">Stato Iscrizione</Label>
								<Select
									value={formData.status}
									onValueChange={(value) => handleInputChange("status", value)}
								>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="pending">In Attesa</SelectItem>
										<SelectItem value="confirmed">Confermata</SelectItem>
										<SelectItem value="waitlist">Lista d'Attesa</SelectItem>
										<SelectItem value="cancelled">Annullata</SelectItem>
									</SelectContent>
								</Select>
							</div>
							<div>
								<Label htmlFor="paymentStatus">Stato Pagamento</Label>
								<Select
									value={formData.paymentStatus}
									onValueChange={(value) =>
										handleInputChange("paymentStatus", value)
									}
								>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="pending">In Attesa</SelectItem>
										<SelectItem value="completed">Completato</SelectItem>
										<SelectItem value="failed">Fallito</SelectItem>
										<SelectItem value="refunded">Rimborsato</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</div>

						<div>
							<Label htmlFor="notes">Note</Label>
							<Textarea
								id="notes"
								value={formData.notes}
								onChange={(e) => handleInputChange("notes", e.target.value)}
								placeholder="Note aggiuntive sull'iscrizione..."
								rows={3}
							/>
						</div>

						{/* Privacy Consents */}
						<div className="space-y-4 border-t pt-4">
							<h4 className="text-sm font-medium">Consensi Privacy</h4>

							<div className="flex items-center space-x-2">
								<Switch
									id="dataPrivacyConsent"
									checked={formData.dataPrivacyConsent}
									onCheckedChange={(checked) =>
										setFormData((prev) => ({
											...prev,
											dataPrivacyConsent: checked,
										}))
									}
								/>
								<Label htmlFor="dataPrivacyConsent" className="text-sm">
									Consenso trattamento dati personali
								</Label>
							</div>

							<div className="flex items-center space-x-2">
								<Switch
									id="photoPrivacyConsent"
									checked={formData.photoPrivacyConsent}
									onCheckedChange={(checked) =>
										setFormData((prev) => ({
											...prev,
											photoPrivacyConsent: checked,
										}))
									}
								/>
								<Label htmlFor="photoPrivacyConsent" className="text-sm">
									Consenso foto e video
								</Label>
							</div>
						</div>
					</div>

					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => setOpen(false)}
						>
							Annulla
						</Button>
						<Button type="submit" disabled={adminCreateMutation.isPending}>
							{adminCreateMutation.isPending && (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							)}
							Crea Iscrizione
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
