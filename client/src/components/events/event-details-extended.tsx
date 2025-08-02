"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Clock,
  MapPin,
  Phone,
  Users,
  Utensils,
  Car,
  CloudRain,
  Camera,
  AlertTriangle,
  CheckCircle,
  Info,
  FileText,
  Calendar,
  Euro,
  ArrowLeft,
} from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";

interface ExtendedEventDetails {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate?: string;
  location: string;
  minAge: number;
  maxAge: number;
  maxParticipants: number;
  currentParticipants: number;
  price?: string;
  status: "draft" | "open" | "closed" | "full" | "cancelled";
  imageUrl?: string;
  // Extended fields
  detailedDescription?: string;
  program?: string;
  requirements?: string;
  whatToBring?: string;
  parentNotes?: string;
  emergencyContacts?: string;
  meetingPoint?: string;
  dropOffTime?: string;
  pickUpTime?: string;
  includesLunch?: boolean;
  includesSnack?: boolean;
  transportProvided?: boolean;
  weatherDependent?: boolean;
  specialNotes?: string;
  cancellationPolicy?: string;
  photographyConsent?: boolean;
  additionalImages?: string;
  createdAt: string;
  updatedAt: string;
}

interface EventDetailsExtendedProps {
  event: ExtendedEventDetails;
  onBack?: () => void;
  onRegister?: () => void;
  canRegister?: boolean;
  isRegistered?: boolean;
}

export function EventDetailsExtended({
  event,
  onBack,
  onRegister,
  canRegister = false,
  isRegistered = false,
}: EventDetailsExtendedProps) {
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd MMMM yyyy", { locale: it });
  };

  const formatDateTime = (dateString: string) => {
    return format(new Date(dateString), "dd MMMM yyyy 'alle' HH:mm", {
      locale: it,
    });
  };

  const getStatusBadge = () => {
    const statusConfig = {
      draft: { label: "Bozza", variant: "secondary" as const },
      open: { label: "Aperto", variant: "default" as const },
      closed: { label: "Chiuso", variant: "destructive" as const },
      full: { label: "Completo", variant: "outline" as const },
      cancelled: { label: "Annullato", variant: "destructive" as const },
    };

    const config = statusConfig[event.status];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const parseAdditionalImages = () => {
    if (!event.additionalImages) return [];
    try {
      return JSON.parse(event.additionalImages);
    } catch {
      return [];
    }
  };

  const additionalImages = parseAdditionalImages();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        {onBack && (
          <Button variant="ghost" onClick={onBack} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Torna alla lista
          </Button>
        )}
      </div>

      {/* Hero Section */}
      <Card>
        <CardContent className="p-0">
          {event.imageUrl && (
            <div className="relative h-64 md:h-80">
              <img
                src={event.imageUrl}
                alt={event.title}
                className="w-full h-full object-cover rounded-t-lg"
              />
              <div className="absolute top-4 right-4">
                {getStatusBadge()}
              </div>
            </div>
          )}
          <div className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-2">{event.title}</h1>
                <div className="flex items-center gap-4 text-muted-foreground mb-4">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>{formatDateTime(event.startDate)}</span>
                  </div>
                  {event.endDate && (
                    <>
                      <span>-</span>
                      <span>{formatDateTime(event.endDate)}</span>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-4 text-muted-foreground mb-4">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    <span>{event.location}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>
                      {event.currentParticipants}/{event.maxParticipants}{" "}
                      partecipanti
                    </span>
                  </div>
                  {event.price && (
                    <div className="flex items-center gap-1">
                      <Euro className="h-4 w-4" />
                      <span>{event.price}€</span>
                    </div>
                  )}
                </div>
                <p className="text-muted-foreground">
                  Età: {event.minAge}-{event.maxAge} anni
                </p>
              </div>
              {onRegister && (
                <div className="ml-6">
                  <Button
                    onClick={onRegister}
                    disabled={!canRegister || isRegistered}
                    size="lg"
                  >
                    {isRegistered
                      ? "Già Iscritto"
                      : canRegister
                      ? "Iscriviti"
                      : "Iscrizioni Chiuse"}
                  </Button>
                </div>
              )}
            </div>

            {/* Basic Description */}
            {event.description && (
              <div className="prose max-w-none">
                <div
                  dangerouslySetInnerHTML={{ __html: event.description }}
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Information Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Panoramica</TabsTrigger>
          <TabsTrigger value="program">Programma</TabsTrigger>
          <TabsTrigger value="practical">Info Pratiche</TabsTrigger>
          <TabsTrigger value="services">Servizi</TabsTrigger>
          <TabsTrigger value="gallery">Galleria</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {event.detailedDescription && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Descrizione Dettagliata
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div
                    className="prose max-w-none"
                    dangerouslySetInnerHTML={{
                      __html: event.detailedDescription,
                    }}
                  />
                </CardContent>
              </Card>
            )}

            {(event.requirements || event.whatToBring) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    Requisiti e Cosa Portare
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {event.requirements && (
                    <div>
                      <h4 className="font-medium mb-2">Requisiti</h4>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {event.requirements}
                      </p>
                    </div>
                  )}
                  {event.whatToBring && (
                    <div>
                      <h4 className="font-medium mb-2">Cosa Portare</h4>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {event.whatToBring}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {event.parentNotes && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-5 w-5" />
                  Note per i Genitori
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{event.parentNotes}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Program Tab */}
        <TabsContent value="program" className="space-y-4">
          {event.program ? (
            <Card>
              <CardHeader>
                <CardTitle>Programma della Giornata</CardTitle>
                <CardDescription>
                  Ecco il programma dettagliato dell'evento
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  className="prose max-w-none"
                  dangerouslySetInnerHTML={{ __html: event.program }}
                />
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Il programma dettagliato sarà disponibile a breve.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Practical Info Tab */}
        <TabsContent value="practical" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Meeting and Times */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Orari e Luogo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {event.meetingPoint && (
                  <div>
                    <p className="font-medium">Punto di Ritrovo</p>
                    <p className="text-sm text-muted-foreground">
                      {event.meetingPoint}
                    </p>
                  </div>
                )}
                {event.dropOffTime && (
                  <div>
                    <p className="font-medium">Orario Consegna</p>
                    <p className="text-sm text-muted-foreground">
                      {event.dropOffTime}
                    </p>
                  </div>
                )}
                {event.pickUpTime && (
                  <div>
                    <p className="font-medium">Orario Ritiro</p>
                    <p className="text-sm text-muted-foreground">
                      {event.pickUpTime}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Emergency Contacts */}
            {event.emergencyContacts && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Phone className="h-5 w-5" />
                    Contatti di Emergenza
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-wrap">
                    {event.emergencyContacts}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Special Notes and Policies */}
          <div className="grid gap-4 md:grid-cols-2">
            {event.specialNotes && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Note Speciali
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-wrap">
                    {event.specialNotes}
                  </p>
                </CardContent>
              </Card>
            )}

            {event.cancellationPolicy && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Politica di Cancellazione
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-wrap">
                    {event.cancellationPolicy}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Services Tab */}
        <TabsContent value="services" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Servizi Inclusi</CardTitle>
              <CardDescription>
                Ecco cosa è incluso nell'evento
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="flex items-center gap-3">
                  <Utensils className="h-5 w-5" />
                  <span>Pranzo</span>
                  {event.includesLunch ? (
                    <Badge variant="default">Incluso</Badge>
                  ) : (
                    <Badge variant="outline">Non incluso</Badge>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <Utensils className="h-5 w-5" />
                  <span>Merenda</span>
                  {event.includesSnack ? (
                    <Badge variant="default">Inclusa</Badge>
                  ) : (
                    <Badge variant="outline">Non inclusa</Badge>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <Car className="h-5 w-5" />
                  <span>Trasporto</span>
                  {event.transportProvided ? (
                    <Badge variant="default">Fornito</Badge>
                  ) : (
                    <Badge variant="outline">Non fornito</Badge>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <Camera className="h-5 w-5" />
                  <span>Consenso Foto</span>
                  {event.photographyConsent ? (
                    <Badge variant="default">Richiesto</Badge>
                  ) : (
                    <Badge variant="outline">Non richiesto</Badge>
                  )}
                </div>
              </div>

              {event.weatherDependent && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <div className="flex items-center gap-2">
                    <CloudRain className="h-5 w-5 text-yellow-600" />
                    <span className="font-medium text-yellow-800">
                      Dipende dal meteo
                    </span>
                  </div>
                  <p className="text-sm text-yellow-700 mt-1">
                    Questo evento potrebbe essere modificato o cancellato in
                    base alle condizioni meteorologiche.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Gallery Tab */}
        <TabsContent value="gallery" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Galleria Immagini</CardTitle>
              <CardDescription>
                Foto e immagini dell'evento
              </CardDescription>
            </CardHeader>
            <CardContent>
              {additionalImages.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {event.imageUrl && (
                    <div className="relative rounded-lg overflow-hidden">
                      <img
                        src={event.imageUrl}
                        alt={`${event.title} - Immagine principale`}
                        className="w-full h-48 object-cover"
                      />
                      <div className="absolute bottom-2 left-2">
                        <Badge variant="secondary">Principale</Badge>
                      </div>
                    </div>
                  )}
                  {additionalImages.map((imageUrl: string, index: number) => (
                    <div
                      key={index}
                      className="relative rounded-lg overflow-hidden"
                    >
                      <img
                        src={imageUrl}
                        alt={`${event.title} - Immagine ${index + 1}`}
                        className="w-full h-48 object-cover"
                      />
                    </div>
                  ))}
                </div>
              ) : event.imageUrl ? (
                <div className="relative rounded-lg overflow-hidden max-w-md">
                  <img
                    src={event.imageUrl}
                    alt={event.title}
                    className="w-full h-64 object-cover"
                  />
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Camera className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nessuna immagine disponibile</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
