"use client";

import { useQueries } from "@tanstack/react-query";
import { Baby, Heart, UserPlus } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { useFamiliesQuery } from "@/hooks/useFamilyQuery";
import { orpc } from "@/lib/orpc-react";
import { AggiungiModificaFiglioDialog } from "./aggiungi-modifica-figlio-dialog";
import { CreaFamigliaDialog } from "./crea-famiglia-dialog";
import { IscrizioneFiglioDialog } from "./iscrizione-figlio-dialog";

interface IscrizioneWrapperDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	evento: any;
}

type Step = "check" | "create-family" | "add-child" | "register";

export function IscrizioneWrapperDialog({
	open,
	onOpenChange,
	evento,
}: IscrizioneWrapperDialogProps) {
	const [currentStep, setCurrentStep] = useState<Step>("check");
	const [showCreateFamily, setShowCreateFamily] = useState(false);
	const [showAddChild, setShowAddChild] = useState(false);
	const [showRegistration, setShowRegistration] = useState(false);

	// Load family data
	const {
		data: families = [],
		isLoading: familiesLoading,
		refetch: refetchFamilies,
	} = useFamiliesQuery();

	// Load children from ALL families
	const childrenQueries = useQueries({
		queries: (families || []).map((family: any) => ({
			queryKey: ["family", family.id, "children"],
			queryFn: () => orpc.family.getChildren({ familyId: family.id }),
			enabled: !!family.id,
		})),
	});

	// Check if any query is loading
	const childrenLoading = childrenQueries.some((query) => query.isLoading);

	// Combine all children from all families
	const allChildren = childrenQueries
		.filter((query) => query.isSuccess && query.data)
		.flatMap((query, index) => {
			const family = families[index];
			const children = (query.data as any)?.data || [];
			return children.map((child: any) => ({
				...child,
				familyName: family?.family.name || "Famiglia sconosciuta",
			}));
		});

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

	// Get eligible children
	const eligibleChildren = allChildren.filter((child) =>
		isChildEligible(child.birthDate),
	);

	// Reset when dialog opens
	useEffect(() => {
		if (open) {
			setCurrentStep("check");
			setShowCreateFamily(false);
			setShowAddChild(false);
			setShowRegistration(false);
		}
	}, [open]);

	// Check conditions when data loads
	useEffect(() => {
		if (
			!familiesLoading &&
			!childrenLoading &&
			open &&
			currentStep === "check"
		) {
			if (families.length === 0) {
				// No family - need to create one
				setCurrentStep("create-family");
			} else if (eligibleChildren.length === 0) {
				// Has family but no eligible children - need to add a child
				setCurrentStep("add-child");
			} else {
				// Has family and eligible children - proceed to registration
				setCurrentStep("register");
			}
		}
	}, [
		familiesLoading,
		childrenLoading,
		families.length,
		eligibleChildren.length,
		open,
		currentStep,
	]);

	const handleCreateFamily = async (data: {
		name: string;
		description?: string;
	}) => {
		try {
			await orpc.family.create({
				name: data.name,
				description: data.description,
			});

			// Refetch families to get updated data
			await refetchFamilies();

			toast.success("Famiglia creata con successo!");
			setShowCreateFamily(false);

			// Move to next step - check if we need to add children
			setCurrentStep("add-child");
		} catch (error) {
			console.error("Error creating family:", error);
			toast.error("Errore nella creazione della famiglia");
			throw error;
		}
	};

	const handleAddChildSuccess = async () => {
		try {
			// Refetch families data to get updated children
			await refetchFamilies();

			toast.success("Figlio aggiunto con successo!");
			setShowAddChild(false);

			// Wait a moment for data to propagate, then move to registration
			setTimeout(() => {
				setCurrentStep("register");
			}, 500);
		} catch (error) {
			console.error("Error refreshing data:", error);
			// Still proceed to registration even if refresh fails
			setCurrentStep("register");
		}
	};

	const handleRegistrationComplete = () => {
		onOpenChange(false);
	};

	// Don't render anything if loading
	if (familiesLoading || childrenLoading) {
		return null;
	}

	// Show appropriate step
	if (currentStep === "register" || showRegistration) {
		return (
			<IscrizioneFiglioDialog
				open={open}
				onOpenChange={onOpenChange}
				evento={evento}
			/>
		);
	}

	return (
		<>
			<Dialog
				open={open && !showCreateFamily && !showAddChild}
				onOpenChange={onOpenChange}
			>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<DialogTitle className="text-center">
							Iscrizione a {evento?.title}
						</DialogTitle>
						<DialogDescription className="text-center">
							Prima di procedere con l'iscrizione, assicuriamoci che tu abbia
							tutto il necessario
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-4 mt-6">
						{currentStep === "create-family" && (
							<Card className="border-primary/20 bg-primary/5">
								<CardHeader className="text-center pb-3">
									<div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
										<Heart className="h-6 w-6 text-primary" />
									</div>
									<CardTitle className="text-lg">
										Crea la tua famiglia
									</CardTitle>
									<CardDescription>
										Per iscrivere un figlio agli eventi, devi prima creare una
										famiglia.
									</CardDescription>
								</CardHeader>
								<CardContent className="space-y-4">
									<div className="text-sm text-muted-foreground space-y-2">
										<p>• Potrai aggiungere i tuoi figli</p>
										<p>• Invitare altri genitori</p>
										<p>• Gestire le iscrizioni agli eventi</p>
									</div>
									<Button
										onClick={() => setShowCreateFamily(true)}
										className="w-full"
									>
										<Heart className="h-4 w-4 mr-2" />
										Crea Famiglia
									</Button>
								</CardContent>
							</Card>
						)}

						{currentStep === "add-child" && (
							<Card className="border-blue-200 bg-blue-50/50">
								<CardHeader className="text-center pb-3">
									<div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
										<Baby className="h-6 w-6 text-blue-600" />
									</div>
									<CardTitle className="text-lg">Aggiungi un figlio</CardTitle>
									<CardDescription>
										{eligibleChildren.length === 0 && allChildren.length === 0
											? "Non hai ancora aggiunto figli alla tua famiglia."
											: `Nessuno dei tuoi figli è idoneo per questo evento (età ${evento?.minAge}-${evento?.maxAge} anni).`}
									</CardDescription>
								</CardHeader>
								<CardContent className="space-y-4">
									<div className="text-sm text-muted-foreground space-y-2">
										<p>
											• Età richiesta: {evento?.minAge}-{evento?.maxAge} anni
										</p>
										<p>• I dati saranno salvati per future iscrizioni</p>
										<p>• Potrai modificarli in seguito</p>
										<p>• Dopo l'aggiunta procederemo con l'iscrizione</p>
									</div>
									<Button
										onClick={() => setShowAddChild(true)}
										className="w-full"
									>
										<Baby className="h-4 w-4 mr-2" />
										Aggiungi Figlio
									</Button>
								</CardContent>
							</Card>
						)}

						{/* Progress indicator */}
						<div className="flex items-center justify-center space-x-2 py-2">
							<div
								className={`w-2 h-2 rounded-full ${currentStep === "create-family" ? "bg-primary" : "bg-muted"}`}
							/>
							<div className="w-4 h-0.5 bg-muted" />
							<div
								className={`w-2 h-2 rounded-full ${currentStep === "add-child" ? "bg-primary" : "bg-muted"}`}
							/>
							<div className="w-4 h-0.5 bg-muted" />
							<div className="w-2 h-2 rounded-full bg-muted" />
						</div>

						<div className="flex gap-2 pt-4">
							<Button
								variant="outline"
								onClick={() => onOpenChange(false)}
								className="flex-1"
							>
								Annulla
							</Button>
							{(currentStep === "create-family" ||
								currentStep === "add-child") && (
								<Button
									variant="ghost"
									onClick={() => setCurrentStep("register")}
									className="flex-1"
								>
									Salta per ora
								</Button>
							)}
						</div>
					</div>
				</DialogContent>
			</Dialog>

			{/* Create Family Dialog */}
			<CreaFamigliaDialog
				open={showCreateFamily}
				onOpenChange={setShowCreateFamily}
				onCreateFamily={handleCreateFamily}
			/>

			{/* Add Child Dialog */}
			<AggiungiModificaFiglioDialog
				open={showAddChild}
				onOpenChange={setShowAddChild}
				familyId={families[0]?.family.id || ""}
				onSuccess={handleAddChildSuccess}
			/>
		</>
	);
}
