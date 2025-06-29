import { createFileRoute, redirect } from "@tanstack/react-router";
import {
	CalendarDays,
	Euro,
	Filter,
	Loader2,
	MapPin,
	Users,
} from "lucide-react";
import { useState } from "react";
import { IscrizioneFiglioDialog } from "@/components/iscrizione-figlio-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useEventsQuery } from "@/hooks/useEventsQuery";

export const Route = createFileRoute("/eventi")({
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
	component: EventiPage,
});

function EventiPage() {
	const { auth } = Route.useRouteContext();
	const currentUser = auth.data?.user;
	const [searchTerm, setSearchTerm] = useState("");
	const [statusFilter, setStatusFilter] = useState("all");
	const [selectedEvent, setSelectedEvent] = useState<any>(null);
	const [showRegistrationDialog, setShowRegistrationDialog] = useState(false);

	// Load real events data
	const {
		data: eventsResponse,
		isLoading: eventsLoading,
		error: eventsError,
	} = useEventsQuery({
		search: searchTerm || undefined,
		limit: 50,
	});

	const eventi = eventsResponse?.data || [];

	// Filter events by status locally since backend doesn't filter by status yet
	const filteredEvents = eventi.filter((evento) => {
		const matchesStatus =
			statusFilter === "all" || evento.status === statusFilter;
		return matchesStatus;
	});

	const getStatusVariant = (
		status: string,
	): "success" | "warning" | "destructive" | "default" => {
		switch (status) {
			case "open":
				return "success";
			case "full":
				return "warning";
			case "closed":
				return "destructive";
			default:
				return "default";
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

	const handleRegister = (evento: any) => {
		setSelectedEvent(evento);
		setShowRegistrationDialog(true);
	};

	if (eventsLoading) {
		return (
			<div className="flex items-center justify-center h-64">
				<Loader2 className="h-8 w-8 animate-spin" />
			</div>
		);
	}

	if (eventsError) {
		return (
			<div className="text-center py-12">
				<p className="text-destructive">Errore nel caricamento degli eventi</p>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex flex-col gap-4">
				<div>
					<h1 className="text-3xl font-bold">Eventi</h1>
					<p className="text-muted-foreground">
						Scopri tutti gli eventi organizzati dalla parrocchia e iscivi i tuoi
						figli
					</p>
				</div>

				{/* Filters */}
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
							<SelectItem value="open">Aperti</SelectItem>
							<SelectItem value="full">Completi</SelectItem>
							<SelectItem value="closed">Chiusi</SelectItem>
							<SelectItem value="draft">Bozze</SelectItem>
						</SelectContent>
					</Select>
				</div>
			</div>

			{/* Events Grid */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				{filteredEvents.map((evento) => (
					<Card key={evento.id} className="overflow-hidden">
						<div className="h-48 bg-gradient-to-r from-primary/80 to-primary/60 relative">
							<div className="absolute top-4 right-4">
								<Badge variant={getStatusVariant(evento.status)}>
									{getStatusText(evento.status)}
								</Badge>
							</div>
							<div className="absolute bottom-4 left-4 right-4 text-white">
								<h3 className="text-xl font-bold mb-2">{evento.title}</h3>
							</div>
						</div>
						<CardContent className="p-6">
							<p className="text-sm text-muted-foreground mb-4 line-clamp-3">
								{evento.description}
							</p>

							<div className="space-y-2 mb-4">
								<div className="flex items-center text-sm text-muted-foreground">
									<CalendarDays className="h-4 w-4 mr-2" />
									{formatDate(evento.startDate)}
									{evento.endDate &&
										evento.endDate !== evento.startDate &&
										` - ${formatDate(evento.endDate)}`}
								</div>
								<div className="flex items-center text-sm text-muted-foreground">
									<MapPin className="h-4 w-4 mr-2" />
									{evento.location}
								</div>
								<div className="flex items-center text-sm text-muted-foreground">
									<Users className="h-4 w-4 mr-2" />
									{evento.minAge} - {evento.maxAge} anni
								</div>
								<div className="flex items-center text-sm text-muted-foreground">
									<Users className="h-4 w-4 mr-2" />
									{evento.currentParticipants}/{evento.maxParticipants}{" "}
									partecipanti
								</div>
								{evento.price !== "0.00" && (
									<div className="flex items-center text-sm text-muted-foreground">
										<Euro className="h-4 w-4 mr-2" />€{evento.price}
									</div>
								)}
							</div>

							<div className="flex gap-2">
								<Dialog>
									<DialogTrigger asChild>
										<Button variant="outline" className="flex-1">
											Dettagli
										</Button>
									</DialogTrigger>
									<DialogContent className="max-w-2xl">
										<DialogHeader>
											<DialogTitle>{evento.title}</DialogTitle>
											<DialogDescription>
												{formatDate(evento.startDate)}
												{evento.endDate &&
													evento.endDate !== evento.startDate &&
													` - ${formatDate(evento.endDate)}`}{" "}
												• {evento.location}
											</DialogDescription>
										</DialogHeader>
										<div className="space-y-4">
											<div>
												<h4 className="font-semibold mb-2">Descrizione</h4>
												<p className="text-sm text-muted-foreground">
													{evento.description}
												</p>
											</div>
											<div className="grid grid-cols-2 gap-4">
												<div>
													<h4 className="font-semibold mb-2">Età</h4>
													<p className="text-sm text-muted-foreground">
														{evento.minAge} - {evento.maxAge} anni
													</p>
												</div>
												<div>
													<h4 className="font-semibold mb-2">Partecipanti</h4>
													<p className="text-sm text-muted-foreground">
														{evento.currentParticipants}/
														{evento.maxParticipants}
													</p>
												</div>
												<div>
													<h4 className="font-semibold mb-2">Prezzo</h4>
													<p className="text-sm text-muted-foreground">
														{evento.price === "0.00"
															? "Gratuito"
															: `€${evento.price}`}
													</p>
												</div>
												<div>
													<h4 className="font-semibold mb-2">Stato</h4>
													<Badge variant={getStatusVariant(evento.status)}>
														{getStatusText(evento.status)}
													</Badge>
												</div>
											</div>
										</div>
									</DialogContent>
								</Dialog>
								<Button
									onClick={() => handleRegister(evento)}
									disabled={evento.status !== "open"}
									className="flex-1"
								>
									Iscriviti
								</Button>
							</div>
						</CardContent>
					</Card>
				))}
			</div>

			{filteredEvents.length === 0 && (
				<div className="text-center py-12">
					<p className="text-muted-foreground">
						Nessun evento trovato con i filtri selezionati.
					</p>
				</div>
			)}

			{/* Registration Dialog */}
			{selectedEvent && (
				<IscrizioneFiglioDialog
					open={showRegistrationDialog}
					onOpenChange={setShowRegistrationDialog}
					evento={selectedEvent}
				/>
			)}
		</div>
	);
}
