import { Link, useNavigate } from "@tanstack/react-router";
import {
	Baby,
	Building,
	Calendar,
	CalendarDays,
	Loader2,
	LogOut,
	Plus,
	Settings,
	UserPlus,
	Users,
} from "lucide-react";
import { useEffect, useId, useState } from "react";
import { toast } from "sonner";
import { CreaFamigliaDialog } from "@/components/crea-famiglia-dialog";
import {
	useAddAuthorizedPersonMutation,
	useAddChildMutation,
	useCreateFamilyMutation,
	useFamiliesQuery,
	useFamilyAuthorizedPersonsQuery,
	useFamilyChildrenQuery,
} from "../hooks/useFamilyQuery";
import { useUserProfileMutation } from "../hooks/useUserQuery";
import { authClient, type Session, type User } from "../lib/auth-client";

// Simple Modal Component
interface ModalProps {
	children: React.ReactNode;
	onClose: () => void;
}

const Modal = ({ children, onClose }: ModalProps) => (
	<div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
		<div
			className="rounded-lg bg-card p-6 shadow-lg"
			onClick={(e) => e.stopPropagation()}
		>
			{children}
		</div>
	</div>
);

// User Profile Update Form
interface ProfileFormProps {
	user: User;
	onUpdate: (user: User) => void;
	onClose: () => void;
}

const ProfileForm = ({ user, onUpdate, onClose }: ProfileFormProps) => {
	const nameId = useId();
	const birthDateId = useId();
	const [name, setName] = useState(user?.name || "");
	const [birthDate, setBirthDate] = useState(user?.birthDate || "");

	const { mutateAsync: updateProfile } = useUserProfileMutation();

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		try {
			const result = await updateProfile({
				name,
				birthDate,
			});

			toast.success("Profilo aggiornato con successo!");
			onUpdate({ ...user, name, birthDate }); // Update user state in parent
			onClose();
		} catch (err) {
			const errorMessage =
				err instanceof Error
					? err.message
					: "Errore durante l'aggiornamento del profilo";
			toast.error(errorMessage);
		}
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-4">
			<h2 className="text-xl font-bold">Completa il tuo profilo</h2>
			<p className="text-sm text-muted-foreground">
				Per favore, inserisci i tuoi dati per continuare.
			</p>
			<div>
				<label htmlFor={nameId} className="block text-sm font-medium">
					Nome e Cognome
				</label>
				<input
					id={nameId}
					type="text"
					value={name}
					onChange={(e) => setName(e.target.value)}
					className="mt-1 block w-full rounded-md border-gray-600 bg-background p-2"
					required
				/>
			</div>
			<div>
				<label htmlFor={birthDateId} className="block text-sm font-medium">
					Data di Nascita
				</label>
				<input
					id={birthDateId}
					type="date"
					value={birthDate}
					onChange={(e) => setBirthDate(e.target.value)}
					className="mt-1 block w-full rounded-md border-gray-600 bg-background p-2"
					required
				/>
			</div>
			<div className="flex justify-end space-x-2">
				<button
					type="submit"
					className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
				>
					Salva
				</button>
			</div>
		</form>
	);
};

interface DashboardProps {
	session: Session;
}

export default function Dashboard({ session }: DashboardProps) {
	const navigate = useNavigate();
	const [currentUser, setCurrentUser] = useState(session?.user);
	const [showProfileModal, setShowProfileModal] = useState(false);
	const [showCreateFamilyDialog, setShowCreateFamilyDialog] = useState(false);

	// Check if user profile is incomplete on mount
	useEffect(() => {
		if (currentUser && !currentUser.name) {
			setShowProfileModal(true);
		}
	}, [currentUser]);

	const [activeTab, setActiveTab] = useState("overview");
	const [selectedFamilyId, setSelectedFamilyId] = useState<string>("");

	// Use the new oRPC hooks
	const { data: families = [], isLoading: familiesLoading } =
		useFamiliesQuery();
	const { mutateAsync: createFamily } = useCreateFamilyMutation();

	const { data: children = [], isLoading: childrenLoading } =
		useFamilyChildrenQuery(selectedFamilyId);
	const { mutateAsync: addChild } = useAddChildMutation();

	const { data: authorizedPersons = [], isLoading: personsLoading } =
		useFamilyAuthorizedPersonsQuery(selectedFamilyId);
	const { mutateAsync: addAuthorizedPerson } = useAddAuthorizedPersonMutation();

	useEffect(() => {
		if (families.length > 0 && !selectedFamilyId) {
			setSelectedFamilyId(families[0].id);
		}
	}, [families, selectedFamilyId]);

	const handleSignOut = async () => {
		try {
			await authClient.signOut();
			toast.success("Disconnesso con successo");
			// Navigate to login page
			navigate({ to: "/login" });
		} catch (error) {
			toast.error("Errore durante la disconnessione");
		}
	};

	const handleCreateOrganization = async () => {
		// TODO: Implement organization creation with oRPC
		toast.info("Creazione parrocchia non ancora implementata con oRPC");
	};

	const handleCreateFamilySubmit = async (data: {
		name: string;
		description?: string;
	}) => {
		try {
			console.log("Dashboard: Calling createFamily with data:", data);
			await createFamily(data);
			console.log("Dashboard: Family creation completed");
			setShowCreateFamilyDialog(false);
			toast.success("Famiglia creata con successo!");
		} catch (error) {
			console.error("Dashboard: Error in handleCreateFamilySubmit:", error);
			toast.error("Errore durante la creazione della famiglia");
		}
	};

	const handleAddChild = async () => {
		if (!selectedFamilyId) {
			toast.error("Seleziona prima una famiglia");
			return;
		}

		try {
			const firstName = prompt("Nome del bambino:");
			const lastName = prompt("Cognome del bambino:");
			const birthDate = prompt("Data di nascita (YYYY-MM-DD):");

			if (!firstName || !lastName || !birthDate) return;

			await addChild({
				familyId: selectedFamilyId,
				firstName,
				lastName,
				birthDate,
			});
			toast.success("Bambino aggiunto con successo!");
		} catch (error) {
			toast.error("Errore durante l'aggiunta del bambino");
		}
	};

	const handleAddPerson = async () => {
		if (!selectedFamilyId) {
			toast.error("Seleziona prima una famiglia");
			return;
		}

		try {
			const fullName = prompt("Nome completo:");
			const relationship = prompt("Relazione (es. Nonno, Nonna, Zio):");

			if (!fullName || !relationship) return;

			await addAuthorizedPerson({
				familyId: selectedFamilyId,
				fullName,
				relationship,
			});
			toast.success("Persona autorizzata aggiunta con successo!");
		} catch (error) {
			toast.error("Errore durante l'aggiunta della persona autorizzata");
		}
	};

	// Calculate totals for overview
	const totalChildren = children.length;
	const totalPersons = authorizedPersons.length;
	const totalFamilies = families.length;

	return (
		<>
			{showProfileModal && (
				<Modal onClose={() => setShowProfileModal(false)}>
					<ProfileForm
						user={currentUser}
						onUpdate={setCurrentUser}
						onClose={() => setShowProfileModal(false)}
					/>
				</Modal>
			)}

			<div className="min-h-screen bg-background">
				{/* Header */}
				<header className="border-b bg-card">
					<div className="container mx-auto flex h-16 items-center justify-between px-4">
						<div className="flex items-center space-x-4">
							<h1 className="text-xl font-bold">Family Management</h1>
							{familiesLoading && (
								<Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
							)}
						</div>

						<div className="flex items-center space-x-4">
							<span className="text-sm text-muted-foreground">
								Ciao, {currentUser?.name || currentUser?.phoneNumber}
							</span>
							<button
								type="button"
								onClick={handleSignOut}
								className="flex items-center space-x-2 rounded-md px-3 py-2 text-sm hover:bg-accent"
							>
								<LogOut size={16} />
								<span>Esci</span>
							</button>
						</div>
					</div>
				</header>

				<div className="container mx-auto flex">
					{/* Sidebar */}
					<aside className="w-64 border-r bg-card p-4">
						<nav className="space-y-2">
							<button
								onClick={() => setActiveTab("overview")}
								className={`flex w-full items-center space-x-3 rounded-md px-3 py-2 text-left text-sm transition-colors ${
									activeTab === "overview"
										? "bg-primary text-primary-foreground"
										: "hover:bg-accent"
								}`}
							>
								<Users size={16} />
								<span>Panoramica</span>
							</button>

							<button
								onClick={() => setActiveTab("family")}
								className={`flex w-full items-center space-x-3 rounded-md px-3 py-2 text-left text-sm transition-colors ${
									activeTab === "family"
										? "bg-primary text-primary-foreground"
										: "hover:bg-accent"
								}`}
							>
								<Baby size={16} />
								<span>Famiglia</span>
							</button>

							<button
								onClick={() => setActiveTab("events")}
								className={`flex w-full items-center space-x-3 rounded-md px-3 py-2 text-left text-sm transition-colors ${
									activeTab === "events"
										? "bg-primary text-primary-foreground"
										: "hover:bg-accent"
								}`}
							>
								<Calendar size={16} />
								<span>Eventi</span>
							</button>

							<button
								onClick={() => setActiveTab("profile")}
								className={`flex w-full items-center space-x-3 rounded-md px-3 py-2 text-left text-sm transition-colors ${
									activeTab === "profile"
										? "bg-primary text-primary-foreground"
										: "hover:bg-accent"
								}`}
							>
								<Settings size={16} />
								<span>Profilo</span>
							</button>

							<button
								onClick={() => setActiveTab("parishes")}
								className={`flex w-full items-center space-x-3 rounded-md px-3 py-2 text-left text-sm transition-colors ${
									activeTab === "parishes"
										? "bg-primary text-primary-foreground"
										: "hover:bg-accent"
								}`}
							>
								<Building size={16} />
								<span>Parrocchie</span>
							</button>
						</nav>
					</aside>

					{/* Main Content */}
					<main className="flex-1 p-6">
						{activeTab === "overview" && (
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
											<Calendar className="h-8 w-8 text-primary" />
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
													className={`cursor-pointer rounded-md border p-4 transition-colors hover:bg-accent ${
														selectedFamilyId === family.id
															? "border-primary bg-accent"
															: ""
													}`}
													onClick={() => setSelectedFamilyId(family.id)}
												>
													<h4 className="font-medium">{family.name}</h4>
													{family.description && (
														<p className="text-sm text-muted-foreground">
															{family.description}
														</p>
													)}
												</div>
											))}
										</div>
									) : (
										<p className="text-center text-muted-foreground">
											Nessuna famiglia trovata. Crea la tua prima famiglia per
											iniziare!
										</p>
									)}
								</div>
							</div>
						)}

						{activeTab === "family" && (
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

								{selectedFamilyId ? (
									<div className="grid gap-6 md:grid-cols-2">
										{/* Children Section */}
										<div className="rounded-lg border bg-card p-6">
											<h3 className="mb-4 text-lg font-semibold">Bambini</h3>
											{childrenLoading ? (
												<div className="flex items-center justify-center p-4">
													<Loader2 className="h-6 w-6 animate-spin" />
												</div>
											) : children.length > 0 ? (
												<div className="space-y-3">
													{children.map((child) => (
														<div
															key={child.id}
															className="rounded-md border p-3"
														>
															<p className="font-medium">
																{child.firstName} {child.lastName}
															</p>
															<p className="text-sm text-muted-foreground">
																Nato:{" "}
																{new Date(child.birthDate).toLocaleDateString()}
															</p>
															{child.allergies && (
																<p className="text-xs text-orange-600">
																	Allergie: {child.allergies}
																</p>
															)}
														</div>
													))}
												</div>
											) : (
												<p className="text-center text-muted-foreground">
													Nessun bambino registrato
												</p>
											)}
										</div>

										{/* Authorized Persons Section */}
										<div className="rounded-lg border bg-card p-6">
											<h3 className="mb-4 text-lg font-semibold">
												Persone Autorizzate
											</h3>
											{personsLoading ? (
												<div className="flex items-center justify-center p-4">
													<Loader2 className="h-6 w-6 animate-spin" />
												</div>
											) : persons.length > 0 ? (
												<div className="space-y-3">
													{persons.map((person) => (
														<div
															key={person.id}
															className="rounded-md border p-3"
														>
															<p className="font-medium">{person.fullName}</p>
															<p className="text-sm text-muted-foreground">
																{person.relationship}
															</p>
															{person.phone && (
																<p className="text-xs text-muted-foreground">
																	Tel: {person.phone}
																</p>
															)}
														</div>
													))}
												</div>
											) : (
												<p className="text-center text-muted-foreground">
													Nessuna persona autorizzata
												</p>
											)}
										</div>
									</div>
								) : (
									<div className="rounded-lg border bg-card p-6">
										<p className="text-center text-muted-foreground">
											Seleziona una famiglia dalla panoramica per gestire
											bambini e persone autorizzate.
										</p>
									</div>
								)}
							</div>
						)}

						{activeTab === "events" && (
							<div className="space-y-6">
								<div className="flex items-center justify-between">
									<h2 className="text-2xl font-bold">Eventi</h2>
									<Link to="/eventi">
										<button className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
											Vedi tutti gli eventi
										</button>
									</Link>
								</div>

								<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
									{/* Sample events preview */}
									<div className="rounded-lg border bg-card p-4">
										<h3 className="font-semibold mb-2">
											Campo Estivo San Giuseppe
										</h3>
										<p className="text-sm text-muted-foreground mb-2">
											Campo estivo di una settimana nelle Dolomiti
										</p>
										<div className="flex items-center text-xs text-muted-foreground">
											<CalendarDays className="h-3 w-3 mr-1" />
											15-22 Luglio 2024
										</div>
										<div className="flex items-center text-xs text-muted-foreground mt-1">
											<Users className="h-3 w-3 mr-1" />
											18/30 partecipanti
										</div>
									</div>

									<div className="rounded-lg border bg-card p-4">
										<h3 className="font-semibold mb-2">
											Corso Preparazione Cresima
										</h3>
										<p className="text-sm text-muted-foreground mb-2">
											Corso di preparazione alla Cresima
										</p>
										<div className="flex items-center text-xs text-muted-foreground">
											<CalendarDays className="h-3 w-3 mr-1" />
											Settembre - Dicembre 2024
										</div>
										<div className="flex items-center text-xs text-muted-foreground mt-1">
											<Users className="h-3 w-3 mr-1" />
											12/25 partecipanti
										</div>
									</div>

									<div className="rounded-lg border bg-card p-4">
										<h3 className="font-semibold mb-2">
											Laboratorio Arte Sacra
										</h3>
										<p className="text-sm text-muted-foreground mb-2">
											Laboratorio di arte sacra per bambini
										</p>
										<div className="flex items-center text-xs text-muted-foreground">
											<CalendarDays className="h-3 w-3 mr-1" />
											5-9 Agosto 2024
										</div>
										<div className="flex items-center text-xs text-muted-foreground mt-1">
											<Users className="h-3 w-3 mr-1" />
											15/15 partecipanti (Completo)
										</div>
									</div>
								</div>

								<div className="text-center">
									<Link to="/eventi">
										<button className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-accent">
											Scopri tutti gli eventi disponibili →
										</button>
									</Link>
								</div>
							</div>
						)}

						{activeTab === "profile" && (
							<div className="space-y-6">
								<h2 className="text-2xl font-bold">Profilo</h2>

								<div className="rounded-lg border bg-card p-6">
									<div className="space-y-4">
										<div>
											<span className="text-sm font-medium">Nome</span>
											<p className="text-lg">
												{currentUser?.name || "Non specificato"}
											</p>
										</div>

										<div>
											<span className="text-sm font-medium">Email</span>
											<p className="text-lg">
												{currentUser?.email || "Non specificato"}
											</p>
										</div>

										<div>
											<span className="text-sm font-medium">
												Numero di telefono
											</span>
											<p className="text-lg">
												{currentUser?.phoneNumber || "Non specificato"}
											</p>
										</div>

										<div>
											<span className="text-sm font-medium">Verificato</span>
											<p className="text-lg">
												{currentUser?.phoneNumberVerified ? "Sì" : "No"}
											</p>
										</div>

										<button
											type="button"
											className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
										>
											Modifica Profilo
										</button>
									</div>
								</div>
							</div>
						)}

						{activeTab === "parishes" && (
							<div className="space-y-6">
								<div className="flex items-center justify-between">
									<h2 className="text-2xl font-bold">Gestione Parrocchie</h2>
									<button
										onClick={handleCreateOrganization}
										className="flex items-center space-x-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
									>
										<Plus size={16} />
										<span>Crea Parrocchia</span>
									</button>
								</div>
								<div className="rounded-lg border bg-card p-6">
									<p className="text-center text-muted-foreground">
										Elenco delle parrocchie (da implementare).
									</p>
								</div>
							</div>
						)}
					</main>
				</div>
			</div>

			{/* Create Family Dialog */}
			<CreaFamigliaDialog
				open={showCreateFamilyDialog}
				onOpenChange={setShowCreateFamilyDialog}
				onCreateFamily={handleCreateFamilySubmit}
			/>
		</>
	);
}
