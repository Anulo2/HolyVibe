"use client";

import {
  CalendarDays,
  Edit,
  Euro,
  Eye,
  MapPin,
  Trash2,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SafeHTML } from "@/components/ui/safe-html";
import { buildImageUrl } from "@/lib/image-utils";

interface EventCardProps {
  event: any;
  mode?: "user" | "admin";
  onViewDetails?: () => void;
  onRegister?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  canRegister?: boolean;
  isRegistered?: boolean;
  layout?: "vertical" | "horizontal";
}

export function EventCard({
  event,
  mode = "user",
  onViewDetails,
  onRegister,
  onEdit,
  onDelete,
  canRegister = false,
  isRegistered = false,
  layout = "vertical",
}: EventCardProps) {
  const formatDate = (date: string | Date) => {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    return dateObj.toLocaleDateString("it-IT", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const getStatusVariant = (
    status: string,
  ): "success" | "warning" | "destructive" | "default" => {
    switch (status) {
      case "open":
        return "success";
      case "full":
        return "warning";
      case "closed":
      case "cancelled":
        return "destructive";
      case "draft":
        return "default";
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
      case "cancelled":
        return "Annullato";
      default:
        return "Sconosciuto";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-success/10 text-success dark:bg-success/20";
      case "full":
        return "bg-warning/10 text-warning dark:bg-warning/20";
      case "closed":
      case "cancelled":
        return "bg-destructive/10 text-destructive dark:bg-destructive/20";
      case "draft":
        return "bg-muted text-muted-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  if (layout === "horizontal") {
    return (
      <Card className="overflow-hidden">
        <div className="md:flex">
          {/* Immagine a sinistra */}
          <div className="md:w-1/3 h-64 md:h-auto relative overflow-hidden">
            {event.imageUrl ? (
              <img
                src={buildImageUrl(event.imageUrl) || ""}
                alt={event.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-r from-primary/80 to-primary/60" />
            )}
            <div className="absolute top-4 right-4">
              <Badge variant={getStatusVariant(event.status)}>
                {getStatusText(event.status)}
              </Badge>
            </div>
          </div>

          {/* Contenuto a destra */}
          <CardContent className="md:w-2/3 p-6">
            <div className="flex flex-col h-full">
              <div className="flex-1">
                <h3 className="text-2xl font-bold mb-3">{event.title}</h3>

                <div className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  <SafeHTML content={event.description} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <CalendarDays className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span>
                      {formatDate(event.startDate)}
                      {event.endDate &&
                        event.endDate !== event.startDate &&
                        ` - ${formatDate(event.endDate)}`}
                    </span>
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span className="truncate">{event.location}</span>
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Users className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span>
                      {event.minAge} - {event.maxAge} anni
                    </span>
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Users className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span>
                      {event.currentParticipants}/{event.maxParticipants}{" "}
                      partecipanti
                    </span>
                  </div>
                  {event.price !== "0.00" && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Euro className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span>€{event.price}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-2 mt-auto">
                {onViewDetails && (
                  <Button
                    variant="outline"
                    onClick={onViewDetails}
                    className="flex-1"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Dettagli
                  </Button>
                )}
                {mode === "user" && onRegister && (
                  <Button
                    onClick={onRegister}
                    disabled={!canRegister || isRegistered}
                    className="flex-1"
                  >
                    {isRegistered
                      ? "Già Iscritto"
                      : canRegister
                        ? "Iscriviti"
                        : "Iscrizioni Chiuse"}
                  </Button>
                )}
                {mode === "admin" && (
                  <>
                    {onEdit && (
                      <Button variant="outline" size="sm" onClick={onEdit}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                    {onDelete && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={onDelete}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </div>
      </Card>
    );
  }

  // Layout verticale (default)
  return (
    <Card className="overflow-hidden">
      <div className="h-48 relative overflow-hidden">
        {event.imageUrl ? (
          <img
            src={buildImageUrl(event.imageUrl) || ""}
            alt={event.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-primary/80 to-primary/60" />
        )}
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute top-4 right-4">
          {mode === "admin" ? (
            <Badge className={getStatusColor(event.status)}>
              {getStatusText(event.status)}
            </Badge>
          ) : (
            <Badge variant={getStatusVariant(event.status)}>
              {getStatusText(event.status)}
            </Badge>
          )}
        </div>
        <div className="absolute bottom-4 left-4 right-4 text-white">
          <h3
            className={
              mode === "admin" ? "font-bold" : "text-xl font-bold mb-2"
            }
          >
            {event.title}
          </h3>
        </div>
      </div>

      <CardContent className="p-6">
        {mode === "user" && (
          <div className="text-sm text-muted-foreground mb-4 line-clamp-3">
            <SafeHTML content={event.description} />
          </div>
        )}

        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm">
            <CalendarDays className="h-4 w-4 mr-2 text-muted-foreground" />
            <span>
              {formatDate(event.startDate)}
              {event.endDate && ` - ${formatDate(event.endDate)}`}
            </span>
          </div>

          <div className="flex items-center text-sm">
            <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
            <span>{event.location}</span>
          </div>

          <div className="flex items-center text-sm">
            <Users className="h-4 w-4 mr-2 text-muted-foreground" />
            <span>
              {mode === "user"
                ? `${event.minAge} - ${event.maxAge} anni`
                : `${event.currentParticipants}/${event.maxParticipants}`}
            </span>
          </div>

          {mode === "user" && (
            <div className="flex items-center text-sm">
              <Users className="h-4 w-4 mr-2 text-muted-foreground" />
              <span>
                {event.currentParticipants}/{event.maxParticipants} partecipanti
              </span>
            </div>
          )}

          {event.price !== "0.00" && (
            <div className="flex items-center text-sm">
              <Euro className="h-4 w-4 mr-2 text-muted-foreground" />
              <span>€{event.price}</span>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          {mode === "user" ? (
            <>
              {onViewDetails && (
                <Button
                  variant="outline"
                  onClick={onViewDetails}
                  className="flex-1"
                >
                  Dettagli
                </Button>
              )}
              {onRegister && (
                <Button
                  onClick={onRegister}
                  disabled={!canRegister || isRegistered}
                  className="flex-1"
                >
                  {isRegistered
                    ? "Già Iscritto"
                    : canRegister
                      ? "Iscriviti"
                      : "Iscrizioni Chiuse"}
                </Button>
              )}
            </>
          ) : (
            <>
              {onViewDetails && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onViewDetails}
                  className="flex-1"
                >
                  <Eye className="h-4 w-4" />
                </Button>
              )}
              {onEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onEdit}
                  className="flex-1"
                >
                  <Edit className="h-4 w-4" />
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onDelete}
                  className="flex-1 text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
