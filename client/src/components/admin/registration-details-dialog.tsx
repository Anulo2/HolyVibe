import { format } from "date-fns";
import { it } from "date-fns/locale";
import {
	AlertCircle,
	CalendarDays,
	CreditCard,
	Mail,
	Phone,
	User,
	Users,
} from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
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
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
	useRegistrationQuery,
	useUpdateRegistrationMutation,
} from "@/hooks/useRegistrationsQuery";

interface RegistrationDetailsDialogProps {
	registrationId: string | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

const getStatusColor = (status: string) => {
	switch (status) {
		case "confirmed":
			return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
		case "pending":
			return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
		case "cancelled":
			return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
		case "waitlist":
			return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
		default:
			return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
	}
};

const getPaymentStatusColor = (status: string) => {
	switch (status) {
		case "completed":
			return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
		case "pending":
			return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
		case "failed":
			return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
		case "refunded":
			return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
		default:
			return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
	}
};

const getStatusLabel = (status: string) => {
	switch (status) {
		case "confirmed":
			return "Confermata";
		case "pending":
			return "In attesa";
		case "cancelled":
			return "Cancellata";
		case "waitlist":
			return "Lista d'attesa";
		default:
			return status;
	}
};

const getPaymentStatusLabel = (status: string) => {
	switch (status) {
		case "completed":
			return "Pagato";
		case "pending":
			return "In attesa";
		case "failed":
			return "Fallito";
		case "refunded":
			return "Rimborsato";
		default:
			return status;
	}
};

export function RegistrationDetailsDialog({
	registrationId,
	open,
	onOpenChange,
}: RegistrationDetailsDialogProps) {
	const [status, setStatus] = useState<string>("");
	const [paymentStatus, setPaymentStatus] = useState<string>("");
	const [notes, setNotes] = useState("");
	const [isEditing, setIsEditing] = useState(false);

	const { data: registration, isLoading } = useRegistrationQuery(
		registrationId || "",
	);
	const updateRegistrationMutation = useUpdateRegistrationMutation();

	// Initialize form when registration data loads
	React.useEffect(() => {
		if (registration) {
			setStatus(registration.status);
			setPaymentStatus(registration.paymentStatus);
			setNotes(registration.notes || "");
		}
	}, [registration]);

	const handleSave = async () => {
		if (!registrationId) return;

		try {
			await updateRegistrationMutation.mutateAsync({
				id: registrationId,
				status: status as any,
				paymentStatus: paymentStatus as any,
				notes: notes || undefined,
			});

			setIsEditing(false);
			toast.success("Iscrizione aggiornata con successo");
		} catch (error) {
			toast.error("Errore nell'aggiornamento dell'iscrizione");
		}
	};

	const handleCancel = () => {
		if (registration) {
			setStatus(registration.status);
			setPaymentStatus(registration.paymentStatus);
			setNotes(registration.notes || "");
		}
		setIsEditing(false);
	};

	if (!registrationId) return null;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<User className="h-5 w-5" />
						Dettagli Iscrizione
					</DialogTitle>
				</DialogHeader>

				{isLoading ? (
					<div className="flex items-center justify-center py-8">
						<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
					</div>
				) : registration ? (
					<div className="space-y-6">
						{/* Status and Actions */}
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-3">
								<Badge className={getStatusColor(registration.status)}>
									{getStatusLabel(registration.status)}
								</Badge>
								<Badge
									className={getPaymentStatusColor(registration.paymentStatus)}
								>
									<CreditCard className="h-3 w-3 mr-1" />
									{getPaymentStatusLabel(registration.paymentStatus)}
								</Badge>
							</div>
							<div className="flex gap-2">
								{!isEditing ? (
									<Button onClick={() => setIsEditing(true)}>Modifica</Button>
								) : (
									<>
										<Button variant="outline" onClick={handleCancel}>
											Annulla
										</Button>
										<Button
											onClick={handleSave}
											disabled={updateRegistrationMutation.isPending}
										>
											{updateRegistrationMutation.isPending
												? "Salvando..."
												: "Salva"}
										</Button>
									</>
								)}
							</div>
						</div>

						<Tabs defaultValue="details" className="w-full">
							<TabsList className="grid w-full grid-cols-4">
								<TabsTrigger value="details">Dettagli</TabsTrigger>
								<TabsTrigger value="child">Bambino</TabsTrigger>
								<TabsTrigger value="parent">Genitore</TabsTrigger>
								<TabsTrigger value="authorized">
									Persone Autorizzate
								</TabsTrigger>
							</TabsList>

							<TabsContent value="details" className="space-y-4">
								<div className="grid gap-4 md:grid-cols-2">
									{/* Event Info */}
									<Card>
										<CardHeader>
											<CardTitle className="flex items-center gap-2">
												<CalendarDays className="h-4 w-4" />
												Informazioni Evento
											</CardTitle>
										</CardHeader>
										<CardContent className="space-y-3">
											<div>
												<Label className="text-sm font-medium">Titolo</Label>
												<p className="text-sm">{registration.event.title}</p>
											</div>
											<div>
												<Label className="text-sm font-medium">
													Data Inizio
												</Label>
												<p className="text-sm">
													{format(
														new Date(registration.event.startDate),
														"PPP",
														{ locale: it },
													)}
												</p>
											</div>
											{registration.event.endDate && (
												<div>
													<Label className="text-sm font-medium">
														Data Fine
													</Label>
													<p className="text-sm">
														{format(
															new Date(registration.event.endDate),
															"PPP",
															{ locale: it },
														)}
													</p>
												</div>
											)}
											{registration.event.price && (
												<div>
													<Label className="text-sm font-medium">Prezzo</Label>
													<p className="text-sm font-semibold">
														€ {registration.event.price}
													</p>
												</div>
											)}
										</CardContent>
									</Card>

									{/* Registration Info */}
									<Card>
										<CardHeader>
											<CardTitle>Informazioni Iscrizione</CardTitle>
										</CardHeader>
										<CardContent className="space-y-3">
											<div>
												<Label className="text-sm font-medium">
													Data Iscrizione
												</Label>
												<p className="text-sm">
													{format(
														new Date(registration.registrationDate),
														"PPP",
														{ locale: it },
													)}
												</p>
											</div>
											<div>
												<Label className="text-sm font-medium">Famiglia</Label>
												<p className="text-sm">{registration.family.name}</p>
											</div>

											{isEditing ? (
												<div className="space-y-4">
													<div>
														<Label htmlFor="status">Stato Iscrizione</Label>
														<Select value={status} onValueChange={setStatus}>
															<SelectTrigger>
																<SelectValue />
															</SelectTrigger>
															<SelectContent>
																<SelectItem value="pending">
																	In attesa
																</SelectItem>
																<SelectItem value="confirmed">
																	Confermata
																</SelectItem>
																<SelectItem value="cancelled">
																	Cancellata
																</SelectItem>
																<SelectItem value="waitlist">
																	Lista d'attesa
																</SelectItem>
															</SelectContent>
														</Select>
													</div>
													<div>
														<Label htmlFor="paymentStatus">
															Stato Pagamento
														</Label>
														<Select
															value={paymentStatus}
															onValueChange={setPaymentStatus}
														>
															<SelectTrigger>
																<SelectValue />
															</SelectTrigger>
															<SelectContent>
																<SelectItem value="pending">
																	In attesa
																</SelectItem>
																<SelectItem value="completed">
																	Pagato
																</SelectItem>
																<SelectItem value="failed">Fallito</SelectItem>
																<SelectItem value="refunded">
																	Rimborsato
																</SelectItem>
															</SelectContent>
														</Select>
													</div>
												</div>
											) : (
												<div className="space-y-2">
													<div>
														<Label className="text-sm font-medium">Stato</Label>
														<div className="flex items-center gap-2 mt-1">
															<Badge
																className={getStatusColor(registration.status)}
															>
																{getStatusLabel(registration.status)}
															</Badge>
														</div>
													</div>
													<div>
														<Label className="text-sm font-medium">
															Pagamento
														</Label>
														<div className="flex items-center gap-2 mt-1">
															<Badge
																className={getPaymentStatusColor(
																	registration.paymentStatus,
																)}
															>
																{getPaymentStatusLabel(
																	registration.paymentStatus,
																)}
															</Badge>
														</div>
													</div>
												</div>
											)}
										</CardContent>
									</Card>
								</div>

								{/* Notes */}
								<Card>
									<CardHeader>
										<CardTitle>Note</CardTitle>
									</CardHeader>
									<CardContent>
										{isEditing ? (
											<div>
												<Label htmlFor="notes">Note aggiuntive</Label>
												<Textarea
													id="notes"
													value={notes}
													onChange={(e) => setNotes(e.target.value)}
													placeholder="Aggiungi note sull'iscrizione..."
													rows={3}
												/>
											</div>
										) : (
											<p className="text-sm text-muted-foreground">
												{registration.notes || "Nessuna nota aggiunta"}
											</p>
										)}
									</CardContent>
								</Card>
							</TabsContent>

							<TabsContent value="child" className="space-y-4">
								<Card>
									<CardHeader>
										<CardTitle className="flex items-center gap-2">
											<User className="h-4 w-4" />
											Informazioni Bambino
										</CardTitle>
									</CardHeader>
									<CardContent className="space-y-3">
										<div className="flex items-center gap-3">
											<Avatar>
												<AvatarFallback>
													{registration.child.firstName[0]}
													{registration.child.lastName[0]}
												</AvatarFallback>
											</Avatar>
											<div>
												<p className="font-medium">
													{registration.child.firstName}{" "}
													{registration.child.lastName}
												</p>
												<p className="text-sm text-muted-foreground">
													Nato il{" "}
													{format(
														new Date(registration.child.birthDate),
														"PPP",
														{ locale: it },
													)}
												</p>
											</div>
										</div>

										<Separator />

										{registration.child.allergies && (
											<div>
												<Label className="text-sm font-medium flex items-center gap-1">
													<AlertCircle className="h-4 w-4 text-red-500" />
													Allergie
												</Label>
												<p className="text-sm text-red-600 bg-red-50 dark:bg-red-950 p-2 rounded">
													{registration.child.allergies}
												</p>
											</div>
										)}

										{registration.child.medicalNotes && (
											<div>
												<Label className="text-sm font-medium">
													Note Mediche
												</Label>
												<p className="text-sm text-orange-600 bg-orange-50 dark:bg-orange-950 p-2 rounded">
													{registration.child.medicalNotes}
												</p>
											</div>
										)}
									</CardContent>
								</Card>
							</TabsContent>

							<TabsContent value="parent" className="space-y-4">
								<Card>
									<CardHeader>
										<CardTitle className="flex items-center gap-2">
											<User className="h-4 w-4" />
											Informazioni Genitore
										</CardTitle>
									</CardHeader>
									<CardContent className="space-y-3">
										<div>
											<Label className="text-sm font-medium">
												Nome Completo
											</Label>
											<p className="text-sm">{registration.parent.name}</p>
										</div>
										<div>
											<Label className="text-sm font-medium flex items-center gap-1">
												<Mail className="h-3 w-3" />
												Email
											</Label>
											<p className="text-sm">{registration.parent.email}</p>
										</div>
										{registration.parent.phoneNumber && (
											<div>
												<Label className="text-sm font-medium flex items-center gap-1">
													<Phone className="h-3 w-3" />
													Telefono
												</Label>
												<p className="text-sm">
													{registration.parent.phoneNumber}
												</p>
											</div>
										)}
									</CardContent>
								</Card>
							</TabsContent>

							<TabsContent value="authorized" className="space-y-4">
								<Card>
									<CardHeader>
										<CardTitle className="flex items-center gap-2">
											<Users className="h-4 w-4" />
											Persone Autorizzate al Ritiro
										</CardTitle>
									</CardHeader>
									<CardContent>
										{registration.authorizedPersons.length > 0 ? (
											<div className="space-y-4">
												{registration.authorizedPersons.map((person) => (
													<div
														key={person.id}
														className="border rounded-lg p-3"
													>
														<div className="flex items-center gap-3 mb-2">
															<Avatar>
																<AvatarFallback>
																	{person.fullName
																		.split(" ")
																		.map((n) => n[0])
																		.join("")}
																</AvatarFallback>
															</Avatar>
															<div>
																<p className="font-medium">{person.fullName}</p>
																<p className="text-sm text-muted-foreground">
																	{person.relationship}
																</p>
															</div>
														</div>
														{(person.phone || person.email) && (
															<div className="space-y-1 text-sm text-muted-foreground">
																{person.phone && (
																	<p className="flex items-center gap-1">
																		<Phone className="h-3 w-3" />
																		{person.phone}
																	</p>
																)}
																{person.email && (
																	<p className="flex items-center gap-1">
																		<Mail className="h-3 w-3" />
																		{person.email}
																	</p>
																)}
															</div>
														)}
													</div>
												))}
											</div>
										) : (
											<p className="text-sm text-muted-foreground text-center py-4">
												Nessuna persona autorizzata aggiunta per questa
												iscrizione
											</p>
										)}
									</CardContent>
								</Card>
							</TabsContent>
						</Tabs>
					</div>
				) : (
					<div className="text-center py-8">
						<p className="text-muted-foreground">Iscrizione non trovata</p>
					</div>
				)}
			</DialogContent>
		</Dialog>
	);
}
