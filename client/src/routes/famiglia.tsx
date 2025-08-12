import { createFileRoute, redirect } from "@tanstack/react-router";
import { Edit2, Loader2, Plus, User, UserPlus } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AggiungiModificaFiglioDialog } from "@/components/aggiungi-modifica-figlio-dialog";
import { AggiungiModificaPersonaDialog } from "@/components/aggiungi-modifica-persona-dialog";
import { CreaFamigliaDialog } from "@/components/crea-famiglia-dialog";
import { InvitaGenitoreDialog } from "@/components/invita-genitore-dialog";
import {
	useFamilyMembersQuery,
	useSendInvitationMutation,
} from "../hooks/useFamily";
import {
	useAddAuthorizedPersonMutation,
	useAddChildMutation,
	useCreateFamilyMutation,
	useFamiliesQuery,
	useFamilyAuthorizedPersonsQuery,
	useFamilyChildrenQuery,
	useUpdateAuthorizedPersonMutation,
	useUpdateFamilyMutation,
} from "../hooks/useFamilyQuery";

export const Route = createFileRoute("/famiglia")({
	beforeLoad: ({ context }) => {
		if (!context.auth.data?.user) {
			throw redirect({
				to: "/login",
				search: {
					redirect: location.href,
				},
			});
		}
	},
	component: FamigliaComponent,
});

function FamigliaComponent() {
	const { auth } = Route.useRouteContext();
	const _currentUser = auth.data?.user;
	const [showCreateFamilyDialog, setShowCreateFamilyDialog] = useState(false);
	const [showAddChildDialog, setShowAddChildDialog] = useState(false);
	const [showAddPersonDialog, setShowAddPersonDialog] = useState(false);
	const [showInviteParentDialog, setShowInviteParentDialog] = useState(false);
	const [editingChild, setEditingChild] = useState<any>(null);
	const [editingFamily, setEditingFamily] = useState<any>(null);
	const [editingPerson, setEditingPerson] = useState<any>(null);
	const [selectedFamilyId, setSelectedFamilyId] = useState<string>("");

	// Use the new oRPC hooks - filter out null families
	const { data: familiesRaw = [], isLoading: familiesLoading } =
		useFamiliesQuery();
	const families = familiesRaw.filter((familyData: any) => familyData.family);
	const { mutateAsync: createFamily } = useCreateFamilyMutation();
	const { mutateAsync: updateFamily } = useUpdateFamilyMutation();
	const { mutateAsync: sendInvitation } = useSendInvitationMutation();

	const { data: children = [], isLoading: childrenLoading } =
		useFamilyChildrenQuery(selectedFamilyId);
	const { mutateAsync: addChild } = useAddChildMutation();

	const { data: authorizedPersons = [], isLoading: personsLoading } =
		useFamilyAuthorizedPersonsQuery(selectedFamilyId);
	const { mutateAsync: addAuthorizedPerson } = useAddAuthorizedPersonMutation();
	const { mutateAsync: updateAuthorizedPerson } =
		useUpdateAuthorizedPersonMutation();

	const { data: familyMembers = [], isLoading: membersLoading } =
		useFamilyMembersQuery(selectedFamilyId);

	// Auto-select family logic - consolidated into one effect
	useEffect(() => {
		if (!Array.isArray(families) || families.length === 0) {
			// No families, clear selection
			if (selectedFamilyId) {
				setSelectedFamilyId("");
			}
			return;
		}

		// Check if current selection is valid
		const currentFamilyExists =
			selectedFamilyId &&
			families.find((f) => f?.family && f.family.id === selectedFamilyId);

		if (!selectedFamilyId || !currentFamilyExists) {
			// No selection or invalid selection, select first family
			const firstValidFamily = families.find((f) => f?.family?.id);
			if (firstValidFamily) {
				setSelectedFamilyId(firstValidFamily.family.id);
			}
		}
	}, [families, selectedFamilyId]);

	const handleCreateFamilySubmit = async (data: {
		name: string;
		description?: string;
	}) => {
		try {
			await createFamily(data);
			toast.success("Famiglia creata con successo!");
			setShowCreateFamilyDialog(false);
		} catch (_error) {
			toast.error("Errore durante la creazione della famiglia");
		}
	};

	const handleUpdateFamilySubmit = async (data: {
		id: string;
		name: string;
		description?: string;
	}) => {
		try {
			await updateFamily(data);
			toast.success("Famiglia modificata con successo!");
			setShowCreateFamilyDialog(false);
			setEditingFamily(null);
		} catch (_error) {
			toast.error("Errore durante la modifica della famiglia");
		}
	};

	const _handleEditFamily = (family: any) => {
		setEditingFamily(family);
		setShowCreateFamilyDialog(true);
	};

	const handleAddChild = () => {
		if (!selectedFamilyId) {
			toast.error("Seleziona prima una famiglia");
			return;
		}
		setEditingChild(null);
		setShowAddChildDialog(true);
	};

	const handleEditChild = (child: any) => {
		setEditingChild(child);
		setShowAddChildDialog(true);
	};

	const handleAddChildSuccess = () => {
		// The query will automatically refetch due to cache invalidation
	};

	const handleAddPerson = () => {
		if (!selectedFamilyId) {
			toast.error("Seleziona prima una famiglia");
			return;
		}
		setEditingPerson(null);
		setShowAddPersonDialog(true);
	};

	const handleEditPerson = (person: any) => {
		setEditingPerson(person);
		setShowAddPersonDialog(true);
	};

	const handleAddPersonSubmit = async (data: any) => {
		try {
			await addAuthorizedPerson({
				familyId: selectedFamilyId,
				...data,
			});
			toast.success("Persona autorizzata aggiunta con successo!");
			setShowAddPersonDialog(false);
		} catch (_error) {
			toast.error("Errore durante l'aggiunta della persona");
		}
	};

	const handleUpdatePersonSubmit = async (data: any) => {
		try {
			await updateAuthorizedPerson(data);
			toast.success("Persona autorizzata modificata con successo!");
			setShowAddPersonDialog(false);
			setEditingPerson(null);
		} catch (_error) {
			toast.error("Errore durante la modifica della persona");
		}
	};

	const handleInviteParent = () => {
		if (!selectedFamilyId) {
			toast.error("Seleziona prima una famiglia");
			return;
		}
		setShowInviteParentDialog(true);
	};

	const _handleSendInvitationSubmit = async (data: {
		email?: string;
		phoneNumber?: string;
		message?: string;
	}) => {
		try {
			await sendInvitation({
				familyId: selectedFamilyId,
				...data,
			});
			toast.success("Invito inviato con successo!");
			setShowInviteParentDialog(false);
		} catch (_error) {
			toast.error("Errore durante l'invio dell'invito");
		}
	};

	return (
		<>
			<div className="space-y-6">
				<div className="flex items-center justify-between">
					<h2 className="text-2xl font-bold">Famiglia</h2>
					<div className="flex space-x-2">
						<button
							type="button"
							onClick={handleInviteParent}
							disabled={!selectedFamilyId}
							className="flex items-center space-x-2 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
						>
							<UserPlus size={16} />
							<span>Invita Genitore</span>
						</button>
						<button
							type="button"
							onClick={handleAddChild}
							disabled={!selectedFamilyId}
							className="flex items-center space-x-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
						>
							<Plus size={16} />
							<span>Aggiungi Bambino</span>
						</button>
						<button
							type="button"
							onClick={handleAddPerson}
							disabled={!selectedFamilyId}
							className="flex items-center space-x-2 rounded-md border px-4 py-2 text-sm font-medium hover:bg-accent disabled:opacity-50"
						>
							<Plus size={16} />
							<span>Aggiungi Persona</span>
						</button>
					</div>
				</div>

				{/* Family Selector */}
				<div className="rounded-lg border bg-card p-4">
					<div className="flex items-center justify-between mb-3">
						<h3 className="text-sm font-medium">
							{families.length > 1 ? "Seleziona Famiglia" : "Famiglia"}
						</h3>
						<button
							type="button"
							onClick={() => setShowCreateFamilyDialog(true)}
							className="flex items-center space-x-1 rounded-md bg-primary px-3 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90"
						>
							<Plus size={14} />
							<span>Nuova</span>
						</button>
					</div>
					{Array.isArray(families) && families.length > 0 ? (
						<div className="grid gap-2 md:grid-cols-3">
							{families
								.filter((familyData: any) => familyData?.family?.id)
								.map((familyData: any) => (
									<div
										key={familyData.family.id}
										role="button"
										tabIndex={0}
										onClick={() => {
											setSelectedFamilyId(familyData.family.id);
										}}
										onKeyDown={(e) => {
											if (e.key === "Enter" || e.key === " ") {
												e.preventDefault();
												setSelectedFamilyId(familyData.family.id);
											}
										}}
										className={`rounded-md border p-3 text-left transition-colors hover:bg-accent cursor-pointer ${
											selectedFamilyId === familyData.family.id
												? "border-primary bg-accent"
												: ""
										}`}
									>
										<div className="flex items-start justify-between">
											<div className="flex-1">
												<h4 className="font-medium">
													{familyData.family.name}
												</h4>
												{familyData.family.description && (
													<p className="text-sm text-muted-foreground">
														{familyData.family.description}
													</p>
												)}
											</div>
											<button
												type="button"
												onClick={(e) => {
													e.stopPropagation();
													setEditingFamily(familyData.family);
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
						<div className="text-center py-8">
							<p className="text-muted-foreground mb-4">
								Non hai ancora creato nessuna famiglia.
							</p>
							<button
								type="button"
								onClick={() => setShowCreateFamilyDialog(true)}
								className="flex items-center space-x-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 mx-auto"
							>
								<Plus size={16} />
								<span>Crea la tua prima famiglia</span>
							</button>
						</div>
					)}
				</div>

				{/* Children Section */}
				<div className="rounded-lg border bg-card p-6">
					<h3 className="mb-4 text-lg font-semibold">Figli</h3>
					{childrenLoading ? (
						<div className="flex items-center justify-center p-8">
							<Loader2 className="h-8 w-8 animate-spin" />
						</div>
					) : Array.isArray(children) && children.length > 0 ? (
						<div className="grid gap-4 md:grid-cols-2">
							{children
								.filter((child: any) => child?.id)
								.map((child: any) => (
									<div
										key={child.id}
										className="rounded-md border p-4 transition-colors hover:bg-accent"
									>
										<div className="flex items-start justify-between">
											<div className="flex-1">
												<h4 className="font-medium">
													{child.firstName} {child.lastName}
												</h4>
												<p className="text-sm text-muted-foreground">
													Nato:{" "}
													{new Date(child.birthDate).toLocaleDateString(
														"it-IT",
													)}
												</p>
												{child.birthPlace && (
													<p className="text-sm text-muted-foreground">
														Luogo: {child.birthPlace}
													</p>
												)}
												{child.allergies && (
													<p className="text-sm text-red-600">
														Allergie: {child.allergies}
													</p>
												)}
											</div>
											<button
												type="button"
												onClick={(e) => {
													e.stopPropagation();
													handleEditChild(child);
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
							Nessun figlio aggiunto. Aggiungi il primo figlio per iniziare!
						</p>
					)}
				</div>

				{/* Family Members/Parents Section */}
				<div className="rounded-lg border bg-card p-6">
					<h3 className="mb-4 text-lg font-semibold">
						Genitori della Famiglia
					</h3>
					{membersLoading ? (
						<div className="flex items-center justify-center p-8">
							<Loader2 className="h-8 w-8 animate-spin" />
						</div>
					) : Array.isArray(familyMembers) && familyMembers.length > 0 ? (
						<div className="grid gap-4 md:grid-cols-2">
							{familyMembers
								.filter((member: any) => member?.id)
								.map((member: any) => (
									<div
										key={member.id}
										className="rounded-md border p-4 transition-colors hover:bg-accent"
									>
										<div className="flex items-start justify-between">
											<div className="flex-1">
												<div className="flex items-center gap-2 mb-2">
													<User className="h-4 w-4" />
													<h4 className="font-medium">
														{member.user.name || "Nome non disponibile"}
													</h4>
													{member.isAdmin && (
														<span className="px-2 py-1 text-xs bg-primary text-primary-foreground rounded-full">
															Admin
														</span>
													)}
												</div>
												<p className="text-sm text-muted-foreground capitalize">
													{member.role === "parent" ? "Genitore" : "Tutore"}
												</p>
												{member.user.email && (
													<p className="text-sm text-muted-foreground">
														Email: {member.user.email}
													</p>
												)}
												{member.user.phoneNumber && (
													<p className="text-sm text-muted-foreground">
														Tel: {member.user.phoneNumber}
													</p>
												)}
												<p className="text-xs text-muted-foreground mt-1">
													Membro dal:{" "}
													{new Date(member.joinedAt).toLocaleDateString(
														"it-IT",
													)}
												</p>
											</div>
										</div>
									</div>
								))}
						</div>
					) : (
						<p className="text-center text-muted-foreground">
							Nessun genitore trovato per questa famiglia.
						</p>
					)}
				</div>

				{/* Authorized Persons Section */}
				<div className="rounded-lg border bg-card p-6">
					<h3 className="mb-4 text-lg font-semibold">Persone Autorizzate</h3>
					{personsLoading ? (
						<div className="flex items-center justify-center p-8">
							<Loader2 className="h-8 w-8 animate-spin" />
						</div>
					) : Array.isArray(authorizedPersons) &&
						authorizedPersons.length > 0 ? (
						<div className="grid gap-4 md:grid-cols-2">
							{authorizedPersons
								.filter((person: any) => person?.id)
								.map((person: any) => (
									<div
										key={person.id}
										className="rounded-md border p-4 transition-colors hover:bg-accent"
									>
										<div className="flex items-start justify-between">
											<div className="flex-1">
												<h4 className="font-medium">{person.fullName}</h4>
												<p className="text-sm text-muted-foreground">
													{person.relationship}
												</p>
												{person.phone && (
													<p className="text-sm text-muted-foreground">
														Tel: {person.phone}
													</p>
												)}
												{person.email && (
													<p className="text-sm text-muted-foreground">
														Email: {person.email}
													</p>
												)}
											</div>
											<button
												type="button"
												onClick={(e) => {
													e.stopPropagation();
													handleEditPerson(person);
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
							Nessuna persona autorizzata aggiunta.
						</p>
					)}
				</div>
			</div>

			{/* Create Family Dialog */}
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

			{/* Add Child Dialog */}
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

			{/* Add Person Dialog */}
			<AggiungiModificaPersonaDialog
				open={showAddPersonDialog}
				onOpenChange={(open) => {
					setShowAddPersonDialog(open);
					if (!open) setEditingPerson(null);
				}}
				familyId={selectedFamilyId}
				onAddPerson={handleAddPersonSubmit}
				onUpdatePerson={handleUpdatePersonSubmit}
				person={editingPerson}
			/>

			{/* Invite Parent Dialog */}
			<InvitaGenitoreDialog
				open={showInviteParentDialog}
				onOpenChange={setShowInviteParentDialog}
				famiglia={
					Array.isArray(families)
						? families.find(
								(f: any) => f?.family && f.family.id === selectedFamilyId,
							)?.family
						: undefined
				}
			/>
		</>
	);
}
