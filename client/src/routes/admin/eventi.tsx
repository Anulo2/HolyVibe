import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
	CalendarDays,
	Edit,
	Eye,
	Filter,
	MapPin,
	Plus,
	Trash2,
	Users,
} from "lucide-react";
import { useState } from "react";
import { AdminCreaEventoDialog } from "@/components/admin/admin-crea-evento-dialog";
import { EventiDialog } from "@/components/admin/eventi-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { useEventsQuery } from "@/hooks/useEventsQuery";

export const Route = createFileRoute("/admin/eventi")({
	component: AdminEventiPage,
});

function AdminEventiPage() {
	const navigate = useNavigate();
	const [searchTerm, setSearchTerm] = useState("");
	const [statusFilter, setStatusFilter] = useState("all");
	const [selectedEvent, setSelectedEvent] = useState<any>(null);
	const [showCreateDialog, setShowCreateDialog] = useState(false);
	const [showEditDialog, setShowEditDialog] = useState(false);
	const [showDetailDialog, setShowDetailDialog] = useState(false);
	const [viewMode, setViewMode] = useState<"cards" | "table">("cards");

	// Load real events from database
	const { data: eventsData, isLoading, error } = useEventsQuery();
	const eventi = eventsData?.data || [];

	const filteredEvents = eventi.filter((evento) => {
		const matchesSearch =
			evento.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
			evento.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
			evento.location.toLowerCase().includes(searchTerm.toLowerCase());
		const matchesStatus =
			statusFilter === "all" || evento.status === statusFilter;
		return matchesSearch && matchesStatus;
	});

	const getStatusColor = (status: string) => {
		switch (status) {
			case "open":
				return "bg-green-100 text-green-800";
			case "full":
				return "bg-orange-100 text-orange-800";
			case "closed":
				return "bg-red-100 text-red-800";
			case "draft":
				return "bg-gray-100 text-gray-800";
			case "cancelled":
				return "bg-red-100 text-red-800";
			default:
				return "bg-gray-100 text-gray-800";
		}
	};

	const getStatusText = (status: string) => {
		switch (status) {
			case "open":
				return "Aperto";
			case "full":
				return "Completo";
			case "closed":
				return "Chiuso";
			case "draft":
				return "Bozza";
			case "cancelled":
				return "Annullato";
			default:
				return "Sconosciuto";
		}
	};

	const formatDate = (date: string | Date) => {
		const dateObj = typeof date === "string" ? new Date(date) : date;
		return dateObj.toLocaleDateString("it-IT", {
			day: "2-digit",
			month: "2-digit",
			year: "numeric",
		});
	};

	const handleEdit = (evento: any) => {
		setSelectedEvent(evento);
		setShowEditDialog(true);
	};

	const handleView = (evento: any) => {
		setSelectedEvent(evento);
		setShowDetailDialog(true);
	};

	const handleDelete = (eventoId: string) => {
		if (confirm("Sei sicuro di voler eliminare questo evento?")) {
			// TODO: Implement delete API call
			console.log("Deleting event:", eventoId);
		}
	};

	const handleManageRegistrations = (evento: any) => {
		// Close the detail dialog
		setShowDetailDialog(false);

		// Navigate to registrations page with event filter applied
		navigate({
			to: "/admin/iscrizioni",
			search: {
				eventId: evento.id,
				eventTitle: evento.title,
			},
		});
	};

	// Calculate stats from real events data
	const statsCards = [
		{
			title: "Eventi Totali",
			value: eventi.length,
			description: "Tutti gli eventi creati",
		},
		{
			title: "Eventi Aperti",
			value: eventi.filter((e) => e.status === "open").length,
			description: "Eventi aperti alle iscrizioni",
		},
		{
			title: "Iscrizioni Totali",
			value: eventi.reduce((sum, e) => sum + (e.currentParticipants || 0), 0),
			description: "Totale iscrizioni",
		},
		{
			title: "Tasso Riempimento",
			value:
				eventi.length > 0
					? `${Math.round((eventi.reduce((sum, e) => sum + (e.currentParticipants || 0), 0) / eventi.reduce((sum, e) => sum + (e.maxParticipants || 1), 0)) * 100)}%`
					: "0%",
			description: "Media occupazione posti",
		},
	];

	// Handle loading and error states
	if (isLoading) {
		return (
			<div className="container mx-auto p-6">
				<div className="text-center">
					<h1 className="text-2xl font-bold mb-4">Caricamento eventi...</h1>
					<p className="text-muted-foreground">
						Attendi mentre carichiamo i dati.
					</p>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="container mx-auto p-6">
				<div className="text-center">
					<h1 className="text-2xl font-bold text-red-600 mb-4">
						Errore nel caricamento
					</h1>
					<p className="text-muted-foreground">
						Si è verificato un errore nel caricamento degli eventi.
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="container mx-auto p-6 space-y-6">
			{/* Header */}
			<div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
				<div>
					<h1 className="text-3xl font-bold">Gestione Eventi</h1>
					<p className="text-muted-foreground">
						Crea, modifica e gestisci tutti gli eventi della parrocchia
					</p>
				</div>

				<AdminCreaEventoDialog>
					<Button>
						<Plus className="h-4 w-4 mr-2" />
						Nuovo Evento
					</Button>
				</AdminCreaEventoDialog>
			</div>

			{/* Stats Cards */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
				{statsCards.map((stat) => (
					<Card key={stat.title}>
						<CardHeader className="pb-2">
							<CardTitle className="text-sm font-medium text-muted-foreground">
								{stat.title}
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">{stat.value}</div>
							<p className="text-xs text-muted-foreground mt-1">
								{stat.description}
							</p>
						</CardContent>
					</Card>
				))}
			</div>

			{/* Filters and Search */}
			<div className="flex flex-col sm:flex-row gap-4">
				<div className="flex-1">
					<Input
						placeholder="Cerca eventi..."
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						className="w-full"
					/>
				</div>
				<Select value={statusFilter} onValueChange={setStatusFilter}>
					<SelectTrigger className="w-full sm:w-[200px]">
						<Filter className="h-4 w-4 mr-2" />
						<SelectValue placeholder="Filtra per stato" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">Tutti gli stati</SelectItem>
						<SelectItem value="draft">Bozze</SelectItem>
						<SelectItem value="open">Aperti</SelectItem>
						<SelectItem value="full">Completi</SelectItem>
						<SelectItem value="closed">Chiusi</SelectItem>
						<SelectItem value="cancelled">Annullati</SelectItem>
					</SelectContent>
				</Select>
				<div className="flex gap-2">
					<Button
						variant={viewMode === "cards" ? "default" : "outline"}
						size="sm"
						onClick={() => setViewMode("cards")}
					>
						Cards
					</Button>
					<Button
						variant={viewMode === "table" ? "default" : "outline"}
						size="sm"
						onClick={() => setViewMode("table")}
					>
						Tabella
					</Button>
				</div>
			</div>

			{/* Events Content */}
			<Tabs value={viewMode} onValueChange={setViewMode}>
				<TabsContent value="cards">
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						{filteredEvents.map((evento) => (
							<Card key={evento.id} className="overflow-hidden">
								<div className="h-32 bg-gradient-to-r from-blue-500 to-purple-600 relative">
									<div className="absolute top-4 right-4">
										<Badge className={getStatusColor(evento.status)}>
											{getStatusText(evento.status)}
										</Badge>
									</div>
									<div className="absolute bottom-4 left-4 text-white">
										<h3 className="font-bold">{evento.title}</h3>
									</div>
								</div>

								<CardContent className="p-4">
									<div className="space-y-2 mb-4">
										<div className="flex items-center text-sm">
											<CalendarDays className="h-4 w-4 mr-2 text-muted-foreground" />
											<span>
												{formatDate(evento.startDate)}
												{evento.endDate && ` - ${formatDate(evento.endDate)}`}
											</span>
										</div>

										<div className="flex items-center text-sm">
											<MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
											<span>{evento.location}</span>
										</div>

										<div className="flex items-center text-sm">
											<Users className="h-4 w-4 mr-2 text-muted-foreground" />
											<span>
												{evento.currentParticipants}/{evento.maxParticipants}
											</span>
										</div>
									</div>

									<div className="flex gap-1">
										<Button
											variant="outline"
											size="sm"
											onClick={() => handleView(evento)}
											className="flex-1"
										>
											<Eye className="h-4 w-4" />
										</Button>
										<Button
											variant="outline"
											size="sm"
											onClick={() => handleEdit(evento)}
											className="flex-1"
										>
											<Edit className="h-4 w-4" />
										</Button>
										<Button
											variant="outline"
											size="sm"
											onClick={() => handleDelete(evento.id)}
											className="flex-1 text-red-600 hover:text-red-700"
										>
											<Trash2 className="h-4 w-4" />
										</Button>
									</div>
								</CardContent>
							</Card>
						))}
					</div>
				</TabsContent>

				<TabsContent value="table">
					<Card>
						<CardContent className="p-0">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Evento</TableHead>
										<TableHead>Date</TableHead>
										<TableHead>Luogo</TableHead>
										<TableHead>Età</TableHead>
										<TableHead>Partecipanti</TableHead>
										<TableHead>Stato</TableHead>
										<TableHead>Creato da</TableHead>
										<TableHead className="text-right">Azioni</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{filteredEvents.map((evento) => (
										<TableRow key={evento.id}>
											<TableCell className="font-medium">
												<div>
													<div className="font-semibold">{evento.title}</div>
													<div className="text-sm text-muted-foreground">
														{evento.price === "0.00"
															? "Gratuito"
															: `€${evento.price}`}
													</div>
												</div>
											</TableCell>
											<TableCell>
												<div className="text-sm">
													{formatDate(evento.startDate)}
													{evento.endDate && (
														<div className="text-xs text-muted-foreground">
															- {formatDate(evento.endDate)}
														</div>
													)}
												</div>
											</TableCell>
											<TableCell className="text-sm">
												{evento.location}
											</TableCell>
											<TableCell className="text-sm">
												{evento.minAge}-{evento.maxAge}
											</TableCell>
											<TableCell>
												<div className="text-sm">
													{evento.currentParticipants}/{evento.maxParticipants}
													<div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
														<div
															className="bg-blue-600 h-1.5 rounded-full"
															style={{
																width: `${(evento.currentParticipants / evento.maxParticipants) * 100}%`,
															}}
														></div>
													</div>
												</div>
											</TableCell>
											<TableCell>
												<Badge className={getStatusColor(evento.status)}>
													{getStatusText(evento.status)}
												</Badge>
											</TableCell>
											<TableCell className="text-sm">
												{evento.createdBy}
											</TableCell>
											<TableCell className="text-right">
												<div className="flex justify-end gap-1">
													<Button
														variant="ghost"
														size="sm"
														onClick={() => handleView(evento)}
													>
														<Eye className="h-4 w-4" />
													</Button>
													<Button
														variant="ghost"
														size="sm"
														onClick={() => handleEdit(evento)}
													>
														<Edit className="h-4 w-4" />
													</Button>
													<Button
														variant="ghost"
														size="sm"
														onClick={() => handleDelete(evento.id)}
														className="text-red-600 hover:text-red-700"
													>
														<Trash2 className="h-4 w-4" />
													</Button>
												</div>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>

			{filteredEvents.length === 0 && (
				<div className="text-center py-12">
					<p className="text-muted-foreground">
						{searchTerm || statusFilter !== "all"
							? "Nessun evento trovato con i filtri selezionati."
							: "Nessun evento creato ancora."}
					</p>
				</div>
			)}

			{/* Edit Event Dialog */}
			<EventiDialog
				open={showEditDialog}
				onOpenChange={setShowEditDialog}
				evento={selectedEvent}
			/>

			{/* Event Details Dialog */}
			<Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
				<DialogContent className="sm:max-w-[700px]">
					<DialogHeader>
						<DialogTitle>{selectedEvent?.title}</DialogTitle>
						<DialogDescription>
							Dettagli completi dell'evento e gestione iscrizioni
						</DialogDescription>
					</DialogHeader>
					{selectedEvent && (
						<div className="space-y-6">
							<div className="grid grid-cols-2 gap-4">
								<div>
									<h4 className="font-semibold mb-2">Informazioni Base</h4>
									<div className="space-y-2 text-sm">
										<div>
											<strong>Date:</strong>{" "}
											{formatDate(selectedEvent.startDate)} -{" "}
											{selectedEvent.endDate
												? formatDate(selectedEvent.endDate)
												: "N/A"}
										</div>
										<div>
											<strong>Luogo:</strong> {selectedEvent.location}
										</div>
										<div>
											<strong>Età:</strong> {selectedEvent.minAge}-
											{selectedEvent.maxAge} anni
										</div>
										<div>
											<strong>Prezzo:</strong>{" "}
											{selectedEvent.price === "0.00"
												? "Gratuito"
												: `€${selectedEvent.price}`}
										</div>
									</div>
								</div>
								<div>
									<h4 className="font-semibold mb-2">Stato e Partecipazione</h4>
									<div className="space-y-2 text-sm">
										<div>
											<strong>Stato:</strong>{" "}
											<Badge className={getStatusColor(selectedEvent.status)}>
												{getStatusText(selectedEvent.status)}
											</Badge>
										</div>
										<div>
											<strong>Partecipanti:</strong>{" "}
											{selectedEvent.currentParticipants}/
											{selectedEvent.maxParticipants}
										</div>
										<div>
											<strong>Creato da:</strong> {selectedEvent.createdBy}
										</div>
										<div>
											<strong>Data creazione:</strong>{" "}
											{formatDate(selectedEvent.createdAt)}
										</div>
									</div>
								</div>
							</div>

							<div>
								<h4 className="font-semibold mb-2">Descrizione</h4>
								<p className="text-sm text-muted-foreground">
									{selectedEvent.description}
								</p>
							</div>

							<div className="flex gap-2">
								<Button
									onClick={() => {
										setShowDetailDialog(false);
										handleEdit(selectedEvent);
									}}
								>
									<Edit className="h-4 w-4 mr-2" />
									Modifica Evento
								</Button>
								<Button
									variant="outline"
									onClick={() => handleManageRegistrations(selectedEvent)}
								>
									<Users className="h-4 w-4 mr-2" />
									Gestisci Iscrizioni
								</Button>
							</div>
						</div>
					)}
				</DialogContent>
			</Dialog>
		</div>
	);
}
