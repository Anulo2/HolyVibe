import { createFileRoute, redirect, useSearch } from "@tanstack/react-router";
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
	AlertTriangle,
	Calendar,
	CheckCircle,
	Clock,
	CreditCard,
	Euro,
	Eye,
	Mail,
	MoreHorizontal,
	Phone,
	Plus,
	RefreshCcw,
	Trash2,
	Users,
	X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AdminManualRegistrationDialog } from "@/components/admin/admin-manual-registration-dialog";
import { DataTableColumnHeader } from "@/components/admin/data-table-column-header";
import { DataTablePagination } from "@/components/admin/data-table-pagination";
import { DataTableToolbar } from "@/components/admin/data-table-toolbar";
import { RegistrationDetailsDialog } from "@/components/admin/registration-details-dialog";
import { RoleGuard } from "@/components/admin/role-guard";
import {
	createTSTColumns,
	createTSTFilters,
	DataTableFilter,
	useDataTableFilters,
} from "@/components/data-table-filter";
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
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
} from "@/components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { useEventsQuery } from "@/hooks/useEventsQuery";
import {
	type RegistrationWithDetails,
	useDeleteRegistrationMutation,
	useRegistrationsQuery,
	useUpdateRegistrationMutation,
} from "@/hooks/useRegistrationsQuery";
import {
	createEventOptions,
	paymentStatusOptions,
	registrationsColumnsConfig,
	statusOptions,
} from "@/lib/registrations-table-config";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/iscrizioni")({
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
	component: IscrizioniPage,
	validateSearch: (search: Record<string, unknown>) => {
		return {
			eventId: search.eventId as string | undefined,
		};
	},
});

const _getStatusIcon = (status: string) => {
	switch (status) {
		case "confirmed":
			return <CheckCircle className="h-5 w-5 text-green-600" />;
		case "pending":
			return <Clock className="h-5 w-5 text-yellow-600" />;
		case "cancelled":
			return <X className="h-5 w-5 text-red-600" />;
		case "waitlist":
			return <AlertTriangle className="h-5 w-5 text-blue-600" />;
		default:
			return <Clock className="h-5 w-5 text-gray-600" />;
	}
};

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

const _getPaymentIcon = (status: string) => {
	switch (status) {
		case "completed":
			return <Euro className="h-5 w-5 text-green-600" />;
		case "pending":
			return <Clock className="h-5 w-5 text-yellow-600" />;
		case "failed":
			return <X className="h-5 w-5 text-red-600" />;
		case "refunded":
			return <RefreshCcw className="h-5 w-5 text-gray-600" />;
		default:
			return <CreditCard className="h-5 w-5 text-gray-600" />;
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

function IscrizioniPage() {
	const searchParams = useSearch({ from: "/admin/iscrizioni" });
	const [selectedRegistrationId, setSelectedRegistrationId] = useState<
		string | null
	>(null);
	const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
	const [selectedRows, setSelectedRows] = useState<string[]>([]);

	// TanStack Table state
	const [sorting, setSorting] = useState<SortingState>([]);
	const [_columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
	const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

	// Fetch all registrations for client-side filtering with proper number types
	const { data: registrationsData, isLoading } = useRegistrationsQuery({
		limit: 100, // Server max limit is 100
		offset: 0, // Ensure this is a number
	});

	// Fetch events for filter options
	const { data: eventsData } = useEventsQuery();

	// Mutation for updating registrations
	const updateRegistrationMutation = useUpdateRegistrationMutation();

	// Mutation for deleting registrations
	const deleteRegistrationMutation = useDeleteRegistrationMutation();

	// @ts-ignore - Temporary fix for new authorization fields
	const registrations = registrationsData?.registrations || [];

	// Transform events data for select options
	const eventsOptions = useMemo(() => {
		if (!eventsData?.data) return [];
		return createEventOptions(eventsData.data);
	}, [eventsData?.data]);

	// Create default filters based on URL params
	const defaultFilters = useMemo(() => {
		if (searchParams.eventId && eventsData?.data) {
			const event = eventsData.data.find(
				(e: any) => e.id === searchParams.eventId,
			);
			if (event) {
				return [
					{
						columnId: "eventTitle",
						type: "text" as const,
						operator: "contains" as const,
						values: [event.title],
					},
				];
			}
		}
		return [];
	}, [searchParams.eventId, eventsData?.data]);

	// Define the view details handler before using it in columns
	const handleViewDetails = (registrationId: string) => {
		setSelectedRegistrationId(registrationId);
		setDetailsDialogOpen(true);
	};

	// Handler to update registration status
	const handleStatusUpdate = async (
		registrationId: string,
		newStatus: string,
	) => {
		try {
			await updateRegistrationMutation.mutateAsync({
				id: registrationId,
				status: newStatus as "pending" | "confirmed" | "cancelled" | "waitlist",
			});

			toast.success("Stato iscrizione aggiornato con successo");
		} catch (error) {
			console.error("Failed to update registration status:", error);
			toast.error("Errore nell'aggiornamento dello stato dell'iscrizione");
		}
	};

	// Handler to update payment status
	const handlePaymentStatusUpdate = async (
		registrationId: string,
		newPaymentStatus: string,
	) => {
		try {
			await updateRegistrationMutation.mutateAsync({
				id: registrationId,
				paymentStatus: newPaymentStatus as
					| "pending"
					| "completed"
					| "failed"
					| "refunded",
			});

			toast.success("Stato pagamento aggiornato con successo");
		} catch (error) {
			console.error("Failed to update payment status:", error);
			toast.error("Errore nell'aggiornamento dello stato del pagamento");
		}
	};

	// Handler to cancel registration (change status)
	const handleCancelRegistration = async (registrationId: string) => {
		if (
			confirm(
				"Sei sicuro di voler cancellare questa iscrizione? Verrà contrassegnata come cancellata.",
			)
		) {
			try {
				toast.loading("Cancellazione in corso...", {
					id: `cancel-${registrationId}`,
				});
				await updateRegistrationMutation.mutateAsync({
					id: registrationId,
					status: "cancelled",
				});
				toast.success("Iscrizione cancellata con successo", {
					id: `cancel-${registrationId}`,
				});
			} catch (error) {
				console.error("Failed to cancel registration:", error);
				toast.error("Errore nella cancellazione dell'iscrizione", {
					id: `cancel-${registrationId}`,
				});
			}
		}
	};

	// Handler to delete registration permanently
	const handleDeleteRegistration = async (registrationId: string) => {
		if (
			confirm(
				"Sei sicuro di voler eliminare definitivamente questa iscrizione? Questa operazione NON può essere annullata!",
			)
		) {
			try {
				toast.loading("Eliminazione in corso...", {
					id: `delete-${registrationId}`,
				});
				await deleteRegistrationMutation.mutateAsync({
					id: registrationId,
				});
				toast.success("Iscrizione eliminata definitivamente", {
					id: `delete-${registrationId}`,
				});
				setSelectedRows((prev) => prev.filter((id) => id !== registrationId));
			} catch (error) {
				console.error("Failed to delete registration:", error);
				toast.error("Errore nell'eliminazione dell'iscrizione", {
					id: `delete-${registrationId}`,
				});
			}
		}
	};

	// Batch operations handlers
	const handleBatchStatusUpdate = async (newStatus: string) => {
		if (selectedRows.length === 0) return;

		if (
			confirm(
				`Vuoi aggiornare lo stato di ${selectedRows.length} iscrizioni a "${getStatusLabel(newStatus)}"?`,
			)
		) {
			try {
				// Update each selected registration
				const updatePromises = selectedRows.map((registrationId) =>
					updateRegistrationMutation.mutateAsync({
						id: registrationId,
						status: newStatus as
							| "pending"
							| "confirmed"
							| "cancelled"
							| "waitlist",
					}),
				);

				await Promise.all(updatePromises);
				setSelectedRows([]);
				toast.success(
					`${selectedRows.length} iscrizioni aggiornate con successo`,
				);
			} catch (error) {
				console.error("Failed to batch update status:", error);
				toast.error("Errore nell'aggiornamento batch delle iscrizioni");
			}
		}
	};

	const handleBatchDelete = async () => {
		if (selectedRows.length === 0) return;

		if (
			confirm(
				`Sei sicuro di voler eliminare definitivamente ${selectedRows.length} iscrizioni? Questa operazione NON può essere annullata!`,
			)
		) {
			try {
				toast.loading(
					`Eliminazione di ${selectedRows.length} iscrizioni in corso...`,
					{ id: "batch-delete" },
				);

				// Delete each selected registration completely
				const deletePromises = selectedRows.map((registrationId) =>
					deleteRegistrationMutation.mutateAsync({
						id: registrationId,
					}),
				);

				await Promise.all(deletePromises);
				setSelectedRows([]);

				toast.success(
					`${selectedRows.length} iscrizioni eliminate definitivamente`,
					{ id: "batch-delete" },
				);
			} catch (error) {
				console.error("Failed to batch delete:", error);
				toast.error("Errore nell'eliminazione batch delle iscrizioni", {
					id: "batch-delete",
				});
			}
		}
	};

	// Setup advanced data table filters with default filters from URL
	const {
		columns: filterColumns,
		filters,
		actions,
		strategy,
	} = useDataTableFilters({
		strategy: "client",
		data: registrations,
		columnsConfig: registrationsColumnsConfig as any,
		defaultFilters,
		options: {
			status: statusOptions,
			paymentStatus: paymentStatusOptions,
			eventTitle: eventsOptions,
		},
	});

	// Define TanStack Table columns
	const tstColumnDefs = useMemo<ColumnDef<RegistrationWithDetails>[]>(
		() => [
			{
				id: "select",
				header: ({ table }) => (
					<Checkbox
						checked={
							table.getIsAllPageRowsSelected() ||
							(table.getIsSomePageRowsSelected() && "indeterminate")
						}
						onCheckedChange={(value) =>
							table.toggleAllPageRowsSelected(!!value)
						}
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
				size: 40,
				enableSorting: false,
				enableHiding: false,
			},
			{
				id: "childName",
				accessorFn: (row) => `${row.child.firstName} ${row.child.lastName}`,
				header: ({ column }) => (
					<DataTableColumnHeader column={column} title="Bambino" />
				),
				size: 220,
				cell: ({ row }) => {
					const registration = row.original;
					const age =
						new Date().getFullYear() -
						new Date(registration.child.birthDate).getFullYear();
					return (
						<div className="min-w-0">
							<div className="font-medium text-sm truncate">
								{registration.child.firstName} {registration.child.lastName}
							</div>
							<div className="text-xs text-muted-foreground">{age} anni</div>
						</div>
					);
				},
			},
			{
				id: "parentName",
				accessorFn: (row) => row.parent.name,
				header: ({ column }) => (
					<DataTableColumnHeader column={column} title="Genitore" />
				),
				size: 200,
				cell: ({ row }) => {
					const registration = row.original;
					return (
						<div className="min-w-0">
							<div className="font-medium text-sm truncate">
								{registration.parent.name}
							</div>
							<div className="flex items-center gap-1 text-xs text-muted-foreground">
								<Mail className="h-3 w-3 shrink-0" />
								<span className="truncate">{registration.parent.email}</span>
							</div>
							{registration.parent.phoneNumber && (
								<div className="flex items-center gap-1 text-xs text-muted-foreground">
									<Phone className="h-3 w-3 shrink-0" />
									<span>{registration.parent.phoneNumber}</span>
								</div>
							)}
						</div>
					);
				},
			},
			{
				id: "eventTitle",
				accessorFn: (row) => row.event.title,
				header: ({ column }) => (
					<DataTableColumnHeader column={column} title="Evento" />
				),
				size: 180,
				cell: ({ row }) => {
					const registration = row.original;
					return (
						<div className="min-w-0">
							<div className="font-medium text-sm truncate">
								{registration.event.title}
							</div>
							<div className="text-xs text-muted-foreground">
								{format(new Date(registration.event.startDate), "dd/MM/yyyy", {
									locale: it,
								})}
							</div>
						</div>
					);
				},
			},
			{
				id: "status",
				accessorFn: (row) => row.status,
				header: ({ column }) => (
					<DataTableColumnHeader column={column} title="Stato" />
				),
				size: 140,
				cell: ({ row }) => {
					const registration = row.original;
					const status = registration.status;
					return (
						<TooltipProvider>
							<Tooltip>
								<TooltipTrigger asChild>
									<Select
										value={status}
										onValueChange={(newStatus) =>
											handleStatusUpdate(registration.id, newStatus)
										}
										disabled={updateRegistrationMutation.isPending}
									>
										<SelectTrigger
											className={cn(
												"w-full h-auto p-0 border-0 bg-transparent focus:ring-0 focus:ring-offset-0 data-[state=open]:ring-2 data-[state=open]:ring-ring",
												"[&>svg]:hidden cursor-pointer",
											)}
										>
											<Badge
												variant="outline"
												className={cn(
													"w-full capitalize border-transparent hover:opacity-80 transition-opacity",
													getStatusColor(status),
													updateRegistrationMutation.isPending && "opacity-50",
												)}
											>
												{updateRegistrationMutation.isPending
													? "Aggiornamento..."
													: getStatusLabel(status)}
											</Badge>
										</SelectTrigger>
										<SelectContent>
											{statusOptions.map((option) => {
												const Icon = option.icon as React.ElementType;
												return (
													<SelectItem key={option.value} value={option.value}>
														<div className="flex items-center gap-2">
															<Icon className="h-4 w-4" />
															{option.label}
														</div>
													</SelectItem>
												);
											})}
										</SelectContent>
									</Select>
								</TooltipTrigger>
								<TooltipContent>
									<p>Clicca per modificare lo stato</p>
								</TooltipContent>
							</Tooltip>
						</TooltipProvider>
					);
				},
			},
			{
				id: "paymentStatus",
				accessorFn: (row) => row.paymentStatus,
				header: ({ column }) => (
					<DataTableColumnHeader column={column} title="Pagamento" />
				),
				size: 140,
				cell: ({ row }) => {
					const registration = row.original;
					const paymentStatus = registration.paymentStatus;
					return (
						<TooltipProvider>
							<Tooltip>
								<TooltipTrigger asChild>
									<Select
										value={paymentStatus}
										onValueChange={(newPaymentStatus) =>
											handlePaymentStatusUpdate(
												registration.id,
												newPaymentStatus,
											)
										}
										disabled={updateRegistrationMutation.isPending}
									>
										<SelectTrigger
											className={cn(
												"w-full h-auto p-0 border-0 bg-transparent focus:ring-0 focus:ring-offset-0 data-[state=open]:ring-2 data-[state=open]:ring-ring",
												"[&>svg]:hidden cursor-pointer",
											)}
										>
											<Badge
												variant="outline"
												className={cn(
													"w-full capitalize border-transparent hover:opacity-80 transition-opacity",
													getPaymentStatusColor(paymentStatus),
													updateRegistrationMutation.isPending && "opacity-50",
												)}
											>
												{updateRegistrationMutation.isPending
													? "Aggiornamento..."
													: getPaymentStatusLabel(paymentStatus)}
											</Badge>
										</SelectTrigger>
										<SelectContent>
											{paymentStatusOptions.map((option) => {
												const Icon = option.icon as React.ElementType;
												return (
													<SelectItem key={option.value} value={option.value}>
														<div className="flex items-center gap-2">
															<Icon className="h-4 w-4" />
															{option.label}
														</div>
													</SelectItem>
												);
											})}
										</SelectContent>
									</Select>
								</TooltipTrigger>
								<TooltipContent>
									<p>Clicca per modificare lo stato del pagamento</p>
								</TooltipContent>
							</Tooltip>
						</TooltipProvider>
					);
				},
			},
			{
				id: "familyName",
				accessorFn: (row) => row.family.name,
				header: ({ column }) => (
					<DataTableColumnHeader column={column} title="Famiglia" />
				),
				size: 120,
				cell: ({ row }) => {
					const registration = row.original;
					return (
						<div className="min-w-0">
							<div className="text-sm font-medium truncate">
								{registration.family.name}
							</div>
						</div>
					);
				},
			},
			{
				id: "registrationDate",
				accessorFn: (row) => new Date(row.registrationDate),
				header: ({ column }) => (
					<DataTableColumnHeader column={column} title="Data Iscrizione" />
				),
				size: 140,
				cell: ({ row }) => {
					const registration = row.original;
					return (
						<div className="text-sm">
							{format(new Date(registration.registrationDate), "dd/MM/yyyy", {
								locale: it,
							})}
						</div>
					);
				},
			},
			{
				id: "eventStartDate",
				accessorFn: (row) => new Date(row.event.startDate),
				header: ({ column }) => (
					<DataTableColumnHeader column={column} title="Data Evento" />
				),
				size: 140,
				cell: ({ row }) => {
					const registration = row.original;
					return (
						<div className="text-sm">
							{format(new Date(registration.event.startDate), "dd/MM/yyyy", {
								locale: it,
							})}
						</div>
					);
				},
			},
			{
				id: "actions",
				header: "Azioni",
				size: 80,
				enableHiding: false,
				enableSorting: false,
				cell: ({ row }) => {
					const registration = row.original;
					return (
						<div className="flex items-center justify-center gap-1">
							<TooltipProvider>
								<Tooltip>
									<TooltipTrigger asChild>
										<Button
											variant="ghost"
											size="sm"
											className="h-7 w-7 p-0"
											onClick={() => handleViewDetails(registration.id)}
										>
											<Eye className="h-4 w-4" />
										</Button>
									</TooltipTrigger>
									<TooltipContent>
										<p>Visualizza dettagli</p>
									</TooltipContent>
								</Tooltip>
							</TooltipProvider>

							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button variant="ghost" size="sm" className="h-7 w-7 p-0">
										<MoreHorizontal className="h-4 w-4" />
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent align="end" className="w-48">
									<DropdownMenuLabel className="text-xs">
										Azioni Rapide
									</DropdownMenuLabel>
									<DropdownMenuSeparator />

									{registration.status !== "cancelled" && (
										<DropdownMenuItem
											onClick={() => handleCancelRegistration(registration.id)}
											className="text-xs text-orange-600 focus:text-orange-600"
											disabled={updateRegistrationMutation.isPending}
										>
											<X className="h-3 w-3 mr-2" />
											Cancella iscrizione
										</DropdownMenuItem>
									)}

									<DropdownMenuItem
										onClick={() => handleDeleteRegistration(registration.id)}
										className="text-xs text-red-600 focus:text-red-600"
										disabled={deleteRegistrationMutation.isPending}
									>
										<Trash2 className="h-3 w-3 mr-2" />
										Elimina definitivamente
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						</div>
					);
				},
			},
		],
		[
			handleViewDetails,
			handleStatusUpdate,
			handlePaymentStatusUpdate,
			handleCancelRegistration,
			handleDeleteRegistration,
			updateRegistrationMutation,
			deleteRegistrationMutation,
		],
	);

	// Apply filter functions to columns using createTSTColumns
	const tstColumns = useMemo(
		() =>
			createTSTColumns({
				columns: tstColumnDefs,
				configs: registrationsColumnsConfig as any,
			}),
		[tstColumnDefs],
	);

	// Create TanStack Table filters
	const tstFilters = useMemo(() => createTSTFilters(filters), [filters]);

	// Setup TanStack Table
	const table = useReactTable({
		data: registrations,
		// @ts-ignore - Temporary fix for new authorization fields
		columns: tstColumns,
		getCoreRowModel: getCoreRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getSortedRowModel: getSortedRowModel(),
		onSortingChange: setSorting,
		onColumnFiltersChange: setColumnFilters,
		onColumnVisibilityChange: setColumnVisibility,
		onRowSelectionChange: (updater) => {
			const newSelectedRowIds =
				typeof updater === "function"
					? updater(Object.fromEntries(selectedRows.map((id) => [id, true])))
					: updater;
			setSelectedRows(Object.keys(newSelectedRowIds));
		},
		state: {
			sorting,
			columnFilters: tstFilters,
			columnVisibility,
			rowSelection: Object.fromEntries(selectedRows.map((id) => [id, true])),
		},
		initialState: {
			pagination: {
				pageSize: 20,
			},
			columnVisibility: {
				// Hide some columns by default on mobile - all visible by default
				parentName: true,
				eventTitle: true,
				familyName: true,
				registrationDate: true,
				eventStartDate: true,
			},
		},
	});

	// Calculate stats from all data
	const stats = {
		total: registrations.length,
		// @ts-ignore - Temporary fix for new authorization fields
		pending: registrations.filter((r: any) => r.status === "pending").length,
		// @ts-ignore - Temporary fix for new authorization fields
		confirmed: registrations.filter((r: any) => r.status === "confirmed")
			.length,
		// @ts-ignore - Temporary fix for new authorization fields
		paymentPending: registrations.filter(
			(r: any) => r.paymentStatus === "pending",
		).length,
	};

	// Get filtered data count
	const filteredRowCount = table.getFilteredRowModel().rows.length;

	return (
		<RoleGuard
			allowedRoles={["amministratore", "editor", "animatore"]}
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
				<div>
					<h1 className="text-3xl font-bold">Gestione Iscrizioni</h1>
					<p className="text-muted-foreground">
						Visualizza e gestisci le iscrizioni agli eventi.
					</p>
					{searchParams.eventId &&
						eventsData?.data &&
						(() => {
							const event = eventsData.data.find(
								(e: any) => e.id === searchParams.eventId,
							);
							return event ? (
								<div className="mt-2 flex items-center gap-2 text-sm text-blue-600 bg-blue-50 dark:bg-blue-950 dark:text-blue-400 px-3 py-2 rounded-md">
									<Calendar className="h-4 w-4" />
									Filtrando per evento: <strong>{event.title}</strong>
									<Button
										variant="ghost"
										size="sm"
										className="h-auto p-1 ml-2"
										onClick={() => {
											// Clear the event filter by navigating without search params
											window.history.pushState({}, "", "/admin/iscrizioni");
											window.location.reload();
										}}
									>
										<X className="h-3 w-3" />
									</Button>
								</div>
							) : null;
						})()}
				</div>

				{/* Stats Cards */}
				<div className="grid gap-4 md:grid-cols-4">
					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium">
								Totale Iscrizioni
							</CardTitle>
							<Users className="h-4 w-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">{stats.total}</div>
						</CardContent>
					</Card>
					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium">In Attesa</CardTitle>
							<Clock className="h-4 w-4 text-yellow-600" />
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold text-yellow-600">
								{stats.pending}
							</div>
						</CardContent>
					</Card>
					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium">Confermate</CardTitle>
							<CheckCircle className="h-4 w-4 text-green-600" />
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold text-green-600">
								{stats.confirmed}
							</div>
						</CardContent>
					</Card>
					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium">
								Pagamenti Pendenti
							</CardTitle>
							<CreditCard className="h-4 w-4 text-red-600" />
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold text-red-600">
								{stats.paymentPending}
							</div>
						</CardContent>
					</Card>
				</div>

				{/* Advanced Data Table Filters */}
				<Card>
					<CardHeader>
						<CardTitle>Filtri Avanzati</CardTitle>
						<CardDescription>
							Utilizza i filtri per trovare rapidamente le iscrizioni che ti
							interessano
						</CardDescription>
					</CardHeader>
					<CardContent>
						<DataTableFilter
							filters={filters}
							columns={filterColumns}
							actions={actions}
							strategy={strategy}
						/>
					</CardContent>
				</Card>

				{/* Registrations Table */}
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0">
						<div>
							<CardTitle>Iscrizioni</CardTitle>
							<CardDescription>
								{table.getRowModel().rows.length} di {filteredRowCount}{" "}
								iscrizioni
								{filteredRowCount !== registrations.length &&
									` (filtrate da ${registrations.length})`}
							</CardDescription>
						</div>
						<AdminManualRegistrationDialog>
							<Button>
								<Plus className="h-4 w-4 mr-2" />
								Aggiungi Iscrizione
							</Button>
						</AdminManualRegistrationDialog>
					</CardHeader>
					<CardContent>
						{isLoading ? (
							<div className="flex items-center justify-center py-8">
								<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
							</div>
						) : (
							<div className="space-y-4">
								{/* Data Table Toolbar */}
								<DataTableToolbar
									table={table}
									selectedRows={selectedRows}
									onBatchStatusUpdate={handleBatchStatusUpdate}
									onBatchDelete={handleBatchDelete}
									onExport={() => {
										console.log("Export functionality to be implemented");
									}}
								/>

								<div className="rounded-md border">
									<Table>
										<TableHeader>
											{table.getHeaderGroups().map((headerGroup) => (
												<TableRow key={headerGroup.id} className="bg-muted/50">
													{headerGroup.headers.map((header) => (
														<TableHead
															key={header.id}
															className="h-10 text-xs font-medium"
														>
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
														className={`
															hover:bg-muted/50 transition-colors duration-150
														`}
													>
														{row.getVisibleCells().map((cell) => (
															<TableCell
																key={cell.id}
																className="py-2 px-3 text-sm"
															>
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
														colSpan={tstColumns.length}
														className="text-center py-8"
													>
														<div className="text-muted-foreground">
															{filteredRowCount === 0 &&
															registrations.length > 0
																? "Nessuna iscrizione corrisponde ai filtri applicati"
																: "Nessuna iscrizione trovata"}
														</div>
													</TableCell>
												</TableRow>
											)}
										</TableBody>
									</Table>
								</div>

								{/* Pagination using new component */}
								<DataTablePagination table={table} />
							</div>
						)}
					</CardContent>
				</Card>
			</div>

			{/* Registration Details Dialog */}
			<RegistrationDetailsDialog
				registrationId={selectedRegistrationId}
				open={detailsDialogOpen}
				onOpenChange={setDetailsDialogOpen}
			/>
		</RoleGuard>
	);
}
