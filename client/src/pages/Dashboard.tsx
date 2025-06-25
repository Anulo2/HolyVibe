import { useNavigate } from "@tanstack/react-router";
import {
	Baby,
	CalendarDays,
	Edit2,
	Loader2,
	Plus,
	UserPlus,
	Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AggiungiModificaFiglioDialog } from "@/components/aggiungi-modifica-figlio-dialog";
import { AggiungiModificaPersonaDialog } from "@/components/aggiungi-modifica-persona-dialog";
import { CreaFamigliaDialog } from "@/components/crea-famiglia-dialog";
import { useAddAuthorizedPersonMutation, useAddChildMutation, useCreateFamilyMutation, useFamiliesQuery, useFamilyAuthorizedPersonsQuery, useFamilyChildrenQuery, useUpdateFamilyMutation } from "../hooks/useFamilyQuery";
import { cn } from "@/lib/utils";
import { Route as dashboardRoute } from "@/routes/dashboard";

export default function Dashboard() {
	const navigate = useNavigate();
	const { auth } = dashboardRoute.useRouteContext();
	const [showCreateFamilyDialog, setShowCreateFamilyDialog] = useState(false);
	const [showAddChildDialog, setShowAddChildDialog] = useState(false);
	const [showAddPersonDialog, setShowAddPersonDialog] = useState(false);
	const [editingFamily, setEditingFamily] = useState<any>(null);
	const [editingChild, setEditingChild] = useState<any>(null);
	const [editingPerson, setEditingPerson] = useState<any>(null);

	const { data: families = [], isLoading: familiesLoading } = useFamiliesQuery();
	const [selectedFamilyId, setSelectedFamilyId] = useState<string | null>(null);

	const { data: children = [], isLoading: childrenLoading } = useFamilyChildrenQuery(selectedFamilyId);
	const { data: authorizedPersons = [], isLoading: personsLoading } = useFamilyAuthorizedPersonsQuery(selectedFamilyId);

	const createFamilyMutation = useCreateFamilyMutation();
	const updateFamilyMutation = useUpdateFamilyMutation();
	const addChildMutation = useAddChildMutation();
	const addAuthorizedPersonMutation = useAddAuthorizedPersonMutation();

	const totalFamilies = families.length;
	const totalChildren = families.reduce((acc, family) => acc + (family._count?.children || 0), 0);
	const totalPersons = families.reduce((acc, family) => acc + (family._count?.authorizedPersons || 0), 0);

	useEffect(() => {
		if (!selectedFamilyId && families.length > 0) {
			setSelectedFamilyId(families[0].id);
		}
	}, [families, selectedFamilyId]);

	const handleCreateFamilySubmit = async (data: { name: string; description?: string }) => {
		await createFamilyMutation.mutateAsync(data);
		setShowCreateFamilyDialog(false);
	};

	const handleAddChild = () => {
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

	const handleEditChild = (child: any) => {
		setEditingChild(child);
		setShowAddChildDialog(true);
	};

	const handleEditFamily = (family: any) => {
		setEditingFamily(family);
		setShowCreateFamilyDialog(true);
	};

	const handleUpdateFamilySubmit = async (data: { id: string; name: string; description?: string }) => {
		await updateFamilyMutation.mutateAsync(data);
		setShowCreateFamilyDialog(false);
		setEditingFamily(null);
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
									Eventi Attivi
								</p>
								<p className="text-2xl font-bold">0</p>
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
					<h3 className="mb-4 text-lg font-semibold">
						Le Tue Famiglie
					</h3>
					{familiesLoading ? (
						<div className="flex items-center justify-center p-8">
							<Loader2 className="h-8 w-8 animate-spin" />
						</div>
					) : families.length > 0 ? (
						<div className="grid gap-4 md:grid-cols-2">
							{families.map((family) => (
								<div
									key={family.id}
									className={cn(
										"cursor-pointer rounded-md border p-4 transition-colors hover:bg-accent",
										selectedFamilyId === family.id && "border-primary bg-accent"
									)}
								>
									<div className="flex items-start justify-between">
										<div
											className="flex-1"
											onClick={() => setSelectedFamilyId(family.id)}
										>
											<h4 className="font-medium">{family.name}</h4>
											{family.description && (
												<p className="text-sm text-muted-foreground">
													{family.description}
												</p>
											)}
										</div>
										<button
											onClick={(e) => {
												e.stopPropagation();
												handleEditFamily(family);
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
			<AggiungiModificaPersonaDialog
				open={showAddPersonDialog}
				onOpenChange={setShowAddPersonDialog}
				familyId={selectedFamilyId}
				onAddPerson={handleAddPersonSubmit}
				person={editingPerson}
			/>
		</>
	);
}
