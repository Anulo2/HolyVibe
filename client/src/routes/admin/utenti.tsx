import { createFileRoute, redirect } from "@tanstack/react-router";
import {
	type ColumnDef,
	type ColumnFiltersState,
	flexRender,
	getCoreRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	type SortingState,
	useReactTable,
	type VisibilityState,
} from "@tanstack/react-table";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import {
	Calendar,
	Eye,
	Mail,
	MoreHorizontal,
	Phone,
	Shield,
	User,
	UserCheck,
	Users,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { DataTableColumnHeader } from "@/components/admin/data-table-column-header";
import { DataTablePagination } from "@/components/admin/data-table-pagination";
import { RoleGuard } from "@/components/admin/role-guard";
import { UserDetailsDialog } from "@/components/admin/user-details-dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	type UserWithRole,
	useUpdateUserRoleMutation,
	useUsersQuery,
} from "@/hooks/useUsersQuery";
import {
	getRoleColor,
	getRoleLabel,
	roleOptions,
} from "@/lib/users-table-config";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/utenti")({
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
	component: UtentiPage,
});

function UtentiPage() {
	const [sorting, setSorting] = useState<SortingState>([]);
	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
	const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
	const [rowSelection, setRowSelection] = useState({});
	const [selectedUser, setSelectedUser] = useState<UserWithRole | null>(null);
	const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

	// Simple search and role filters
	const [searchValue, setSearchValue] = useState("");
	const [roleFilter, setRoleFilter] = useState<string | null>(null);

	// Filter actions
	const clearFilters = () => {
		setSearchValue("");
		setRoleFilter(null);
	};

	// Mutations
	const updateUserRoleMutation = useUpdateUserRoleMutation();

	// Query params
	const queryParams = useMemo(() => {
		const params: any = {
			limit: 50,
			offset: 0,
		};

		// Apply search filter
		if (searchValue.trim()) {
			params.search = searchValue.trim();
		}

		// Apply role filter
		if (roleFilter) {
			params.role = roleFilter;
		}

		return params;
	}, [searchValue, roleFilter]);

	// Fetch users
	const { data: usersData, isLoading } = useUsersQuery(queryParams);
	const users = usersData?.users || [];
	const totalUsers = usersData?.total || 0;

	// Handle view details
	const handleViewDetails = (user: UserWithRole) => {
		setSelectedUser(user);
		setDetailsDialogOpen(true);
	};

	// Handle quick role update
	const handleQuickRoleUpdate = async (userId: string, newRole: string) => {
		try {
			await updateUserRoleMutation.mutateAsync({ userId, role: newRole });
			toast.success("Ruolo aggiornato con successo");
		} catch (error) {
			toast.error("Errore nell'aggiornamento del ruolo");
		}
	};

	// Table columns definition
	const columns: ColumnDef<UserWithRole>[] = [
		{
			id: "select",
			header: ({ table }) => (
				<Checkbox
					checked={
						table.getIsAllPageRowsSelected() ||
						(table.getIsSomePageRowsSelected() && "indeterminate")
					}
					onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
					aria-label="Select all"
				/>
			),
			cell: ({ row }) => (
				<Checkbox
					checked={row.getIsSelected()}
					onCheckedChange={(value) => row.toggleSelected(!!value)}
					aria-label="Select row"
				/>
			),
			enableSorting: false,
			enableHiding: false,
		},
		{
			accessorKey: "name",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Utente" />
			),
			cell: ({ row }) => {
				const user = row.original;
				return (
					<div className="flex items-center gap-3">
						<Avatar className="h-8 w-8">
							<AvatarFallback className="text-xs">
								{user.name
									? user.name
											.split(" ")
											.map((n) => n[0])
											.join("")
											.toUpperCase()
									: user.email[0].toUpperCase()}
							</AvatarFallback>
						</Avatar>
						<div>
							<div className="font-medium">
								{user.name || "Nome non specificato"}
							</div>
							<div className="text-sm text-muted-foreground flex items-center gap-1">
								<Mail className="h-3 w-3" />
								{user.email}
							</div>
						</div>
					</div>
				);
			},
		},
		{
			accessorKey: "phoneNumber",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Telefono" />
			),
			cell: ({ row }) => {
				const phoneNumber = row.getValue("phoneNumber") as string;
				return phoneNumber ? (
					<div className="flex items-center gap-2">
						<Phone className="h-4 w-4 text-muted-foreground" />
						{phoneNumber}
					</div>
				) : (
					<span className="text-muted-foreground">-</span>
				);
			},
		},
		{
			accessorKey: "role",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Ruolo" />
			),
			cell: ({ row }) => {
				const role = row.getValue("role") as string;
				return (
					<Badge className={cn("flex items-center gap-1", getRoleColor(role))}>
						<Shield className="h-3 w-3" />
						{getRoleLabel(role)}
					</Badge>
				);
			},
		},
		{
			accessorKey: "createdAt",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Registrazione" />
			),
			cell: ({ row }) => {
				const date = row.getValue("createdAt") as string;
				return (
					<div className="flex items-center gap-2">
						<Calendar className="h-4 w-4 text-muted-foreground" />
						{format(new Date(date), "dd MMM yyyy", { locale: it })}
					</div>
				);
			},
		},
		{
			accessorKey: "joinedAt",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Ingresso" />
			),
			cell: ({ row }) => {
				const date = row.getValue("joinedAt") as string | null;
				return date ? (
					<div className="flex items-center gap-2">
						<UserCheck className="h-4 w-4 text-muted-foreground" />
						{format(new Date(date), "dd MMM yyyy", { locale: it })}
					</div>
				) : (
					<span className="text-muted-foreground">Non membro</span>
				);
			},
		},
		{
			id: "actions",
			enableHiding: false,
			cell: ({ row }) => {
				const user = row.original;

				return (
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="ghost" className="h-8 w-8 p-0">
								<span className="sr-only">Open menu</span>
								<MoreHorizontal className="h-4 w-4" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuLabel>Azioni</DropdownMenuLabel>
							<DropdownMenuItem onClick={() => handleViewDetails(user)}>
								<Eye className="mr-2 h-4 w-4" />
								Visualizza Dettagli
							</DropdownMenuItem>
							<DropdownMenuSeparator />
							<DropdownMenuLabel className="text-xs text-muted-foreground">
								Cambia Ruolo
							</DropdownMenuLabel>
							{roleOptions.map((role) => (
								<DropdownMenuItem
									key={role.value}
									onClick={() => handleQuickRoleUpdate(user.id, role.value)}
									disabled={user.role === role.value}
								>
									<role.icon className="mr-2 h-4 w-4" />
									{role.label}
								</DropdownMenuItem>
							))}
						</DropdownMenuContent>
					</DropdownMenu>
				);
			},
		},
	];

	// Create table
	const table = useReactTable({
		data: users,
		columns,
		onSortingChange: setSorting,
		onColumnFiltersChange: setColumnFilters,
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		onColumnVisibilityChange: setColumnVisibility,
		onRowSelectionChange: setRowSelection,
		state: {
			sorting,
			columnFilters,
			columnVisibility,
			rowSelection,
		},
	});

	return (
		<RoleGuard
			allowedRoles={["amministratore"]}
			fallback={
				<div className="p-6">
					<div className="text-center">
						<h1 className="text-2xl font-bold text-red-600 mb-4">
							Accesso Negato
						</h1>
						<p className="text-muted-foreground">
							Non hai i permessi per accedere a questa pagina.
						</p>
					</div>
				</div>
			}
		>
			<div className="space-y-6">
				{/* Header */}
				<div>
					<h1 className="text-3xl font-bold">Gestione Utenti</h1>
					<p className="text-muted-foreground">
						Gestisci gli utenti e i loro ruoli nella parrocchia.
					</p>
				</div>

				{/* Stats Cards */}
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium">
								Totale Utenti
							</CardTitle>
							<Users className="h-4 w-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">{totalUsers}</div>
							<p className="text-xs text-muted-foreground">Utenti registrati</p>
						</CardContent>
					</Card>
					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium">
								Amministratori
							</CardTitle>
							<Shield className="h-4 w-4 text-red-500" />
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">
								{users.filter((u) => u.role === "amministratore").length}
							</div>
							<p className="text-xs text-muted-foreground">Accesso completo</p>
						</CardContent>
					</Card>
					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium">Staff</CardTitle>
							<UserCheck className="h-4 w-4 text-blue-500" />
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">
								{
									users.filter((u) =>
										["editor", "animatore"].includes(u.role || ""),
									).length
								}
							</div>
							<p className="text-xs text-muted-foreground">
								Editor e animatori
							</p>
						</CardContent>
					</Card>
					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium">Genitori</CardTitle>
							<User className="h-4 w-4 text-green-500" />
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">
								{
									users.filter((u) => u.role === "genitore" || u.role === null)
										.length
								}
							</div>
							<p className="text-xs text-muted-foreground">Accesso base</p>
						</CardContent>
					</Card>
				</div>

				{/* Data Table */}
				<Card>
					<CardHeader>
						<CardTitle>Lista Utenti</CardTitle>
						<CardDescription>
							Visualizza e gestisci tutti gli utenti dell'organizzazione.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							{/* Simple Filters */}
							<div className="flex items-center gap-4 mb-4">
								<div className="flex-1">
									<input
										type="text"
										placeholder="Cerca per nome o email..."
										value={searchValue}
										onChange={(e) => setSearchValue(e.target.value)}
										className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
									/>
								</div>
								<select
									value={roleFilter || ""}
									onChange={(e) => setRoleFilter(e.target.value || null)}
									className="px-3 py-2 border border-border rounded-md bg-background text-foreground"
								>
									<option value="">Tutti i ruoli</option>
									{roleOptions.map((role) => (
										<option key={role.value} value={role.value}>
											{role.label}
										</option>
									))}
								</select>
								{(searchValue || roleFilter) && (
									<Button variant="outline" onClick={clearFilters}>
										Pulisci
									</Button>
								)}
							</div>

							{/* Table */}
							<div className="rounded-md border">
								<Table>
									<TableHeader>
										{table.getHeaderGroups().map((headerGroup) => (
											<TableRow key={headerGroup.id}>
												{headerGroup.headers.map((header) => (
													<TableHead key={header.id}>
														{header.isPlaceholder
															? null
															: flexRender(
																	header.column.columnDef.header,
																	header.getContext(),
																)}
													</TableHead>
												))}
											</TableRow>
										))}
									</TableHeader>
									<TableBody>
										{table.getRowModel().rows?.length ? (
											table.getRowModel().rows.map((row) => (
												<TableRow
													key={row.id}
													data-state={row.getIsSelected() && "selected"}
												>
													{row.getVisibleCells().map((cell) => (
														<TableCell key={cell.id}>
															{flexRender(
																cell.column.columnDef.cell,
																cell.getContext(),
															)}
														</TableCell>
													))}
												</TableRow>
											))
										) : (
											<TableRow>
												<TableCell
													colSpan={columns.length}
													className="h-24 text-center"
												>
													{isLoading ? (
														<div className="flex items-center justify-center">
															<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
														</div>
													) : (
														"Nessun utente trovato."
													)}
												</TableCell>
											</TableRow>
										)}
									</TableBody>
								</Table>
							</div>

							{/* Pagination */}
							<DataTablePagination table={table} />
						</div>
					</CardContent>
				</Card>
			</div>

			{/* User Details Modal */}
			<UserDetailsDialog
				user={selectedUser}
				open={detailsDialogOpen}
				onOpenChange={setDetailsDialogOpen}
			/>
		</RoleGuard>
	);
}
