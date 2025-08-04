import { format, isThisWeek, isToday, isTomorrow } from "date-fns";
import { it } from "date-fns/locale";
import {
  ArrowRight,
  Calendar,
  CalendarDays,
  Clock,
  Eye,
  MapPin,
  UserPlus,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useOrganizationEventsQuery } from "@/hooks/useSettings";

interface OrganizationQuickEventsProps {
  organizationId?: string;
  limit?: number;
}

interface QuickEvent {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string | null;
  location: string;
  maxParticipants: number | null;
  currentParticipants: number;
  isRegistered: boolean;
  status: "open" | "closed" | "full";
}

export function OrganizationQuickEvents({
  organizationId,
  limit = 5,
}: OrganizationQuickEventsProps) {
  const {
    data: events,
    isLoading,
    error,
  } = useOrganizationEventsQuery(organizationId, {
    limit,
    upcoming: true,
  });

  const formatEventDate = (dateString: string) => {
    const date = new Date(dateString);

    if (isToday(date)) {
      return `Oggi, ${format(date, "HH:mm", { locale: it })}`;
    } else if (isTomorrow(date)) {
      return `Domani, ${format(date, "HH:mm", { locale: it })}`;
    } else if (isThisWeek(date)) {
      return format(date, "EEEE, HH:mm", { locale: it });
    } else {
      return format(date, "dd MMMM, HH:mm", { locale: it });
    }
  };

  const getStatusBadge = (event: QuickEvent) => {
    if (event.status === "full") {
      return <Badge variant="destructive">Completo</Badge>;
    } else if (event.status === "closed") {
      return <Badge variant="secondary">Chiuso</Badge>;
    } else {
      return <Badge variant="default">Aperto</Badge>;
    }
  };

  const getParticipantsText = (event: QuickEvent) => {
    if (event.maxParticipants) {
      return `${event.currentParticipants}/${event.maxParticipants}`;
    }
    return `${event.currentParticipants}`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-8 w-20" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-24" />
              {i < 2 && <Separator className="my-4" />}
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error || !events) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Prossimi Eventi
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-red-600 py-4">
            Errore nel caricamento degli eventi
          </div>
        </CardContent>
      </Card>
    );
  }

  if (events.events.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Prossimi Eventi
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <CalendarDays className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              Nessun evento in programma al momento
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Prossimi Eventi
          </CardTitle>
          <Button variant="outline" size="sm" asChild>
            <a href="/eventi" className="flex items-center gap-2">
              <span>Vedi tutti</span>
              <ArrowRight className="h-3 w-3" />
            </a>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {events.events.slice(0, limit).map((event: any, index: number) => (
          <div key={event.id}>
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm truncate">
                    {event.title}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    {event.description}
                  </p>
                </div>
                <div className="ml-2 flex-shrink-0">
                  {getStatusBadge(event)}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-muted-foreground">
                <div className="flex items-center space-x-2">
                  <Clock className="h-3 w-3 flex-shrink-0" />
                  <span>{formatEventDate(event.startDate)}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <MapPin className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">{event.location}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Users className="h-3 w-3 flex-shrink-0" />
                  <span>{getParticipantsText(event)} partecipanti</span>
                </div>
                {event.isRegistered && (
                  <div className="flex items-center space-x-2">
                    <UserPlus className="h-3 w-3 flex-shrink-0 text-green-600" />
                    <span className="text-green-600">Iscritto</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between">
                <Button variant="outline" size="sm" asChild>
                  <a
                    href={`/eventi/${event.id}`}
                    className="flex items-center gap-2"
                  >
                    <Eye className="h-3 w-3" />
                    <span>Dettagli</span>
                  </a>
                </Button>
                {!event.isRegistered && event.status === "open" && (
                  <Button size="sm" asChild>
                    <a href={`/eventi/${event.id}`}>Iscriviti</a>
                  </Button>
                )}
              </div>
            </div>

            {index < events.events.length - 1 && <Separator className="my-4" />}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
