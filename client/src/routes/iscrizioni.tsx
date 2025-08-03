import { createFileRoute, redirect } from "@tanstack/react-router";
import {
  Calendar,
  CalendarDays,
  Clock,
  Eye,
  Filter,
  Loader2,
  MapPin,
  Users,
  XCircle,
  CheckCircle,
  AlertCircle,
  Euro,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAllChildren } from "@/hooks/useAllChildren";
import { useMyRegistrationsQuery } from "@/hooks/useRegistrationsQuery";

export const Route = createFileRoute("/iscrizioni")({
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
});

function IscrizioniPage() {
  const { auth } = Route.useRouteContext();
  const currentUser = auth.data?.user;
  const [statusFilter, setStatusFilter] = useState("all");
  const [childFilter, setChildFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);

  // Get children for filtering
  const { allChildren } = useAllChildren();

  // Get registrations
  const {
    data: registrationsResponse,
    isLoading: registrationsLoading,
    error: registrationsError,
  } = useMyRegistrationsQuery({
    page,
    limit: 20,
    status: statusFilter !== "all" ? (statusFilter as any) : undefined,
    childId: childFilter !== "all" ? childFilter : undefined,
  });

  const registrations = registrationsResponse?.registrations || [];
  const total = registrationsResponse?.total || 0;

  // Filter by search term locally
  const filteredRegistrations = registrations.filter(
    (registration) =>
      registration.event.title
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      `${registration.child.firstName} ${registration.child.lastName}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase()),
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "confirmed":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case "cancelled":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "waitlist":
        return <AlertCircle className="h-4 w-4 text-blue-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "confirmed":
        return "Confermata";
      case "pending":
        return "In Attesa";
      case "cancelled":
        return "Annullata";
      case "waitlist":
        return "Lista d'Attesa";
      default:
        return status;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "confirmed":
        return "success" as const;
      case "pending":
        return "warning" as const;
      case "cancelled":
        return "destructive" as const;
      case "waitlist":
        return "secondary" as const;
      default:
        return "default" as const;
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("it-IT", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const isEventPast = (eventDate: string) => {
    return new Date(eventDate) < new Date();
  };

  if (registrationsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (registrationsError) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">
          Errore nel caricamento delle iscrizioni
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-3xl font-bold">Le Mie Iscrizioni</h1>
          <p className="text-muted-foreground">
            Storico completo delle iscrizioni di tutti i figli delle tue
            famiglie agli eventi
          </p>
          <div className="mt-2 rounded-md bg-blue-50 p-3 text-sm border border-blue-200">
            <p className="text-blue-800">
              <strong>Nota:</strong> Qui vengono mostrate tutte le iscrizioni
              dei figli delle famiglie di cui fai parte, indipendentemente da
              chi ha effettuato l'iscrizione. Il nome del genitore che ha
              iscritto il bambino è indicato sotto al nome della famiglia.
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Totali</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{total}</div>
              <p className="text-xs text-muted-foreground">Iscrizioni totali</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Confermate</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {registrations.filter((r) => r.status === "confirmed").length}
              </div>
              <p className="text-xs text-muted-foreground">Eventi confermati</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Attesa</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {registrations.filter((r) => r.status === "pending").length}
              </div>
              <p className="text-xs text-muted-foreground">
                In attesa di conferma
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Prossimi Eventi
              </CardTitle>
              <CalendarDays className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {
                  registrations.filter(
                    (r) =>
                      !isEventPast(r.event.startDate) &&
                      (r.status === "confirmed" || r.status === "pending"),
                  ).length
                }
              </div>
              <p className="text-xs text-muted-foreground">Eventi futuri</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Cerca per evento o nome figlio..."
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
              <SelectItem value="confirmed">Confermate</SelectItem>
              <SelectItem value="pending">In Attesa</SelectItem>
              <SelectItem value="waitlist">Lista d'Attesa</SelectItem>
              <SelectItem value="cancelled">Annullate</SelectItem>
            </SelectContent>
          </Select>

          <Select value={childFilter} onValueChange={setChildFilter}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <Users className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filtra per figlio" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutti i figli</SelectItem>
              {allChildren.map((child) => (
                <SelectItem key={child.id} value={child.id}>
                  {child.firstName} {child.lastName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Registrations List */}
      <div className="space-y-4">
        {filteredRegistrations.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">
              Nessuna iscrizione trovata
            </h3>
            <p className="text-muted-foreground">
              {searchTerm || statusFilter !== "all" || childFilter !== "all"
                ? "Prova a modificare i filtri di ricerca"
                : "Non ci sono ancora iscrizioni per i figli delle tue famiglie"}
            </p>
          </div>
        ) : (
          filteredRegistrations.map((registration) => {
            const eventPast = isEventPast(registration.event.startDate);
            return (
              <Card key={registration.id} className="overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    {/* Child Info */}
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>
                          {registration.child.firstName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold">
                          {registration.child.firstName}{" "}
                          {registration.child.lastName}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {registration.family.name}
                          {registration.parent.name && (
                            <span className="ml-2 text-xs">
                              • Iscritto da {registration.parent.name}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Event Info */}
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium text-lg">
                            {registration.event.title}
                          </h4>
                          <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <CalendarDays className="h-3 w-3" />
                              <span>
                                {formatDate(registration.event.startDate)}
                                {registration.event.endDate &&
                                  registration.event.endDate !==
                                    registration.event.startDate &&
                                  ` - ${formatDate(registration.event.endDate)}`}
                              </span>
                              {eventPast && (
                                <Badge
                                  variant="secondary"
                                  className="ml-2 text-xs"
                                >
                                  Passato
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {registration.event.price &&
                            registration.event.price !== "0.00" && (
                              <div className="flex items-center gap-1 text-sm">
                                <Euro className="h-3 w-3 text-muted-foreground" />
                                <span>€{registration.event.price}</span>
                              </div>
                            )}
                          <Badge
                            variant={getStatusVariant(registration.status)}
                          >
                            <div className="flex items-center gap-1">
                              {getStatusIcon(registration.status)}
                              {getStatusText(registration.status)}
                            </div>
                          </Badge>
                        </div>
                      </div>

                      {/* Registration Details */}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>
                            Iscritto il{" "}
                            {formatDate(registration.registrationDate)}
                          </span>
                        </div>
                        {registration.notes && (
                          <div className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            <span>Con note</span>
                          </div>
                        )}
                      </div>

                      {/* Authorization Info */}
                      {registration.authorizedPersons.length > 0 && (
                        <div className="text-xs text-muted-foreground">
                          <span>Persone autorizzate: </span>
                          {registration.authorizedPersons.map(
                            (person, index) => (
                              <span key={person.id}>
                                {person.fullName}
                                {index <
                                  registration.authorizedPersons.length - 1 &&
                                  ", "}
                              </span>
                            ),
                          )}
                        </div>
                      )}

                      {/* Notes */}
                      {registration.notes && (
                        <div className="text-sm text-muted-foreground bg-muted/50 p-2 rounded">
                          <strong>Note:</strong> {registration.notes}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {total > 20 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Precedente
          </Button>
          <span className="text-sm text-muted-foreground">
            Pagina {page} di {Math.ceil(total / 20)}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => p + 1)}
            disabled={page >= Math.ceil(total / 20)}
          >
            Successiva
          </Button>
        </div>
      )}
    </div>
  );
}
