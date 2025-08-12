import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import {
	Building2,
	Calendar,
	ChevronLeft,
	ChevronRight,
	Edit,
	Eye,
	Filter,
	Globe,
	Mail,
	MapPin,
	MoreHorizontal,
	Phone,
	Plus,
	Search,
	Trash2,
	Users,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { CreateParishDialog } from "../../components/supreme-admin/CreateParishDialog";
import { EditParishDialog } from "../../components/supreme-admin/EditParishDialog";
import { ParishDetailsDialog } from "../../components/supreme-admin/ParishDetailsDialog";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "../../components/ui/alert-dialog";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "../../components/ui/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";
import { Input } from "../../components/ui/input";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "../../components/ui/table";
import { orpcClient } from "../../lib/orpc-client";

const searchSchema = z.object({
	page: z.number().min(1).optional().default(1),
	search: z.string().optional(),
	sortBy: z
		.enum(["name", "createdAt", "memberCount"])
		.optional()
		.default("createdAt"),
	sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

export const Route = createFileRoute("/supreme-admin/organizations")({
	validateSearch: searchSchema,
	component: SupremeAdminOrganizationsPage,
});

function SupremeAdminOrganizationsPage() {
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const { page, search, sortBy, sortOrder } = Route.useSearch();

	const [localSearch, setLocalSearch] = useState(search || "");
	const [selectedOrganization, setSelectedOrganization] = useState<any>(null);
	const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
	const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

	// Query for organizations
	const {
		data: organizationsData,
		isLoading,
		error,
	} = useQuery({
		queryKey: [
			"supreme-admin",
			"organizations",
			{ page, search, sortBy, sortOrder },
		],
		queryFn: () =>
			orpcClient.supremeAdmin.getAllOrganizations({
				page,
				limit: 20,
				search,
				sortBy,
				sortOrder,
			}),
	});

	// Mutation for deleting organization
	const deleteOrganizationMutation = useMutation({
		mutationFn: (data: { organizationId: string }) =>
			orpcClient.supremeAdmin.deleteOrganization(data),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ["supreme-admin", "organizations"],
			});
			toast.success("Parrocchia eliminata con successo");
		},
		onError: (error: any) => {
			toast.error(error.message || "Errore nell'eliminazione della parrocchia");
		},
	});

	const handleSearch = () => {
		navigate({
			to: "/supreme-admin/organizations",
			search: {
				search: localSearch || undefined,
				page: 1,
			},
		});
	};

	const handleSort = (newSortBy: "name" | "createdAt" | "memberCount") => {
		const newSortOrder =
			sortBy === newSortBy && sortOrder === "asc" ? "desc" : "asc";
		navigate({
			to: "/supreme-admin/organizations",
			search: {
				sortBy: newSortBy,
				sortOrder: newSortOrder,
				page: 1,
			},
		});
	};

	const handlePageChange = (newPage: number) => {
		navigate({
			to: "/supreme-admin/organizations",
			search: {
				page: newPage,
			},
		});
	};

	const handleDeleteOrganization = (organizationId: string) => {
		deleteOrganizationMutation.mutate({ organizationId });
	};

	const handleViewDetails = (organization: any) => {
		setSelectedOrganization(organization);
		setIsDetailsDialogOpen(true);
	};

	const handleEditOrganization = (organization: any) => {
		setSelectedOrganization(organization);
		setIsEditDialogOpen(true);
	};

	if (error) {
		return (
			<div className="container mx-auto py-6">
				<Card className="border-red-200">
					<CardContent className="pt-6">
						<div className="text-center text-red-600">
							<Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
							<h3 className="text-lg font-semibold mb-2">
								Errore nel caricamento
							</h3>
							<p className="text-sm">
								Non è stato possibile caricare le parrocchie.
							</p>
						</div>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className="container mx-auto py-6 space-y-6">
			{/* Header */}
			<div className="flex flex-col space-y-2">
				<div className="flex items-center space-x-2">
					<Building2 className="h-8 w-8 text-green-600" />
					<h1 className="text-3xl font-bold tracking-tight">
						Gestione Parrocchie
					</h1>
					<Badge variant="secondary" className="bg-green-100 text-green-800">
						Supreme Admin
					</Badge>
				</div>
				<p className="text-muted-foreground">
					Visualizza, modifica e gestisci tutte le parrocchie del sistema
				</p>
			</div>

			{/* Filters and Search */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center">
						<Filter className="h-5 w-5 mr-2" />
						Filtri e Ricerca
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="flex flex-col sm:flex-row gap-4">
						<div className="flex-1 relative">
							<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
							<Input
								placeholder="Cerca per nome, email o descrizione..."
								value={localSearch}
								onChange={(e) => setLocalSearch(e.target.value)}
								onKeyDown={(e) => e.key === "Enter" && handleSearch()}
								className="pl-10"
							/>
						</div>
						<Button onClick={handleSearch} disabled={isLoading}>
							Cerca
						</Button>
					</div>

					<div className="flex flex-wrap gap-3">
						<CreateParishDialog>
							<Button className="bg-green-600 hover:bg-green-700">
								<Plus className="h-4 w-4 mr-2" />
								Crea Nuova Parrocchia
							</Button>
						</CreateParishDialog>
					</div>
				</CardContent>
			</Card>

			{/* Organizations Table */}
			<Card>
				<CardHeader>
					<CardTitle>
						Parrocchie ({organizationsData?.pagination.total || 0})
					</CardTitle>
					<CardDescription>
						Pagina {organizationsData?.pagination.page || 1} di{" "}
						{organizationsData?.pagination.totalPages || 1}
					</CardDescription>
				</CardHeader>
				<CardContent>
					{isLoading ? (
						<div className="space-y-3">
							{Array.from({ length: 10 }).map((_, i) => (
								<div
									key={i}
									className="flex items-center space-x-4 p-4 border rounded animate-pulse"
								>
									<div className="h-12 w-12 bg-gray-200 rounded"></div>
									<div className="flex-1 space-y-2">
										<div className="h-4 bg-gray-200 rounded w-1/3"></div>
										<div className="h-3 bg-gray-200 rounded w-1/2"></div>
										<div className="h-3 bg-gray-200 rounded w-1/4"></div>
									</div>
									<div className="h-6 w-20 bg-gray-200 rounded"></div>
								</div>
							))}
						</div>
					) : (
						<>
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>
											<Button
												variant="ghost"
												onClick={() => handleSort("name")}
												className="h-8 p-0 font-semibold"
											>
												Nome
												{sortBy === "name" && (
													<span className="ml-1">
														{sortOrder === "asc" ? "↑" : "↓"}
													</span>
												)}
											</Button>
										</TableHead>
										<TableHead>Contatti</TableHead>
										<TableHead>
											<Button
												variant="ghost"
												onClick={() => handleSort("memberCount")}
												className="h-8 p-0 font-semibold"
											>
												Membri
												{sortBy === "memberCount" && (
													<span className="ml-1">
														{sortOrder === "asc" ? "↑" : "↓"}
													</span>
												)}
											</Button>
										</TableHead>
										<TableHead>Eventi</TableHead>
										<TableHead>
											<Button
												variant="ghost"
												onClick={() => handleSort("createdAt")}
												className="h-8 p-0 font-semibold"
											>
												Creata
												{sortBy === "createdAt" && (
													<span className="ml-1">
														{sortOrder === "asc" ? "↑" : "↓"}
													</span>
												)}
											</Button>
										</TableHead>
										<TableHead className="text-right">Azioni</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{organizationsData?.organizations.map((org) => (
										<TableRow key={org.id}>
											<TableCell>
												<div className="flex items-center space-x-3">
													<div className="h-10 w-10 bg-green-100 rounded flex items-center justify-center">
														{org.image ? (
															<img
																src={org.image}
																alt={org.name}
																className="h-10 w-10 rounded object-cover"
															/>
														) : (
															<Building2 className="h-5 w-5 text-green-600" />
														)}
													</div>
													<div>
														<p className="font-medium">{org.name}</p>
														{org.description && (
															<p className="text-sm text-muted-foreground line-clamp-1">
																{org.description}
															</p>
														)}
														{org.address && (
															<p className="text-xs text-muted-foreground flex items-center mt-1">
																<MapPin className="h-3 w-3 mr-1" />
																{org.address}
															</p>
														)}
													</div>
												</div>
											</TableCell>
											<TableCell>
												<div className="space-y-1">
													{org.email && (
														<div className="flex items-center space-x-2 text-sm">
															<Mail className="h-3 w-3 text-gray-400" />
															<span>{org.email}</span>
														</div>
													)}
													{org.phone && (
														<div className="flex items-center space-x-2 text-sm">
															<Phone className="h-3 w-3 text-gray-400" />
															<span>{org.phone}</span>
														</div>
													)}
													{org.website && (
														<div className="flex items-center space-x-2 text-sm">
															<Globe className="h-3 w-3 text-gray-400" />
															<a
																href={org.website}
																target="_blank"
																rel="noopener noreferrer"
																className="text-blue-600 hover:underline"
															>
																Sito web
															</a>
														</div>
													)}
													{!org.email && !org.phone && !org.website && (
														<span className="text-muted-foreground text-sm">
															Nessun contatto
														</span>
													)}
												</div>
											</TableCell>
											<TableCell>
												<div className="flex items-center space-x-2">
													<Users className="h-4 w-4 text-blue-600" />
													<span className="font-medium">{org.memberCount}</span>
												</div>
											</TableCell>
											<TableCell>
												<div className="flex items-center space-x-2">
													<Calendar className="h-4 w-4 text-orange-600" />
													<span className="font-medium">{org.eventCount}</span>
												</div>
											</TableCell>
											<TableCell>
												{format(new Date(org.createdAt), "dd/MM/yyyy", {
													locale: it,
												})}
											</TableCell>
											<TableCell className="text-right">
												<DropdownMenu>
													<DropdownMenuTrigger asChild>
														<Button variant="ghost" className="h-8 w-8 p-0">
															<MoreHorizontal className="h-4 w-4" />
														</Button>
													</DropdownMenuTrigger>
													<DropdownMenuContent align="end">
														<DropdownMenuLabel>Azioni</DropdownMenuLabel>
														<DropdownMenuItem
															onClick={() => handleViewDetails(org)}
														>
															<Eye className="h-4 w-4 mr-2" />
															Visualizza Dettagli
														</DropdownMenuItem>
														<DropdownMenuItem
															onClick={() => handleEditOrganization(org)}
														>
															<Edit className="h-4 w-4 mr-2" />
															Modifica
														</DropdownMenuItem>

														<DropdownMenuSeparator />

														<AlertDialog>
															<AlertDialogTrigger asChild>
																<DropdownMenuItem
																	onSelect={(e) => e.preventDefault()}
																	className="text-red-600 focus:text-red-600"
																>
																	<Trash2 className="h-4 w-4 mr-2" />
																	Elimina Parrocchia
																</DropdownMenuItem>
															</AlertDialogTrigger>
															<AlertDialogContent>
																<AlertDialogHeader>
																	<AlertDialogTitle>
																		Eliminare la parrocchia?
																	</AlertDialogTitle>
																	<AlertDialogDescription>
																		Questa azione eliminerà definitivamente la
																		parrocchia "{org.name}" e tutti i suoi dati
																		associati. Tutti i membri, eventi e
																		registrazioni verranno eliminati. Questa
																		azione non può essere annullata.
																	</AlertDialogDescription>
																</AlertDialogHeader>
																<AlertDialogFooter>
																	<AlertDialogCancel>Annulla</AlertDialogCancel>
																	<AlertDialogAction
																		onClick={() =>
																			handleDeleteOrganization(org.id)
																		}
																		disabled={
																			deleteOrganizationMutation.isPending
																		}
																		className="bg-red-600 hover:bg-red-700"
																	>
																		{deleteOrganizationMutation.isPending
																			? "Eliminando..."
																			: "Elimina"}
																	</AlertDialogAction>
																</AlertDialogFooter>
															</AlertDialogContent>
														</AlertDialog>
													</DropdownMenuContent>
												</DropdownMenu>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>

							{/* Pagination */}
							{organizationsData &&
								organizationsData.pagination.totalPages > 1 && (
									<div className="flex items-center justify-between mt-6">
										<div className="text-sm text-muted-foreground">
											Visualizzando{" "}
											{(organizationsData.pagination.page - 1) * 20 + 1} -{" "}
											{Math.min(
												organizationsData.pagination.page * 20,
												organizationsData.pagination.total,
											)}{" "}
											di {organizationsData.pagination.total} parrocchie
										</div>
										<div className="flex items-center space-x-2">
											<Button
												variant="outline"
												size="sm"
												onClick={() => handlePageChange(page - 1)}
												disabled={page <= 1}
											>
												<ChevronLeft className="h-4 w-4" />
											</Button>
											<span className="text-sm">
												Pagina {page} di{" "}
												{organizationsData.pagination.totalPages}
											</span>
											<Button
												variant="outline"
												size="sm"
												onClick={() => handlePageChange(page + 1)}
												disabled={
													page >= organizationsData.pagination.totalPages
												}
											>
												<ChevronRight className="h-4 w-4" />
											</Button>
										</div>
									</div>
								)}
						</>
					)}
				</CardContent>
			</Card>

			{/* Dialog per visualizzare dettagli */}
			<ParishDetailsDialog
				organization={selectedOrganization}
				open={isDetailsDialogOpen}
				onOpenChange={setIsDetailsDialogOpen}
			>
				<div />
			</ParishDetailsDialog>

			{/* Dialog per modificare parrocchia */}
			<EditParishDialog
				organization={selectedOrganization}
				open={isEditDialogOpen}
				onOpenChange={setIsEditDialogOpen}
			>
				<div />
			</EditParishDialog>
		</div>
	);
}
