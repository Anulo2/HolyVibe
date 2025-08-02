import { createFileRoute, redirect } from "@tanstack/react-router";
import { Filter, Loader2 } from "lucide-react";
import { useState } from "react";
import { EventCard } from "@/components/events/event-card";
import { EventDetailsDialog } from "@/components/events/event-details-dialog";
import { IscrizioneWrapperDialog } from "@/components/iscrizione-wrapper-dialog";
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
	const [showDetailsDialog, setShowDetailsDialog] = useState(false);
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
	const filteredEvents = eventi.filter((evento: any) => {
		const matchesStatus =
			statusFilter === "all" || evento.status === statusFilter;
		return matchesStatus;
	});

	const handleViewDetails = (evento: any) => {
		setSelectedEvent(evento);
		setShowDetailsDialog(true);
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

			{/* Events Grid - Layout orizzontale più ampio */}
			<div className="space-y-6">
				{filteredEvents.map((evento: any) => (
					<EventCard
						key={evento.id}
						event={evento}
						mode="user"
						layout="horizontal"
						onViewDetails={() => handleViewDetails(evento)}
						onRegister={() => handleRegister(evento)}
					/>
				))}
			</div>

			{filteredEvents.length === 0 && (
				<div className="text-center py-12">
					<p className="text-muted-foreground">
						Nessun evento trovato con i filtri selezionati.
					</p>
				</div>
			)}

			{/* Event Details Dialog */}
			<EventDetailsDialog
				open={showDetailsDialog}
				onOpenChange={setShowDetailsDialog}
				event={selectedEvent}
				mode="user"
				onRegister={() => {
					setShowDetailsDialog(false);
					handleRegister(selectedEvent);
				}}
			/>

			{/* Registration Dialog */}
			{selectedEvent && (
				<IscrizioneWrapperDialog
					open={showRegistrationDialog}
					onOpenChange={setShowRegistrationDialog}
					evento={selectedEvent}
				/>
			)}
		</div>
	);
}
