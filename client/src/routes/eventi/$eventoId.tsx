import {
  createFileRoute,
  useParams,
  useNavigate,
} from "@tanstack/react-router";
import { EventDetailsExtended } from "@/components/events/event-details-extended";
import { useEventDetailsExtended } from "@/hooks/useEventDetailsExtended";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { IscrizioneWrapperDialog } from "@/components/iscrizione-wrapper-dialog";
import { useState } from "react";

export const Route = createFileRoute("/eventi/$eventoId")({
  component: EventDetailsPage,
});

function EventDetailsPage() {
  const { eventoId } = useParams({ from: "/eventi/$eventoId" });
  const navigate = useNavigate();
  const { session } = useAuth();
  const [showRegistrationDialog, setShowRegistrationDialog] = useState(false);

  const {
    data: event,
    isLoading,
    error,
    refetch,
  } = useEventDetailsExtended(eventoId);

  const handleBack = () => {
    navigate({ to: "/eventi" });
  };

  const handleRegister = () => {
    if (!session?.user) {
      toast({
        title: "Accesso richiesto",
        description: "Devi effettuare l'accesso per iscriverti agli eventi.",
        variant: "destructive",
      });
      navigate({ to: "/login", search: { redirect: `/eventi/${eventoId}` } });
      return;
    }

    setShowRegistrationDialog(true);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Header Skeleton */}
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-32" />
          </div>

          {/* Hero Section Skeleton */}
          <Card>
            <CardContent className="p-0">
              <Skeleton className="w-full h-64 md:h-80 rounded-t-lg" />
              <div className="p-6 space-y-4">
                <Skeleton className="h-8 w-3/4" />
                <div className="flex items-center gap-4">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-20 w-full" />
              </div>
            </CardContent>
          </Card>

          {/* Tabs Skeleton */}
          <div className="space-y-4">
            <div className="flex space-x-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-24" />
              ))}
            </div>
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <Button variant="ghost" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Torna alla lista eventi
          </Button>

          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Errore nel caricamento dell'evento.
              <Button
                variant="link"
                className="px-1 h-auto font-normal"
                onClick={() => refetch()}
              >
                Riprova
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <Button variant="ghost" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Torna alla lista eventi
          </Button>

          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>Evento non trovato.</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  // Check if user can register
  const canRegister = Boolean(
    event.status === "open" &&
      event.currentParticipants < event.maxParticipants &&
      session?.user,
  );

  // Check if user is already registered (this would need actual registration data)
  const isRegistered = false; // TODO: Implement actual registration check

  return (
    <div className="container mx-auto px-4 py-8">
      <EventDetailsExtended
        event={event}
        onBack={handleBack}
        onRegister={handleRegister}
        canRegister={canRegister}
        isRegistered={isRegistered}
      />

      {/* Registration Dialog */}
      <IscrizioneWrapperDialog
        open={showRegistrationDialog}
        onOpenChange={setShowRegistrationDialog}
        evento={event}
      />
    </div>
  );
}
