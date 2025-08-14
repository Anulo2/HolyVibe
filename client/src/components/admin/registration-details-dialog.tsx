import { format } from "date-fns";
import { it } from "date-fns/locale";
import {
  AlertCircle,
  CalendarDays,
  CreditCard,
  Loader2,
  Mail,
  MapPin,
  Phone,
  User,
  Users,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useAllAuthorizedPersons } from "@/hooks/useAllAuthorizedPersons";
import {
  useRegistrationQuery,
  useUpdateRegistrationMutation,
} from "@/hooks/useRegistrationsQuery";
import type { AuthorizedPersonWithFamily } from "@/types/authorized-person";
import type {
  PaymentStatus,
  RegistrationStatus,
  UpdateRegistrationData,
} from "@/types/registration";
import type { RegistrationWithDetails } from "@/hooks/useRegistrationsQuery";

interface RegistrationDetailsDialogProps {
  registrationId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "confirmed":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
    case "pending":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
    case "cancelled":
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
    case "waitlist":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
  }
};

const getPaymentStatusColor = (status: string) => {
  switch (status) {
    case "completed":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
    case "pending":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
    case "failed":
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
    case "refunded":
      return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case "confirmed":
      return "Confermata";
    case "pending":
      return "In attesa";
    case "cancelled":
      return "Cancellata";
    case "waitlist":
      return "Lista d'attesa";
    default:
      return status;
  }
};

const getPaymentStatusLabel = (status: string) => {
  switch (status) {
    case "completed":
      return "Pagato";
    case "pending":
      return "In attesa";
    case "failed":
      return "Fallito";
    case "refunded":
      return "Rimborsato";
    default:
      return status;
  }
};

export function RegistrationDetailsDialog({
  registrationId,
  open,
  onOpenChange,
}: RegistrationDetailsDialogProps) {
  const [status, setStatus] = useState<RegistrationStatus>("pending");
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("pending");
  const [notes, setNotes] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  // Exit permissions state
  const [canExitAlone, setCanExitAlone] = useState(false);
  const [allowedExitLocations, setAllowedExitLocations] = useState<string[]>(
    [],
  );

  // Authorized persons state
  const [selectedAuthorizedPersons, setSelectedAuthorizedPersons] = useState<
    string[]
  >([]);
  const [locationAuthorizations, setLocationAuthorizations] = useState<
    Record<string, Record<string, boolean>>
  >({});

  const { data: registration, isLoading } = useRegistrationQuery(
    registrationId || "",
  );

  // registration is now properly typed through useRegistrationQuery
  const updateRegistrationMutation = useUpdateRegistrationMutation();

  // Get authorized persons and event locations
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
      console.log("🔍 DEBUG: Registration data received:", registration);

      setStatus(reg.status);
      setPaymentStatus(reg.paymentStatus);
      setNotes(reg.notes || "");

      // Initialize exit permissions
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
    }
  }, [registration]);

  const handleSave = async () => {
    if (!registrationId) return;

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

      const updateData: UpdateRegistrationData = {
        id: registrationId,
        status,
        paymentStatus,
        notes: notes || undefined,
        canExitAlone,
        allowedExitLocations,
        authorizedPersonIds: selectedAuthorizedPersons,
        locationAuthorizations: locationAuthArray,
      };

      await updateRegistrationMutation.mutateAsync(updateData);

      setIsEditing(false);
      toast.success("Iscrizione aggiornata con successo");
    } catch (_error) {
      toast.error("Errore nell'aggiornamento dell'iscrizione");
    }
  };

  const handleCancel = () => {
    if (registration) {
      const reg = registration as any;
      setStatus(reg.status);
      setPaymentStatus(reg.paymentStatus);
      setNotes(reg.notes || "");

      // Reset exit permissions
      setCanExitAlone(reg?.canExitAlone || false);
      setAllowedExitLocations(reg?.allowedExitLocations || []);

      // Reset authorized persons
      const authorizedPersonIds =
        reg?.authorizedPersons?.map((p: any) => p.id) || [];
      setSelectedAuthorizedPersons(authorizedPersonIds);

      // Reset location authorizations
      const locationAuth: Record<string, Record<string, boolean>> = {};
      reg?.locationAuthorizations?.forEach((auth: any) => {
        if (!locationAuth[auth.authorizedPersonId]) {
          locationAuth[auth.authorizedPersonId] = {};
        }
        locationAuth[auth.authorizedPersonId][auth.location] = auth.canPickup;
      });
      setLocationAuthorizations(locationAuth);
    }
    setIsEditing(false);
  };

  // Handler functions for authorized persons and exit permissions
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

  if (!registrationId) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[98vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Dettagli Iscrizione
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : registration ? (
          <div className="space-y-6">
            {/* Status and Actions */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Badge className={getStatusColor((registration as any).status)}>
                  {getStatusLabel((registration as any).status)}
                </Badge>
                <Badge
                  className={getPaymentStatusColor(
                    (registration as any).paymentStatus,
                  )}
                >
                  <CreditCard className="h-3 w-3 mr-1" />
                  {getPaymentStatusLabel((registration as any).paymentStatus)}
                </Badge>
              </div>
              <div className="flex gap-2">
                {!isEditing ? (
                  <Button onClick={() => setIsEditing(true)}>Modifica</Button>
                ) : (
                  <>
                    <Button variant="outline" onClick={handleCancel}>
                      Annulla
                    </Button>
                    <Button
                      onClick={handleSave}
                      disabled={updateRegistrationMutation.isPending}
                    >
                      {updateRegistrationMutation.isPending
                        ? "Salvando..."
                        : "Salva"}
                    </Button>
                  </>
                )}
              </div>
            </div>

            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="details">Dettagli</TabsTrigger>
                <TabsTrigger value="child">Bambino</TabsTrigger>
                <TabsTrigger value="parent">Genitore</TabsTrigger>
                <TabsTrigger value="authorized">
                  Persone Autorizzate
                </TabsTrigger>
                <TabsTrigger value="exit">Permessi di Uscita</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  {/* Event Info */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CalendarDays className="h-4 w-4" />
                        Informazioni Evento
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <Label className="text-sm font-medium">Titolo</Label>
                        <p className="text-sm">
                          {(registration as any).event.title}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">
                          Data Inizio
                        </Label>
                        <p className="text-sm">
                          {format(
                            new Date((registration as any).event.startDate),
                            "PPP",
                            { locale: it },
                          )}
                        </p>
                      </div>
                      {(registration as any).event.endDate && (
                        <div>
                          <Label className="text-sm font-medium">
                            Data Fine
                          </Label>
                          <p className="text-sm">
                            {format(
                              new Date((registration as any).event.endDate),
                              "PPP",
                              { locale: it },
                            )}
                          </p>
                        </div>
                      )}
                      {(registration as any).event.price && (
                        <div>
                          <Label className="text-sm font-medium">Prezzo</Label>
                          <p className="text-sm font-semibold">
                            € {(registration as any).event.price}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Registration Info */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Informazioni Iscrizione</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <Label className="text-sm font-medium">
                          Data Iscrizione
                        </Label>
                        <p className="text-sm">
                          {format(
                            new Date((registration as any).registrationDate),
                            "PPP",
                            { locale: it },
                          )}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Famiglia</Label>
                        <p className="text-sm">
                          {(registration as any).family.name}
                        </p>
                      </div>

                      {isEditing ? (
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="status">Stato Iscrizione</Label>
                            <Select
                              value={status}
                              onValueChange={(value) =>
                                setStatus(value as RegistrationStatus)
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">
                                  In attesa
                                </SelectItem>
                                <SelectItem value="confirmed">
                                  Confermata
                                </SelectItem>
                                <SelectItem value="cancelled">
                                  Cancellata
                                </SelectItem>
                                <SelectItem value="waitlist">
                                  Lista d'attesa
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="paymentStatus">
                              Stato Pagamento
                            </Label>
                            <Select
                              value={paymentStatus}
                              onValueChange={(value) =>
                                setPaymentStatus(value as PaymentStatus)
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">
                                  In attesa
                                </SelectItem>
                                <SelectItem value="completed">
                                  Pagato
                                </SelectItem>
                                <SelectItem value="failed">Fallito</SelectItem>
                                <SelectItem value="refunded">
                                  Rimborsato
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div>
                            <Label className="text-sm font-medium">Stato</Label>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge
                                className={getStatusColor(
                                  (registration as any).status,
                                )}
                              >
                                {getStatusLabel((registration as any).status)}
                              </Badge>
                            </div>
                          </div>
                          <div>
                            <Label className="text-sm font-medium">
                              Pagamento
                            </Label>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge
                                className={getPaymentStatusColor(
                                  (registration as any).paymentStatus,
                                )}
                              >
                                {getPaymentStatusLabel(
                                  (registration as any).paymentStatus,
                                )}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Notes */}
                <Card>
                  <CardHeader>
                    <CardTitle>Note</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isEditing ? (
                      <div>
                        <Label htmlFor="notes">Note aggiuntive</Label>
                        <Textarea
                          id="notes"
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="Aggiungi note sull'iscrizione..."
                          rows={3}
                        />
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        {(registration as any).notes || "Nessuna nota aggiunta"}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="child" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Informazioni Bambino
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>
                          {(registration as any).child.firstName[0]}
                          {(registration as any).child.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">
                          {(registration as any).child.firstName}{" "}
                          {(registration as any).child.lastName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Nato il{" "}
                          {format(
                            new Date((registration as any).child.birthDate),
                            "PPP",
                            { locale: it },
                          )}
                        </p>
                      </div>
                    </div>

                    <Separator />

                    {(registration as any).child.allergies && (
                      <div>
                        <Label className="text-sm font-medium flex items-center gap-1">
                          <AlertCircle className="h-4 w-4 text-red-500" />
                          Allergie
                        </Label>
                        <p className="text-sm text-red-600 bg-red-50 dark:bg-red-950 p-2 rounded">
                          {(registration as any).child.allergies}
                        </p>
                      </div>
                    )}

                    {(registration as any).child.medicalNotes && (
                      <div>
                        <Label className="text-sm font-medium">
                          Note Mediche
                        </Label>
                        <p className="text-sm text-orange-600 bg-orange-50 dark:bg-orange-950 p-2 rounded">
                          {(registration as any).child.medicalNotes}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="parent" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Genitori della Famiglia
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {(registration as any).parents &&
                    (registration as any).parents.length > 0 ? (
                      <div className="space-y-4">
                        {(registration as any).parents.map(
                          (parent: any, index: any) => (
                            <div
                              key={parent.id}
                              className={`p-4 rounded-lg border ${
                                index > 0 ? "border-t" : ""
                              }`}
                            >
                              <div className="flex items-center gap-3 mb-3">
                                <Avatar>
                                  <AvatarFallback>
                                    {parent.name?.charAt(0) || "G"}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium">{parent.name}</p>
                                  <p className="text-sm text-muted-foreground">
                                    Genitore {index + 1}
                                  </p>
                                </div>
                              </div>
                              <div className="space-y-2 ml-11">
                                <div>
                                  <Label className="text-sm font-medium flex items-center gap-1">
                                    <Mail className="h-3 w-3" />
                                    Email
                                  </Label>
                                  <p className="text-sm">{parent.email}</p>
                                </div>
                                {parent.phoneNumber && (
                                  <div>
                                    <Label className="text-sm font-medium flex items-center gap-1">
                                      <Phone className="h-3 w-3" />
                                      Telefono
                                    </Label>
                                    <p className="text-sm">
                                      {parent.phoneNumber}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          ),
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <User className="mx-auto h-12 w-12 text-muted-foreground" />
                        <h3 className="mt-2 text-sm font-semibold text-gray-900">
                          Nessun genitore trovato
                        </h3>
                        <p className="mt-1 text-sm text-gray-500">
                          Non sono stati trovati genitori per questa famiglia.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="authorized" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Persone Autorizzate al Ritiro
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isEditing ? (
                      <div className="space-y-4">
                        <Label className="text-sm font-medium">
                          Persone autorizzate a ritirare il bambino
                        </Label>
                        {personsLoading ? (
                          <div className="flex items-center justify-center p-4">
                            <Loader2 className="h-6 w-6 animate-spin" />
                          </div>
                        ) : familyAuthorizedPersons.length > 0 ? (
                          <div className="space-y-2 max-h-48 overflow-y-auto">
                            {familyAuthorizedPersons.map(
                              (person: AuthorizedPersonWithFamily) => (
                                <div
                                  key={person.id}
                                  className="flex items-center gap-3 p-3 rounded-lg border"
                                >
                                  <Checkbox
                                    id={`edit-person-${person.id}`}
                                    checked={selectedAuthorizedPersons.includes(
                                      person.id,
                                    )}
                                    onCheckedChange={() =>
                                      handleAuthorizedPersonChange(person.id)
                                    }
                                  />
                                  <Label
                                    htmlFor={`edit-person-${person.id}`}
                                    className="flex items-center gap-3 cursor-pointer flex-1"
                                  >
                                    <Avatar className="h-8 w-8">
                                      <AvatarImage
                                        src={person.avatarUrl || undefined}
                                        alt={person.fullName}
                                      />
                                      <AvatarFallback>
                                        {person.fullName.charAt(0)}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <p className="font-medium">
                                        {person.fullName}
                                      </p>
                                      <p className="text-sm text-muted-foreground">
                                        {person.relationship} •{" "}
                                        {person.family.name}
                                      </p>
                                    </div>
                                  </Label>
                                </div>
                              ),
                            )}
                          </div>
                        ) : (
                          <p className="text-muted-foreground text-sm">
                            Nessuna persona autorizzata nella famiglia "
                            {(registration as any)?.family?.name}".
                          </p>
                        )}

                        {/* Location-specific authorizations */}
                        {selectedAuthorizedPersons.length > 0 &&
                          eventLocations.length > 1 && (
                            <div className="space-y-3 border-t pt-4">
                              <Label className="text-sm font-medium">
                                Autorizzazioni specifiche per luogo
                              </Label>
                              <div className="space-y-3 max-h-48 overflow-y-auto">
                                {familyAuthorizedPersons
                                  .filter(
                                    (person: AuthorizedPersonWithFamily) =>
                                      selectedAuthorizedPersons.includes(
                                        person.id,
                                      ),
                                  )
                                  .map((person: AuthorizedPersonWithFamily) => (
                                    <div
                                      key={person.id}
                                      className="border rounded-lg p-3 space-y-2"
                                    >
                                      <div className="flex items-center gap-2">
                                        <Avatar className="h-6 w-6">
                                          <AvatarImage
                                            src={person.avatarUrl || undefined}
                                            alt={person.fullName}
                                          />
                                          <AvatarFallback className="text-xs">
                                            {person.fullName.charAt(0)}
                                          </AvatarFallback>
                                        </Avatar>
                                        <span className="text-sm font-medium">
                                          {person.fullName}
                                        </span>
                                      </div>
                                      <div className="space-y-1 ml-8">
                                        {eventLocations.map(
                                          (location: string) => (
                                            <div
                                              key={location}
                                              className="flex items-center space-x-2"
                                            >
                                              <Checkbox
                                                id={`edit-auth-${person.id}-${location}`}
                                                checked={
                                                  locationAuthorizations[
                                                    person.id
                                                  ]?.[location] || false
                                                }
                                                onCheckedChange={(checked) =>
                                                  handleLocationAuthorizationChange(
                                                    person.id,
                                                    location,
                                                    checked === true,
                                                  )
                                                }
                                              />
                                              <Label
                                                htmlFor={`edit-auth-${person.id}-${location}`}
                                                className="text-xs"
                                              >
                                                Può ritirare da: {location}
                                              </Label>
                                            </div>
                                          ),
                                        )}
                                      </div>
                                    </div>
                                  ))}
                              </div>
                            </div>
                          )}
                      </div>
                    ) : (registration as any).authorizedPersons.length > 0 ? (
                      <div className="space-y-4">
                        {(registration as any).authorizedPersons.map(
                          (person: {
                            id: string;
                            fullName: string;
                            relationship: string;
                            phone?: string | null;
                            email?: string | null;
                          }) => (
                            <div
                              key={person.id}
                              className="border rounded-lg p-3"
                            >
                              <div className="flex items-center gap-3 mb-2">
                                <Avatar>
                                  <AvatarFallback>
                                    {person.fullName
                                      .split(" ")
                                      .map((n: string) => n[0])
                                      .join("")}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium">
                                    {person.fullName}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {person.relationship}
                                  </p>
                                </div>
                              </div>
                              {(person.phone || person.email) && (
                                <div className="space-y-1 text-sm text-muted-foreground">
                                  {person.phone && (
                                    <p className="flex items-center gap-1">
                                      <Phone className="h-3 w-3" />
                                      {person.phone}
                                    </p>
                                  )}
                                  {person.email && (
                                    <p className="flex items-center gap-1">
                                      <Mail className="h-3 w-3" />
                                      {person.email}
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          ),
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Nessuna persona autorizzata aggiunta per questa
                        iscrizione
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="exit" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Permessi di Uscita
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {isEditing ? (
                      <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="edit-exit-alone"
                            checked={canExitAlone}
                            onCheckedChange={(checked) =>
                              setCanExitAlone(checked === true)
                            }
                          />
                          <Label
                            htmlFor="edit-exit-alone"
                            className="text-sm font-medium"
                          >
                            Il bambino può uscire in autonomia (senza
                            accompagnatore)
                          </Label>
                        </div>

                        {canExitAlone && eventLocations.length > 0 && (
                          <div className="ml-6 space-y-2">
                            <Label className="text-sm text-muted-foreground">
                              Seleziona i luoghi da cui può uscire
                              autonomamente:
                            </Label>
                            {eventLocations.map((location: string) => (
                              <div
                                key={location}
                                className="flex items-center space-x-2"
                              >
                                <Checkbox
                                  id={`edit-exit-location-${location}`}
                                  checked={allowedExitLocations.includes(
                                    location,
                                  )}
                                  onCheckedChange={(checked) =>
                                    handleExitLocationChange(
                                      location,
                                      checked === true,
                                    )
                                  }
                                />
                                <Label
                                  htmlFor={`edit-exit-location-${location}`}
                                  className="text-sm"
                                >
                                  {location}
                                </Label>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="rounded-md bg-blue-50 p-3 text-sm flex gap-2">
                          <AlertCircle className="h-5 w-5 text-blue-500 flex-shrink-0" />
                          <div className="text-blue-800">
                            <p className="font-medium mb-1">Importante:</p>
                            <ul className="text-xs space-y-1 list-disc list-inside">
                              <li>
                                Se il bambino può uscire autonomamente,
                                specificare da quali luoghi
                              </li>
                              <li>
                                Per eventi con più luoghi, puoi autorizzare
                                persone specifiche per luoghi specifici nella
                                tab "Persone Autorizzate"
                              </li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* Uscita Autonoma */}
                        <div className="border rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <User className="h-4 w-4" />
                            <Label className="font-medium">
                              Uscita Autonoma
                            </Label>
                          </div>
                          <p className="text-sm">
                            {(registration as any).canExitAlone ? (
                              <span className="text-green-600 font-medium">
                                ✓ Il bambino può uscire in autonomia
                              </span>
                            ) : (
                              <span className="text-muted-foreground">
                                Il bambino non può uscire in autonomia
                              </span>
                            )}
                          </p>

                          {(registration as any).canExitAlone &&
                            (registration as any).allowedExitLocations &&
                            (registration as any).allowedExitLocations.length >
                              0 && (
                              <div className="mt-3">
                                <Label className="text-sm font-medium">
                                  Luoghi consentiti per uscita autonoma:
                                </Label>
                                <div className="mt-2 flex flex-wrap gap-2">
                                  {(
                                    registration as any
                                  ).allowedExitLocations.map(
                                    (location: string, index: number) => (
                                      <Badge
                                        key={index}
                                        variant="outline"
                                        className="text-xs"
                                      >
                                        <MapPin className="h-3 w-3 mr-1" />
                                        {location}
                                      </Badge>
                                    ),
                                  )}
                                </div>
                              </div>
                            )}
                        </div>

                        {/* Autorizzazioni specifiche per luogo */}
                        {(registration as any).locationAuthorizations &&
                          (registration as any).locationAuthorizations.length >
                            0 && (
                            <div className="border rounded-lg p-4">
                              <div className="flex items-center gap-2 mb-3">
                                <Users className="h-4 w-4" />
                                <Label className="font-medium">
                                  Autorizzazioni Specifiche per Luogo
                                </Label>
                              </div>
                              <div className="space-y-3">
                                {(
                                  registration as any
                                ).locationAuthorizations.map((auth: any) => {
                                  const person = (
                                    registration as any
                                  ).authorizedPersons.find(
                                    (p: any) =>
                                      p.id === auth.authorizedPersonId,
                                  );
                                  return person ? (
                                    <div
                                      key={auth.id}
                                      className="flex items-center justify-between p-3 bg-muted rounded-lg"
                                    >
                                      <div className="flex items-center gap-3">
                                        <Avatar className="h-8 w-8">
                                          <AvatarFallback>
                                            {person.fullName
                                              .split(" ")
                                              .map((n: string) => n[0])
                                              .join("")}
                                          </AvatarFallback>
                                        </Avatar>
                                        <div>
                                          <p className="font-medium text-sm">
                                            {person.fullName}
                                          </p>
                                          <p className="text-xs text-muted-foreground">
                                            {person.relationship}
                                          </p>
                                        </div>
                                      </div>
                                      <div className="text-right">
                                        <Badge
                                          variant="outline"
                                          className="text-xs"
                                        >
                                          <MapPin className="h-3 w-3 mr-1" />
                                          {auth.location}
                                        </Badge>
                                        {auth.canPickup && (
                                          <p className="text-xs text-green-600 mt-1">
                                            ✓ Autorizzato al ritiro
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  ) : null;
                                })}
                              </div>
                            </div>
                          )}

                        {/* Messaggio se non ci sono autorizzazioni specifiche */}
                        {(!(registration as any).locationAuthorizations ||
                          (registration as any).locationAuthorizations
                            .length === 0) &&
                          !(registration as any).canExitAlone && (
                            <div className="text-center py-6">
                              <p className="text-sm text-muted-foreground">
                                Nessuna autorizzazione specifica per luoghi
                                configurata
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                Le persone autorizzate possono ritirare da
                                qualsiasi luogo dell'evento
                              </p>
                            </div>
                          )}
                      </>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Iscrizione non trovata</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
