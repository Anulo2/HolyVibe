import { createFileRoute } from "@tanstack/react-router";
import { CalendarDays, Clock, Euro, Filter, MapPin, Users } from "lucide-react";
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

export const Route = createFileRoute("/eventi")({
	component: EventiPage,
});

function EventiPage() {
	const [searchTerm, setSearchTerm] = useState("");
	const [statusFilter, setStatusFilter] = useState("all");
	const [selectedEvent, setSelectedEvent] = useState<any>(null);
	const [showRegistrationDialog, setShowRegistrationDialog] = useState(false);

	// Mock data - questo sarà sostituito con real API calls
	const eventi = [
		{
			id: "1",
			title: "Campo Estivo San Giuseppe",
			description:
				"Un campo estivo di una settimana nelle Dolomiti per ragazzi dai 10 ai 16 anni. Attività all'aperto, escursioni, laboratori creativi e momenti di preghiera.",
			startDate: new Date("2024-07-15"),
			endDate: new Date("2024-07-22"),
			location: "Dolomiti, Trentino",
			minAge: 10,
			maxAge: 16,
			maxParticipants: 30,
			currentParticipants: 18,
			price: "150.00",
			status: "open",
			imageUrl: "/api/placeholder/400/200",
		},
		{
			id: "2",
			title: "Ritiro Spirituale Adolescenti",
			description:
				"Un weekend di riflessione e crescita spirituale per adolescenti dai 14 ai 18 anni.",
			startDate: new Date("2024-06-10"),
			endDate: new Date("2024-06-12"),
			location: "Casa Ritiri San Francesco",
			minAge: 14,
			maxAge: 18,
			maxParticipants: 20,
			currentParticipants: 15,
			price: "80.00",
			status: "open",
			imageUrl: "/api/placeholder/400/200",
		},
		{
			id: "3",
			title: "Corso di Preparazione Cresima",
			description:
				"Corso di preparazione alla Cresima per ragazzi dai 13 ai 15 anni.",
			startDate: new Date("2024-09-01"),
			endDate: new Date("2024-12-15"),
			location: "Oratorio San Marco",
			minAge: 13,
			maxAge: 15,
			maxParticipants: 25,
			currentParticipants: 12,
			price: "0.00",
			status: "open",
			imageUrl: "/api/placeholder/400/200",
		},
		{
			id: "4",
			title: "Laboratorio di Arte Sacra",
			description: "Laboratorio di arte sacra per bambini dai 8 ai 12 anni.",
			startDate: new Date("2024-08-05"),
			endDate: new Date("2024-08-09"),
			location: "Centro Parrocchiale",
			minAge: 8,
			maxAge: 12,
			maxParticipants: 15,
			currentParticipants: 15,
			price: "50.00",
			status: "full",
			imageUrl: "/api/placeholder/400/200",
		},
	];

	const filteredEvents = eventi.filter((evento) => {
		const matchesSearch =
			evento.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
			evento.description.toLowerCase().includes(searchTerm.toLowerCase());
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
			default:
				return "Sconosciuto";
		}
	};

	const formatDate = (date: Date) => {
		return date.toLocaleDateString("it-IT", {
			day: "2-digit",
			month: "2-digit",
			year: "numeric",
		});
	};

	const handleRegister = (evento: any) => {
		setSelectedEvent(evento);
		setShowRegistrationDialog(true);
	};

	return (
		<div className="container mx-auto p-6 space-y-6">
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
						<div className="h-48 bg-gradient-to-r from-blue-500 to-purple-600 relative">
							<div className="absolute top-4 right-4">
								<Badge className={getStatusColor(evento.status)}>
									{getStatusText(evento.status)}
								</Badge>
							</div>
							<div className="absolute bottom-4 left-4 text-white">
								<h3 className="text-xl font-bold">{evento.title}</h3>
							</div>
						</div>

						<CardContent className="p-6">
							<p className="text-sm text-muted-foreground mb-4 line-clamp-3">
								{evento.description}
							</p>

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
										{evento.currentParticipants}/{evento.maxParticipants}{" "}
										partecipanti
									</span>
								</div>

								<div className="flex items-center text-sm">
									<Clock className="h-4 w-4 mr-2 text-muted-foreground" />
									<span>
										Età: {evento.minAge}-{evento.maxAge} anni
									</span>
								</div>

								{evento.price && evento.price !== "0.00" && (
									<div className="flex items-center text-sm">
										<Euro className="h-4 w-4 mr-2 text-muted-foreground" />
										<span>€{evento.price}</span>
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
									<DialogContent className="sm:max-w-[600px]">
										<DialogHeader>
											<DialogTitle>{evento.title}</DialogTitle>
											<DialogDescription>
												Dettagli completi dell'evento
											</DialogDescription>
										</DialogHeader>
										<div className="space-y-4">
											<p>{evento.description}</p>
											<div className="grid grid-cols-2 gap-4 text-sm">
												<div>
													<strong>Date:</strong>
													<br />
													{formatDate(evento.startDate)}
													{evento.endDate && ` - ${formatDate(evento.endDate)}`}
												</div>
												<div>
													<strong>Luogo:</strong>
													<br />
													{evento.location}
												</div>
												<div>
													<strong>Età:</strong>
													<br />
													{evento.minAge}-{evento.maxAge} anni
												</div>
												<div>
													<strong>Prezzo:</strong>
													<br />
													{evento.price === "0.00"
														? "Gratuito"
														: `€${evento.price}`}
												</div>
											</div>
											<div>
												<strong>Disponibilità:</strong>
												<br />
												{evento.currentParticipants} su {evento.maxParticipants}{" "}
												posti occupati
											</div>
										</div>
									</DialogContent>
								</Dialog>

								<Button
									className="flex-1"
									disabled={evento.status !== "open"}
									onClick={() => handleRegister(evento)}
								>
									{evento.status === "open"
										? "Iscriviti"
										: evento.status === "full"
											? "Completo"
											: evento.status === "closed"
												? "Chiuso"
												: "Non disponibile"}
								</Button>
							</div>
						</CardContent>
					</Card>
				))}
			</div>

			{filteredEvents.length === 0 && (
				<div className="text-center py-12">
					<p className="text-muted-foreground">
						{searchTerm || statusFilter !== "all"
							? "Nessun evento trovato con i filtri selezionati."
							: "Nessun evento disponibile al momento."}
					</p>
				</div>
			)}

			{/* Registration Dialog */}
			<IscrizioneFiglioDialog
				open={showRegistrationDialog}
				onOpenChange={setShowRegistrationDialog}
				evento={selectedEvent}
			/>
		</div>
	);
}
