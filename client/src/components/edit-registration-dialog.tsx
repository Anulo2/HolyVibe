import { format } from "date-fns";
import { it } from "date-fns/locale";
import {
  AlertCircle,
  CalendarDays,
  Check,
  Edit2,
  Loader2,
  MapPin,
  User,
  Users,
  X,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useAllAuthorizedPersons } from "@/hooks/useAllAuthorizedPersons";
import {
  useRegistrationQuery,
  useUpdateRegistrationByParentMutation,
} from "@/hooks/useRegistrationsQuery";
import type { UpdateRegistrationData } from "@/types/registration";

interface EditRegistrationDialogProps {
  registrationId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditRegistrationDialog({
  registrationId,
  open,
  onOpenChange,
}: EditRegistrationDialogProps) {
  console.log("🔍 DEBUG: EditRegistrationDialog props:", {
    registrationId,
    open,
    onOpenChange: !!onOpenChange,
  });
  const [notes, setNotes] = useState("");
  const [canExitAlone, setCanExitAlone] = useState(false);
  const [allowedExitLocations, setAllowedExitLocations] = useState<string[]>(
    [],
  );
  const [selectedAuthorizedPersons, setSelectedAuthorizedPersons] = useState<
    string[]
  >([]);
  const [locationAuthorizations, setLocationAuthorizations] = useState<
    Record<string, Record<string, boolean>>
  >({});

  const { data: registration, isLoading } = useRegistrationQuery(
    registrationId || "",
  );

  console.log("🔍 DEBUG: EditRegistrationDialog registration data:", {
    registrationId,
    registration,
    isLoading,
    hasRegistration: !!registration,
  });

  const updateRegistrationMutation = useUpdateRegistrationByParentMutation();

  // Get authorized persons for the family
  const { allAuthorizedPersons = [], isLoading: personsLoading } =
    useAllAuthorizedPersons();

  // Filter authorized persons for the specific family
  const familyAuthorizedPersons = (registration as any)?.family?.id
    ? allAuthorizedPersons.filter(
        (person) => person.family?.id === (registration as any)?.family?.id,
      )
    : [];

  // Extract event locations from event data
  const eventLocations = React.useMemo(() => {
    if (!(registration as any)?.event) return [];

    try {
      if (!(registration as any).event.locations) return [];

      // Parse locations from JSON string
      const locations =
        typeof (registration as any).event.locations === "string"
          ? JSON.parse((registration as any).event.locations)
          : (registration as any).event.locations;

      return Array.isArray(locations) ? locations : [];
    } catch (error) {
      console.error("Error parsing event locations:", error);
      return [];
    }
  }, [(registration as any)?.event]);

  // Initialize state when registration data changes
  useEffect(() => {
    if (registration) {
      const reg = registration as any;

      console.log("🔍 DEBUG: Initializing EditRegistrationDialog state:", {
        registrationId,
        notes: reg.notes,
        canExitAlone: reg?.canExitAlone,
        allowedExitLocations: reg?.allowedExitLocations,
        authorizedPersons: reg.authorizedPersons,
        locationAuthorizations: reg?.locationAuthorizations,
      });

      setNotes(reg.notes || "");
      setCanExitAlone(reg?.canExitAlone || false);
      setAllowedExitLocations(reg?.allowedExitLocations || []);

      // Initialize authorized persons
      const authorizedPersonIds =
        reg.authorizedPersons?.map((p: any) => p.id) || [];
      setSelectedAuthorizedPersons(authorizedPersonIds);

      // Initialize location authorizations
      const locationAuth: Record<string, Record<string, boolean>> = {};
      reg?.locationAuthorizations?.forEach((auth: any) => {
        if (!locationAuth[auth.authorizedPersonId]) {
          locationAuth[auth.authorizedPersonId] = {};
        }
        locationAuth[auth.authorizedPersonId][auth.location] = auth.canPickup;
      });
      setLocationAuthorizations(locationAuth);

      console.log("🔍 DEBUG: State initialized successfully");
    }
  }, [registration]);

  const handleSave = async () => {
    if (!registrationId) return;

    console.log("🔍 DEBUG: handleSave called:", {
      registrationId,
      notes,
      canExitAlone,
      allowedExitLocations,
      selectedAuthorizedPersons,
      locationAuthorizations,
    });

    try {
      // Prepare location authorizations array
      const locationAuthArray = Object.entries(locationAuthorizations).flatMap(
        ([personId, locations]) =>
          Object.entries(locations).map(([location, canPickup]) => ({
            authorizedPersonId: personId,
            location,
            canPickup,
          })),
      );

      const updateData = {
        id: registrationId,
        notes: notes || undefined,
        canExitAlone,
        allowedExitLocations,
        authorizedPersonIds: selectedAuthorizedPersons,
        locationAuthorizations: locationAuthArray,
      };

      console.log(
        "🔍 DEBUG: Calling updateRegistrationMutation with:",
        updateData,
      );

      const result = await updateRegistrationMutation.mutateAsync(updateData);

      console.log("🔍 DEBUG: Update successful:", result);

      toast.success("Iscrizione modificata con successo");
      onOpenChange(false);
    } catch (error) {
      console.error("🔍 DEBUG: Error updating registration:", error);
      toast.error("Errore nella modifica dell'iscrizione");
    }
  };

  const handleCancel = () => {
    if (registration) {
      const reg = registration as any;
      setNotes(reg.notes || "");
      setCanExitAlone(reg?.canExitAlone || false);
      setAllowedExitLocations(reg?.allowedExitLocations || []);

      const authorizedPersonIds =
        reg?.authorizedPersons?.map((p: any) => p.id) || [];
      setSelectedAuthorizedPersons(authorizedPersonIds);

      const locationAuth: Record<string, Record<string, boolean>> = {};
      reg?.locationAuthorizations?.forEach((auth: any) => {
        if (!locationAuth[auth.authorizedPersonId]) {
          locationAuth[auth.authorizedPersonId] = {};
        }
        locationAuth[auth.authorizedPersonId][auth.location] = auth.canPickup;
      });
      setLocationAuthorizations(locationAuth);
    }
    onOpenChange(false);
  };

  const handleAuthorizedPersonChange = (personId: string) => {
    setSelectedAuthorizedPersons((prev) =>
      prev.includes(personId)
        ? prev.filter((id) => id !== personId)
        : [...prev, personId],
    );
  };

  const handleExitLocationChange = (location: string, checked: boolean) => {
    setAllowedExitLocations((prev) =>
      checked ? [...prev, location] : prev.filter((loc) => loc !== location),
    );
  };

  const handleLocationAuthorizationChange = (
    personId: string,
    location: string,
    checked: boolean,
  ) => {
    setLocationAuthorizations((prev) => ({
      ...prev,
      [personId]: {
        ...prev[personId],
        [location]: checked,
      },
    }));
  };

  if (isLoading) {
    console.log("🔍 DEBUG: EditRegistrationDialog is loading");
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!registration) {
    console.log("🔍 DEBUG: No registration data, not rendering dialog");
    return null;
  }

  console.log(
    "🔍 DEBUG: Rendering EditRegistrationDialog with registration:",
    registration,
  );

  const reg = registration as any;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Edit2 className="h-5 w-5" />
            <DialogTitle>Modifica Iscrizione</DialogTitle>
          </div>
          <DialogDescription>
            Modifica i dettagli dell'iscrizione per {reg.child.firstName}{" "}
            {reg.child.lastName} all'evento "{reg.event.title}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Event and Child Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <CalendarDays className="h-4 w-4" />
                Dettagli Evento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <h3 className="font-medium">{reg.event.title}</h3>
                <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <CalendarDays className="h-3 w-3" />
                    <span>
                      {format(new Date(reg.event.startDate), "PPP", {
                        locale: it,
                      })}
                      {reg.event.endDate &&
                        reg.event.endDate !== reg.event.startDate &&
                        ` - ${format(new Date(reg.event.endDate), "PPP", { locale: it })}`}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback>
                    {reg.child.firstName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="font-medium">
                    {reg.child.firstName} {reg.child.lastName}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {reg.family.name}
                  </p>
                </div>
                <Badge variant="warning" className="ml-auto">
                  In Attesa
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Notes Section */}
          <div className="space-y-3">
            <Label htmlFor="notes" className="text-sm font-medium">
              Note aggiuntive
            </Label>
            <Textarea
              id="notes"
              placeholder="Eventuali note per l'organizzazione dell'evento..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              Usa questo spazio per comunicare informazioni importanti agli
              organizzatori
            </p>
          </div>

          {/* Exit Permissions Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <Label className="text-sm font-medium">Permessi di Uscita</Label>
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="canExitAlone"
                  checked={canExitAlone}
                  onCheckedChange={(checked) =>
                    setCanExitAlone(checked as boolean)
                  }
                />
                <Label
                  htmlFor="canExitAlone"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Può uscire da solo/a
                </Label>
              </div>

              {eventLocations.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm">
                    Luoghi da cui può uscire autonomamente:
                  </Label>
                  <div className="space-y-2">
                    {eventLocations.map((location) => (
                      <div
                        key={location}
                        className="flex items-center space-x-2"
                      >
                        <Checkbox
                          id={`exit-location-${location}`}
                          checked={allowedExitLocations.includes(location)}
                          onCheckedChange={(checked) =>
                            handleExitLocationChange(
                              location,
                              checked as boolean,
                            )
                          }
                        />
                        <Label
                          htmlFor={`exit-location-${location}`}
                          className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {location}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Authorized Persons Section */}
          {familyAuthorizedPersons.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <Label className="text-sm font-medium">
                  Persone Autorizzate al Ritiro
                </Label>
              </div>

              <div className="space-y-3">
                {familyAuthorizedPersons.map((person) => (
                  <div key={person.id} className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`person-${person.id}`}
                        checked={selectedAuthorizedPersons.includes(person.id)}
                        onCheckedChange={() =>
                          handleAuthorizedPersonChange(person.id)
                        }
                      />
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-xs">
                            {person.fullName.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <Label
                            htmlFor={`person-${person.id}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            {person.fullName}
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            {person.relationship}
                            {person.phone && ` • ${person.phone}`}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Location authorizations for this person */}
                    {selectedAuthorizedPersons.includes(person.id) &&
                      eventLocations.length > 0 && (
                        <div className="ml-8 space-y-2">
                          <Label className="text-xs text-muted-foreground">
                            Autorizzato a ritirare da:
                          </Label>
                          <div className="space-y-1">
                            {eventLocations.map((location) => (
                              <div
                                key={location}
                                className="flex items-center space-x-2"
                              >
                                <Checkbox
                                  id={`auth-${person.id}-${location}`}
                                  checked={
                                    locationAuthorizations[person.id]?.[
                                      location
                                    ] || false
                                  }
                                  onCheckedChange={(checked) =>
                                    handleLocationAuthorizationChange(
                                      person.id,
                                      location,
                                      checked as boolean,
                                    )
                                  }
                                />
                                <Label
                                  htmlFor={`auth-${person.id}-${location}`}
                                  className="text-xs leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                  {location}
                                </Label>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                  </div>
                ))}
              </div>

              {familyAuthorizedPersons.length === 0 && (
                <div className="text-center py-4 text-sm text-muted-foreground">
                  <AlertCircle className="h-4 w-4 mx-auto mb-2" />
                  Nessuna persona autorizzata trovata per la famiglia.
                  <br />
                  Aggiungi persone autorizzate dal menu famiglia.
                </div>
              )}
            </div>
          )}

          <Separator />

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={updateRegistrationMutation.isPending}
            >
              <X className="h-4 w-4 mr-2" />
              Annulla
            </Button>
            <Button
              onClick={handleSave}
              disabled={updateRegistrationMutation.isPending}
            >
              {updateRegistrationMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Salva Modifiche
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
