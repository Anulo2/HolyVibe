import { createFileRoute, redirect } from "@tanstack/react-router";
import { Edit2, Loader2, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Layout } from "@/components/Layout";
import { CreaFamigliaDialog } from "@/components/crea-famiglia-dialog";
import { AggiungiModificaFiglioDialog } from "@/components/aggiungi-modifica-figlio-dialog";
import { AggiungiModificaPersonaDialog } from "@/components/aggiungi-modifica-persona-dialog";
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
	const currentUser = auth.data?.user;
	const [showCreateFamilyDialog, setShowCreateFamilyDialog] = useState(false);
	const [showAddChildDialog, setShowAddChildDialog] = useState(false);
	const [showAddPersonDialog, setShowAddPersonDialog] = useState(false);
	const [editingChild, setEditingChild] = useState<any>(null);
	const [editingFamily, setEditingFamily] = useState<any>(null);
	const [editingPerson, setEditingPerson] = useState<any>(null);
	const [selectedFamilyId, setSelectedFamilyId] = useState<string>("");

	// Use the new oRPC hooks
	const { data: families = [], isLoading: familiesLoading } =
		useFamiliesQuery();
	const { mutateAsync: createFamily } = useCreateFamilyMutation();
	const { mutateAsync: updateFamily } = useUpdateFamilyMutation();

	const { data: children = [], isLoading: childrenLoading } =
		useFamilyChildrenQuery(selectedFamilyId);
	const { mutateAsync: addChild } = useAddChildMutation();

	const { data: authorizedPersons = [], isLoading: personsLoading } =
		useFamilyAuthorizedPersonsQuery(selectedFamilyId);
	const { mutateAsync: addAuthorizedPerson } = useAddAuthorizedPersonMutation();
	const { mutateAsync: updateAuthorizedPerson } = useUpdateAuthorizedPersonMutation();

	useEffect(() => {
		if (families.length > 0 && !selectedFamilyId) {
			setSelectedFamilyId(families[0].id);
		}
	}, [families, selectedFamilyId]);

	const handleCreateFamilySubmit = async (data: { name: string; description?: string }) => {
		try {
			await createFamily(data);
			toast.success("Famiglia creata con successo!");
			setShowCreateFamilyDialog(false);
		} catch (error) {
			toast.error("Errore durante la creazione della famiglia");
		}
	};

	const handleUpdateFamilySubmit = async (data: { id: string; name: string; description?: string }) => {
		try {
			await updateFamily(data);
			toast.success("Famiglia modificata con successo!");
			setShowCreateFamilyDialog(false);
			setEditingFamily(null);
		} catch (error) {
			toast.error("Errore durante la modifica della famiglia");
		}
	};

	const handleEditFamily = (family: any) => {
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
		} catch (error) {
			toast.error("Errore durante l'aggiunta della persona");
		}
	};

	const handleUpdatePersonSubmit = async (data: any) => {
		try {
			await updateAuthorizedPerson(data);
			toast.success("Persona autorizzata modificata con successo!");
			setShowAddPersonDialog(false);
			setEditingPerson(null);
		} catch (error) {
			toast.error("Errore durante la modifica della persona");
		}
	};

	return (
		<>
			<div className="space-y-6">
				<div className="flex items-center justify-between">
					<h2 className="text-2xl font-bold">Famiglia</h2>
					<div className="flex space-x-2">
						<button
							onClick={handleAddChild}
							disabled={!selectedFamilyId}
							className="flex items-center space-x-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
						>
							<Plus size={16} />
							<span>Aggiungi Bambino</span>
						</button>
						<button
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
				{families.length > 1 && (
					<div className="rounded-lg border bg-card p-4">
						<h3 className="mb-3 text-sm font-medium">Seleziona Famiglia</h3>
						<div className="grid gap-2 md:grid-cols-3">
							{families.map((family) => (
								<button
									key={family.id}
									onClick={() => setSelectedFamilyId(family.id)}
									className={`rounded-md border p-3 text-left transition-colors hover:bg-accent ${
										selectedFamilyId === family.id
											? "border-primary bg-accent"
											: ""
									}`}
								>
									<p className="font-medium">{family.name}</p>
									{family.description && (
										<p className="text-xs text-muted-foreground">
											{family.description}
										</p>
									)}
								</button>
							))}
						</div>
					</div>
				)}

				{/* Children Section */}
				<div className="rounded-lg border bg-card p-6">
					<h3 className="mb-4 text-lg font-semibold">Figli</h3>
					{childrenLoading ? (
						<div className="flex items-center justify-center p-8">
							<Loader2 className="h-8 w-8 animate-spin" />
						</div>
					) : children.length > 0 ? (
						<div className="grid gap-4 md:grid-cols-2">
							{children.map((child) => (
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
												Nato: {new Date(child.birthDate).toLocaleDateString('it-IT')}
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

				{/* Authorized Persons Section */}
				<div className="rounded-lg border bg-card p-6">
					<h3 className="mb-4 text-lg font-semibold">Persone Autorizzate</h3>
					{personsLoading ? (
						<div className="flex items-center justify-center p-8">
							<Loader2 className="h-8 w-8 animate-spin" />
						</div>
					) : authorizedPersons.length > 0 ? (
						<div className="grid gap-4 md:grid-cols-2">
							{authorizedPersons.map((person) => (
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
		</>
	);
} 