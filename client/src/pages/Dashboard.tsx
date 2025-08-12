import { useNavigate } from "@tanstack/react-router";
import {
	AlertCircle,
	ArrowRight,
	Baby,
	CalendarDays,
	CheckCircle,
	Clock,
	Edit2,
	Loader2,
	Plus,
	UserPlus,
	Users,
	X,
	XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AggiungiModificaFiglioDialog } from "@/components/aggiungi-modifica-figlio-dialog";
import { AggiungiModificaPersonaDialog } from "@/components/aggiungi-modifica-persona-dialog";
import { CancelRegistrationDialog } from "@/components/cancel-registration-dialog";
import { CreaFamigliaDialog } from "@/components/crea-famiglia-dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	useCancelRegistrationMutation,
	useMyRegistrationsQuery,
} from "@/hooks/useRegistrationsQuery";
import { cn } from "@/lib/utils";
import { Route as dashboardRoute } from "@/routes/dashboard";
import {
	useAddAuthorizedPersonMutation,
	useAddChildMutation,
	useCreateFamilyMutation,
	useFamiliesQuery,
	useFamilyAuthorizedPersonsQuery,
	useFamilyChildrenQuery,
	useUpdateFamilyMutation,
} from "../hooks/useFamilyQuery";

export default function Dashboard() {
	const navigate = useNavigate();
	const { auth } = dashboardRoute.useRouteContext();
	const [showCreateFamilyDialog, setShowCreateFamilyDialog] = useState(false);
	const [showAddChildDialog, setShowAddChildDialog] = useState(false);
	const [showAddPersonDialog, setShowAddPersonDialog] = useState(false);
	const [editingFamily, setEditingFamily] = useState<any>(null);
	const [editingChild, setEditingChild] = useState<any>(null);
	const [editingPerson, setEditingPerson] = useState<any>(null);
	const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
	const [registrationToCancel, setRegistrationToCancel] = useState<{
		id: string;
		childName: string;
		eventName: string;
	} | null>(null);

	const { data: families = [], isLoading: familiesLoading } =
		useFamiliesQuery();
	const [selectedFamilyId, setSelectedFamilyId] = useState<string | null>(null);

	const { data: children = [], isLoading: childrenLoading } =
		useFamilyChildrenQuery(selectedFamilyId || "");
	const { data: authorizedPersons = [], isLoading: personsLoading } =
		useFamilyAuthorizedPersonsQuery(selectedFamilyId || "");

	const createFamilyMutation = useCreateFamilyMutation();
	const updateFamilyMutation = useUpdateFamilyMutation();
	const _addChildMutation = useAddChildMutation();
	const addAuthorizedPersonMutation = useAddAuthorizedPersonMutation();

	// Get recent registrations
	const { data: registrationsResponse } = useMyRegistrationsQuery({
		page: 1,
		limit: 5,
	});
	const recentRegistrations = registrationsResponse?.registrations || [];

	// Cancel registration mutation
	const cancelRegistrationMutation = useCancelRegistrationMutation();

	// Filter out any families where family data is null
	const validFamilies = families.filter((familyData: any) => familyData.family);

	const totalFamilies = validFamilies.length;
	const totalChildren = validFamilies.reduce(
		(acc: number, familyData: any) =>
			acc + (familyData.family._count?.children || 0),
		0,
	);
	const totalPersons = validFamilies.reduce(
		(acc: number, familyData: any) =>
			acc + (familyData.family._count?.authorizedPersons || 0),
		0,
	);

	useEffect(() => {
		if (!selectedFamilyId && validFamilies.length > 0) {
			setSelectedFamilyId(validFamilies[0].family.id);
		}
	}, [validFamilies, selectedFamilyId]);

	const handleCreateFamilySubmit = async (data: {
		name: string;
		description?: string;
	}) => {
		await createFamilyMutation.mutateAsync(data);
		setShowCreateFamilyDialog(false);
	};

	const _handleAddChild = () => {
		if (!selectedFamilyId) {
			toast.error("Seleziona prima una famiglia");
			return;
		}
		setEditingChild(null);
		setShowAddChildDialog(true);
	};

	const handleAddChildSuccess = () => {
		setShowAddChildDialog(false);
	};

	const _handleEditChild = (child: any) => {
		setEditingChild(child);
		setShowAddChildDialog(true);
	};

	const handleEditFamily = (family: any) => {
		setEditingFamily(family);
		setShowCreateFamilyDialog(true);
	};

	const handleUpdateFamilySubmit = async (data: {
		id: string;
		name: string;
		description?: string;
	}) => {
		await updateFamilyMutation.mutateAsync(data);
		setShowCreateFamilyDialog(false);
		setEditingFamily(null);
	};

	const _handleAddPerson = () => {
		if (!selectedFamilyId) {
			toast.error("Seleziona prima una famiglia");
			return;
		}
		setEditingPerson(null);
		setShowAddPersonDialog(true);
	};

	const _handleEditPerson = (person: any) => {
		setEditingPerson(person);
		setShowAddPersonDialog(true);
	};

	const handleCancelRegistration = (
		registrationId: string,
		childName: string,
		eventName: string,
	) => {
		setRegistrationToCancel({
			id: registrationId,
			childName,
			eventName,
		});
		setCancelDialogOpen(true);
	};

	const handleConfirmCancel = async () => {
		if (!registrationToCancel) return;

		try {
			await cancelRegistrationMutation.mutateAsync({
				id: registrationToCancel.id,
			});
			toast.success("Iscrizione annullata con successo");
			setCancelDialogOpen(false);
			setRegistrationToCancel(null);
		} catch (error) {
			console.error("Error cancelling registration:", error);
			toast.error("Errore durante l'annullamento dell'iscrizione");
		}
	};

	const handleAddPersonSubmit = async (data: any) => {
		await addAuthorizedPersonMutation.mutateAsync({
			familyId: selectedFamilyId!,
			...data,
		});
		setShowAddPersonDialog(false);
	};

	if (familiesLoading) {
		return (
			<div className="flex items-center justify-center h-full">
				<Loader2 className="h-8 w-8 animate-spin" />
			</div>
		);
	}

	return (
		<>
			<div className="space-y-6">
				<div className="flex items-center justify-between">
					<h2 className="text-2xl font-bold">Panoramica</h2>
					<button
						type="button"
						onClick={() => setShowCreateFamilyDialog(true)}
						className="flex items-center space-x-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
					>
						<Plus size={16} />
						<span>Crea Famiglia</span>
					</button>
				</div>

				<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
					<div className="rounded-lg border bg-card p-6">
						<div className="flex items-center space-x-2">
							<Users className="h-8 w-8 text-primary" />
							<div>
								<p className="text-sm font-medium text-muted-foreground">
									Famiglie
								</p>
								<p className="text-2xl font-bold">{totalFamilies}</p>
							</div>
						</div>
					</div>

					<div className="rounded-lg border bg-card p-6">
						<div className="flex items-center space-x-2">
							<Baby className="h-8 w-8 text-primary" />
							<div>
								<p className="text-sm font-medium text-muted-foreground">
									Bambini
								</p>
								<p className="text-2xl font-bold">{totalChildren}</p>
							</div>
						</div>
					</div>

					<div className="rounded-lg border bg-card p-6">
						<div className="flex items-center space-x-2">
							<CalendarDays className="h-8 w-8 text-primary" />
							<div>
								<p className="text-sm font-medium text-muted-foreground">
									Iscrizioni Attive
								</p>
								<p className="text-2xl font-bold">
									{
										recentRegistrations.filter(
											(r) => r.status === "confirmed" || r.status === "pending",
										).length
									}
								</p>
							</div>
						</div>
					</div>

					<div className="rounded-lg border bg-card p-6">
						<div className="flex items-center space-x-2">
							<UserPlus className="h-8 w-8 text-primary" />
							<div>
								<p className="text-sm font-medium text-muted-foreground">
									Persone Autorizzate
								</p>
								<p className="text-2xl font-bold">{totalPersons}</p>
							</div>
						</div>
					</div>
				</div>

				<div className="rounded-lg border bg-card p-6">
					<h3 className="mb-4 text-lg font-semibold">Le Tue Famiglie</h3>
					{familiesLoading ? (
						<div className="flex items-center justify-center p-8">
							<Loader2 className="h-8 w-8 animate-spin" />
						</div>
					) : validFamilies.length > 0 ? (
						<div className="grid gap-4 md:grid-cols-2">
							{validFamilies.map((familyData: any) => (
								<div
									key={familyData.family.id}
									className={cn(
										"cursor-pointer rounded-md border p-4 transition-colors hover:bg-accent",
										selectedFamilyId === familyData.family.id &&
											"border-primary bg-accent",
									)}
								>
									<div className="flex items-start justify-between">
										<div
											className="flex-1"
											onClick={() => setSelectedFamilyId(familyData.family.id)}
										>
											<h4 className="font-medium">{familyData.family.name}</h4>
											{familyData.family.description && (
												<p className="text-sm text-muted-foreground">
													{familyData.family.description}
												</p>
											)}
										</div>
										<button
											onClick={(e) => {
												e.stopPropagation();
												handleEditFamily(familyData.family);
											}}
											className="ml-2 rounded-md p-1 text-muted-foreground hover:bg-accent"
										>
											<Edit2 size={14} />
										</button>
									</div>
								</div>
							))}
						</div>
					) : (
						<p className="text-center text-muted-foreground">
							Nessuna famiglia trovata. Creane una per iniziare!
						</p>
					)}
				</div>

				{/* Recent Registrations Section */}
				<div className="rounded-lg border bg-card p-6">
					<div className="flex items-center justify-between mb-4">
						<h3 className="text-lg font-semibold">Iscrizioni Recenti</h3>
						<button
							onClick={() => navigate({ to: "/iscrizioni" })}
							className="text-sm text-primary hover:underline flex items-center gap-1"
						>
							Vedi tutte
							<ArrowRight className="h-3 w-3" />
						</button>
					</div>

					{recentRegistrations.length > 0 ? (
						<div className="space-y-3">
							{recentRegistrations.map((registration) => {
								const getStatusIcon = (status: string) => {
									switch (status) {
										case "confirmed":
											return <CheckCircle className="h-4 w-4 text-green-600" />;
										case "pending":
											return <Clock className="h-4 w-4 text-yellow-600" />;
										case "cancelled":
											return <XCircle className="h-4 w-4 text-red-600" />;
										case "waitlist":
											return <AlertCircle className="h-4 w-4 text-blue-600" />;
										default:
											return <Clock className="h-4 w-4 text-gray-600" />;
									}
								};

								const getStatusText = (status: string) => {
									switch (status) {
										case "confirmed":
											return "Confermata";
										case "pending":
											return "In Attesa";
										case "cancelled":
											return "Annullata";
										case "waitlist":
											return "Lista d'Attesa";
										default:
											return status;
									}
								};

								const getStatusVariant = (status: string) => {
									switch (status) {
										case "confirmed":
											return "success" as const;
										case "pending":
											return "warning" as const;
										case "cancelled":
											return "destructive" as const;
										case "waitlist":
											return "secondary" as const;
										default:
											return "default" as const;
									}
								};

								return (
									<div
										key={registration.id}
										className="flex items-center justify-between p-3 rounded-lg border bg-muted/20"
									>
										<div className="flex items-center gap-3">
											<Avatar className="h-8 w-8">
												<AvatarFallback className="text-xs">
													{registration.child.firstName.charAt(0)}
												</AvatarFallback>
											</Avatar>
											<div>
												<p className="font-medium text-sm">
													{registration.child.firstName}{" "}
													{registration.child.lastName}
												</p>
												<p className="text-sm text-muted-foreground">
													{registration.event.title}
													{registration.parent.name && (
														<span className="block text-xs mt-1">
															Iscritto da {registration.parent.name}
														</span>
													)}
												</p>
											</div>
										</div>
										<div className="flex items-center gap-2">
											<Badge
												variant={getStatusVariant(registration.status)}
												className="text-xs"
											>
												<div className="flex items-center gap-1">
													{getStatusIcon(registration.status)}
													{getStatusText(registration.status)}
												</div>
											</Badge>
											{registration.status === "pending" && (
												<Button
													variant="ghost"
													size="sm"
													onClick={() =>
														handleCancelRegistration(
															registration.id,
															`${registration.child.firstName} ${registration.child.lastName}`,
															registration.event.title,
														)
													}
													disabled={cancelRegistrationMutation.isPending}
													className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
													title="Annulla iscrizione"
												>
													{cancelRegistrationMutation.isPending ? (
														<Loader2 className="h-3 w-3 animate-spin" />
													) : (
														<X className="h-3 w-3" />
													)}
												</Button>
											)}
										</div>
									</div>
								);
							})}
						</div>
					) : (
						<div className="text-center py-6">
							<CalendarDays className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
							<p className="text-sm text-muted-foreground">
								Nessuna iscrizione per i figli delle tue famiglie
							</p>
							<button
								onClick={() => navigate({ to: "/eventi" })}
								className="text-sm text-primary hover:underline mt-1"
							>
								Esplora gli eventi disponibili
							</button>
						</div>
					)}
				</div>
			</div>

			{/* Dialogs */}
			<CreaFamigliaDialog
				open={showCreateFamilyDialog}
				onOpenChange={(open) => {
					setShowCreateFamilyDialog(open);
					if (!open) setEditingFamily(null);
				}}
				onCreateFamily={handleCreateFamilySubmit}
				family={editingFamily}
				onUpdateFamily={handleUpdateFamilySubmit}
			/>
			{selectedFamilyId && (
				<AggiungiModificaFiglioDialog
					open={showAddChildDialog}
					onOpenChange={(open) => {
						setShowAddChildDialog(open);
						if (!open) setEditingChild(null);
					}}
					child={editingChild}
					familyId={selectedFamilyId}
					onSuccess={handleAddChildSuccess}
				/>
			)}
			{selectedFamilyId && (
				<AggiungiModificaPersonaDialog
					open={showAddPersonDialog}
					onOpenChange={setShowAddPersonDialog}
					familyId={selectedFamilyId}
					onAddPerson={handleAddPersonSubmit}
					onUpdatePerson={handleAddPersonSubmit}
					person={editingPerson}
				/>
			)}

			{/* Cancel Registration Dialog */}
			{registrationToCancel && (
				<CancelRegistrationDialog
					open={cancelDialogOpen}
					onOpenChange={setCancelDialogOpen}
					onConfirm={handleConfirmCancel}
					childName={registrationToCancel.childName}
					eventName={registrationToCancel.eventName}
					isLoading={cancelRegistrationMutation.isPending}
				/>
			)}
		</>
	);
}
