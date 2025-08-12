import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import {
	Calendar,
	ChevronLeft,
	ChevronRight,
	Eye,
	Filter,
	Mail,
	MoreHorizontal,
	Phone,
	Search,
	Shield,
	ShieldCheck,
	Trash2,
	UserCheck,
	UserPlus,
	Users,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import {
	type SupremeAdminUser,
	UserDetailsDialog,
} from "../../components/supreme-admin/UserDetailsDialog";
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
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../../components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "../../components/ui/table";
import { useDeleteUserMutation } from "../../hooks/useUsersQuery";
import { authClient } from "../../lib/auth-client";
import { orpcClient } from "../../lib/orpc-client";

const searchSchema = z.object({
	page: z.number().min(1).optional().default(1),
	search: z.string().optional(),
	role: z.enum(["user", "admin"]).optional(),
	sortBy: z
		.enum(["name", "email", "createdAt"])
		.optional()
		.default("createdAt"),
	sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

export const Route = createFileRoute("/supreme-admin/users")({
	validateSearch: searchSchema,
	component: SupremeAdminUsersPage,
});

function SupremeAdminUsersPage() {
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const { page, search, role, sortBy, sortOrder } = Route.useSearch();

	const [localSearch, setLocalSearch] = useState(search || "");
	const [selectedUser, setSelectedUser] = useState<SupremeAdminUser | null>(
		null,
	);
	const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);

	// Query for users
	const {
		data: usersData,
		isLoading,
		error,
	} = useQuery({
		queryKey: [
			"supreme-admin",
			"users",
			{ page, search, role, sortBy, sortOrder },
		],
		queryFn: () =>
			orpcClient.supremeAdmin.getAllUsers({
				page,
				limit: 20,
				search,
				role,
				sortBy,
				sortOrder,
			}),
	});

	// Mutation for updating user role
	const updateUserRoleMutation = useMutation({
		mutationFn: (data: { userId: string; role: "user" | "admin" }) =>
			orpcClient.supremeAdmin.updateUserRole(data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["supreme-admin", "users"] });
			toast.success("Ruolo utente aggiornato con successo");
		},
		onError: (error: any) => {
			toast.error(error.message || "Errore nell'aggiornamento del ruolo");
		},
	});

	// Mutation for deleting user
	const deleteUserMutation = useDeleteUserMutation();

	// Function for impersonating a user using better-auth API
	const handleImpersonateUser = async (userId: string) => {
		try {
			await authClient.admin.impersonateUser({
				userId: userId,
			});
			toast.success("Impersonazione avviata");
			// Refresh page to reload with impersonated user session
			window.location.reload();
		} catch (error: any) {
			toast.error(error.message || "Errore nell'avvio dell'impersonazione");
		}
	};

	const handleViewUserDetails = (user: SupremeAdminUser) => {
		setSelectedUser(user);
		setIsDetailsDialogOpen(true);
	};

	const handleSearch = () => {
		navigate({
			to: "/supreme-admin/users",
			search: {
				search: localSearch || undefined,
				page: 1,
			},
		});
	};

	const handleRoleFilter = (newRole: string) => {
		navigate({
			to: "/supreme-admin/users",
			search: {
				role: newRole === "all" ? undefined : (newRole as "user" | "admin"),
				page: 1,
			},
		});
	};

	const handleSort = (newSortBy: "name" | "email" | "createdAt") => {
		const newSortOrder =
			sortBy === newSortBy && sortOrder === "asc" ? "desc" : "asc";
		navigate({
			to: "/supreme-admin/users",
			search: {
				sortBy: newSortBy,
				sortOrder: newSortOrder,
				page: 1,
			},
		});
	};

	const handlePageChange = (newPage: number) => {
		navigate({
			to: "/supreme-admin/users",
			search: {
				page: newPage,
			},
		});
	};

	const handleRoleChange = (userId: string, newRole: "user" | "admin") => {
		updateUserRoleMutation.mutate({ userId, role: newRole });
	};

	const handleDeleteUser = async (userId: string) => {
		try {
			await deleteUserMutation.mutateAsync(userId);
		} catch (error: any) {
			// Error handling is already done in the mutation
			console.error("Error deleting user:", error);
		}
	};

	if (error) {
		return (
			<div className="container mx-auto py-6">
				<Card className="border-red-200">
					<CardContent className="pt-6">
						<div className="text-center text-red-600">
							<Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
							<h3 className="text-lg font-semibold mb-2">
								Errore nel caricamento
							</h3>
							<p className="text-sm">
								Non è stato possibile caricare gli utenti.
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
					<Users className="h-8 w-8 text-blue-600" />
					<h1 className="text-3xl font-bold tracking-tight">Gestione Utenti</h1>
					<Badge variant="secondary" className="bg-purple-100 text-purple-800">
						Supreme Admin
					</Badge>
				</div>
				<p className="text-muted-foreground">
					Visualizza, modifica e gestisci tutti gli utenti del sistema
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
								placeholder="Cerca per nome, email o telefono..."
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
						<Select value={role || "all"} onValueChange={handleRoleFilter}>
							<SelectTrigger className="w-[180px]">
								<SelectValue placeholder="Filtra per ruolo" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">Tutti i ruoli</SelectItem>
								<SelectItem value="user">Utenti</SelectItem>
								<SelectItem value="admin">Supreme Admin</SelectItem>
							</SelectContent>
						</Select>

						<Button asChild>
							<Link to="/supreme-admin/users">
								<UserPlus className="h-4 w-4 mr-2" />
								Crea Supreme Admin (Presto Disponibile)
							</Link>
						</Button>
					</div>
				</CardContent>
			</Card>

			{/* Users Table */}
			<Card>
				<CardHeader>
					<CardTitle>Utenti ({usersData?.pagination.total || 0})</CardTitle>
					<CardDescription>
						Pagina {usersData?.pagination.page || 1} di{" "}
						{usersData?.pagination.totalPages || 1}
					</CardDescription>
				</CardHeader>
				<CardContent>
					{isLoading ? (
						<div className="space-y-3">
							{Array.from({ length: 10 }).map((_, i) => (
								<div
									key={i}
									className="flex items-center space-x-4 p-3 border rounded animate-pulse"
								>
									<div className="h-10 w-10 bg-gray-200 rounded-full"></div>
									<div className="flex-1 space-y-2">
										<div className="h-4 bg-gray-200 rounded w-1/4"></div>
										<div className="h-3 bg-gray-200 rounded w-1/3"></div>
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
										<TableHead>
											<Button
												variant="ghost"
												onClick={() => handleSort("email")}
												className="h-8 p-0 font-semibold"
											>
												Email
												{sortBy === "email" && (
													<span className="ml-1">
														{sortOrder === "asc" ? "↑" : "↓"}
													</span>
												)}
											</Button>
										</TableHead>
										<TableHead>Telefono</TableHead>
										<TableHead>Ruolo</TableHead>
										<TableHead>
											<Button
												variant="ghost"
												onClick={() => handleSort("createdAt")}
												className="h-8 p-0 font-semibold"
											>
												Registrato
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
									{usersData?.users.map((user) => (
										<TableRow key={user.id}>
											<TableCell>
												<div className="flex items-center space-x-3">
													<div className="h-8 w-8 bg-gray-200 rounded-full flex items-center justify-center">
														{user.name?.[0]?.toUpperCase() || "?"}
													</div>
													<div>
														<p className="font-medium">
															{user.name || "Nome non disponibile"}
														</p>
														{user.birthDate && (
															<p className="text-xs text-muted-foreground flex items-center">
																<Calendar className="h-3 w-3 mr-1" />
																{format(
																	new Date(user.birthDate),
																	"dd/MM/yyyy",
																	{ locale: it },
																)}
															</p>
														)}
													</div>
												</div>
											</TableCell>
											<TableCell>
												<div className="flex items-center space-x-2">
													<Mail className="h-4 w-4 text-gray-400" />
													<span>{user.email}</span>
													{user.emailVerified && (
														<Badge variant="outline" className="text-xs">
															Verificata
														</Badge>
													)}
												</div>
											</TableCell>
											<TableCell>
												{user.phoneNumber ? (
													<div className="flex items-center space-x-2">
														<Phone className="h-4 w-4 text-gray-400" />
														<span>{user.phoneNumber}</span>
														{user.phoneNumberVerified && (
															<Badge variant="outline" className="text-xs">
																Verificato
															</Badge>
														)}
													</div>
												) : (
													<span className="text-muted-foreground">
														Non disponibile
													</span>
												)}
											</TableCell>
											<TableCell>
												{user.role === "admin" ? (
													<Badge className="bg-purple-100 text-purple-800">
														<Shield className="h-3 w-3 mr-1" />
														Supreme Admin
													</Badge>
												) : (
													<Badge variant="secondary">Utente</Badge>
												)}
											</TableCell>
											<TableCell>
												{format(new Date(user.createdAt), "dd/MM/yyyy", {
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
															onClick={() => handleViewUserDetails(user)}
														>
															<Eye className="h-4 w-4 mr-2" />
															Visualizza Dettagli
														</DropdownMenuItem>

														{user.role !== "admin" && (
															<DropdownMenuItem
																onClick={() => handleImpersonateUser(user.id)}
															>
																<UserCheck className="h-4 w-4 mr-2" />
																Impersonifica Utente
															</DropdownMenuItem>
														)}

														<DropdownMenuSeparator />

														{user.role === "admin" ? (
															<AlertDialog>
																<AlertDialogTrigger asChild>
																	<DropdownMenuItem
																		onSelect={(e) => e.preventDefault()}
																	>
																		<Shield className="h-4 w-4 mr-2" />
																		Rimuovi Privilegi Admin
																	</DropdownMenuItem>
																</AlertDialogTrigger>
																<AlertDialogContent>
																	<AlertDialogHeader>
																		<AlertDialogTitle>
																			Rimuovere privilegi Supreme Admin?
																		</AlertDialogTitle>
																		<AlertDialogDescription>
																			Questa azione rimuoverà i privilegi di
																			Supreme Admin dall'utente{" "}
																			{user.name || user.email}. L'utente
																			diventerà un utente normale.
																		</AlertDialogDescription>
																	</AlertDialogHeader>
																	<AlertDialogFooter>
																		<AlertDialogCancel>
																			Annulla
																		</AlertDialogCancel>
																		<AlertDialogAction
																			onClick={() =>
																				handleRoleChange(user.id, "user")
																			}
																			disabled={
																				updateUserRoleMutation.isPending
																			}
																		>
																			Rimuovi Privilegi
																		</AlertDialogAction>
																	</AlertDialogFooter>
																</AlertDialogContent>
															</AlertDialog>
														) : (
															<AlertDialog>
																<AlertDialogTrigger asChild>
																	<DropdownMenuItem
																		onSelect={(e) => e.preventDefault()}
																	>
																		<ShieldCheck className="h-4 w-4 mr-2" />
																		Promuovi a Supreme Admin
																	</DropdownMenuItem>
																</AlertDialogTrigger>
																<AlertDialogContent>
																	<AlertDialogHeader>
																		<AlertDialogTitle>
																			Promuovere a Supreme Admin?
																		</AlertDialogTitle>
																		<AlertDialogDescription>
																			Questa azione darà all'utente{" "}
																			{user.name || user.email} i privilegi
																			massimi di Supreme Admin. Potrà gestire
																			tutti gli utenti e le parrocchie del
																			sistema.
																		</AlertDialogDescription>
																	</AlertDialogHeader>
																	<AlertDialogFooter>
																		<AlertDialogCancel>
																			Annulla
																		</AlertDialogCancel>
																		<AlertDialogAction
																			onClick={() =>
																				handleRoleChange(user.id, "admin")
																			}
																			disabled={
																				updateUserRoleMutation.isPending
																			}
																		>
																			Promuovi
																		</AlertDialogAction>
																	</AlertDialogFooter>
																</AlertDialogContent>
															</AlertDialog>
														)}

														<DropdownMenuSeparator />

														<AlertDialog>
															<AlertDialogTrigger asChild>
																<DropdownMenuItem
																	onSelect={(e) => e.preventDefault()}
																	className="text-destructive focus:text-destructive"
																>
																	<Trash2 className="h-4 w-4 mr-2" />
																	Elimina Utente
																</DropdownMenuItem>
															</AlertDialogTrigger>
															<AlertDialogContent>
																<AlertDialogHeader>
																	<AlertDialogTitle>
																		Eliminare definitivamente l'utente?
																	</AlertDialogTitle>
																	<AlertDialogDescription>
																		Questa azione eliminerà permanentemente
																		l'utente {user.name || user.email} e tutti i
																		suoi dati dal sistema. Questa azione non può
																		essere annullata.
																	</AlertDialogDescription>
																</AlertDialogHeader>
																<AlertDialogFooter>
																	<AlertDialogCancel>Annulla</AlertDialogCancel>
																	<AlertDialogAction
																		onClick={() => handleDeleteUser(user.id)}
																		disabled={deleteUserMutation.isPending}
																		className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
																	>
																		Elimina Definitivamente
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
							{usersData && usersData.pagination.totalPages > 1 && (
								<div className="flex items-center justify-between mt-6">
									<div className="text-sm text-muted-foreground">
										Visualizzando {(usersData.pagination.page - 1) * 20 + 1} -{" "}
										{Math.min(
											usersData.pagination.page * 20,
											usersData.pagination.total,
										)}{" "}
										di {usersData.pagination.total} utenti
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
											Pagina {page} di {usersData.pagination.totalPages}
										</span>
										<Button
											variant="outline"
											size="sm"
											onClick={() => handlePageChange(page + 1)}
											disabled={page >= usersData.pagination.totalPages}
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

			{/* User Details Dialog */}
			<UserDetailsDialog
				user={selectedUser}
				open={isDetailsDialogOpen}
				onOpenChange={setIsDetailsDialogOpen}
			/>
		</div>
	);
}
