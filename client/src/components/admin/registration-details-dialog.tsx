import { format } from "date-fns";
import { it } from "date-fns/locale";
import {
  AlertCircle,
  CalendarDays,
  CreditCard,
  Mail,
  MapPin,
  Phone,
  User,
  Users,
} from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  useRegistrationQuery,
  useUpdateRegistrationMutation,
} from "@/hooks/useRegistrationsQuery";

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
  const [status, setStatus] = useState<string>("");
  const [paymentStatus, setPaymentStatus] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  const { data: registration, isLoading } = useRegistrationQuery(
    registrationId || "",
  );

  // Type assertion for extended registration with authorization fields
  const extendedRegistration = registration as typeof registration & {
    canExitAlone: boolean;
    allowedExitLocations: string[] | null;
    locationAuthorizations: Array<{
      id: string;
      authorizedPersonId: string;
      location: string;
      canPickup: boolean;
    }>;
  };
  const updateRegistrationMutation = useUpdateRegistrationMutation();

  // Initialize form when registration data loads
  React.useEffect(() => {
    if (registration) {
      setStatus(registration.status);
      setPaymentStatus(registration.paymentStatus);
      setNotes(registration.notes || "");
    }
  }, [registration]);

  const handleSave = async () => {
    if (!registrationId) return;

    try {
      await updateRegistrationMutation.mutateAsync({
        id: registrationId,
        status: status as any,
        paymentStatus: paymentStatus as any,
        notes: notes || undefined,
      });

      setIsEditing(false);
      toast.success("Iscrizione aggiornata con successo");
    } catch (error) {
      toast.error("Errore nell'aggiornamento dell'iscrizione");
    }
  };

  const handleCancel = () => {
    if (registration) {
      setStatus(registration.status);
      setPaymentStatus(registration.paymentStatus);
      setNotes(registration.notes || "");
    }
    setIsEditing(false);
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
                <Badge className={getStatusColor(registration.status)}>
                  {getStatusLabel(registration.status)}
                </Badge>
                <Badge
                  className={getPaymentStatusColor(registration.paymentStatus)}
                >
                  <CreditCard className="h-3 w-3 mr-1" />
                  {getPaymentStatusLabel(registration.paymentStatus)}
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
                        <p className="text-sm">{registration.event.title}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">
                          Data Inizio
                        </Label>
                        <p className="text-sm">
                          {format(
                            new Date(registration.event.startDate),
                            "PPP",
                            { locale: it },
                          )}
                        </p>
                      </div>
                      {registration.event.endDate && (
                        <div>
                          <Label className="text-sm font-medium">
                            Data Fine
                          </Label>
                          <p className="text-sm">
                            {format(
                              new Date(registration.event.endDate),
                              "PPP",
                              { locale: it },
                            )}
                          </p>
                        </div>
                      )}
                      {registration.event.price && (
                        <div>
                          <Label className="text-sm font-medium">Prezzo</Label>
                          <p className="text-sm font-semibold">
                            € {registration.event.price}
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
                            new Date(registration.registrationDate),
                            "PPP",
                            { locale: it },
                          )}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Famiglia</Label>
                        <p className="text-sm">{registration.family.name}</p>
                      </div>

                      {isEditing ? (
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="status">Stato Iscrizione</Label>
                            <Select value={status} onValueChange={setStatus}>
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
                              onValueChange={setPaymentStatus}
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
                                className={getStatusColor(registration.status)}
                              >
                                {getStatusLabel(registration.status)}
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
                                  registration.paymentStatus,
                                )}
                              >
                                {getPaymentStatusLabel(
                                  registration.paymentStatus,
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
                        {registration.notes || "Nessuna nota aggiunta"}
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
                          {registration.child.firstName[0]}
                          {registration.child.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">
                          {registration.child.firstName}{" "}
                          {registration.child.lastName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Nato il{" "}
                          {format(
                            new Date(registration.child.birthDate),
                            "PPP",
                            { locale: it },
                          )}
                        </p>
                      </div>
                    </div>

                    <Separator />

                    {registration.child.allergies && (
                      <div>
                        <Label className="text-sm font-medium flex items-center gap-1">
                          <AlertCircle className="h-4 w-4 text-red-500" />
                          Allergie
                        </Label>
                        <p className="text-sm text-red-600 bg-red-50 dark:bg-red-950 p-2 rounded">
                          {registration.child.allergies}
                        </p>
                      </div>
                    )}

                    {registration.child.medicalNotes && (
                      <div>
                        <Label className="text-sm font-medium">
                          Note Mediche
                        </Label>
                        <p className="text-sm text-orange-600 bg-orange-50 dark:bg-orange-950 p-2 rounded">
                          {registration.child.medicalNotes}
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
                    {registration.parents && registration.parents.length > 0 ? (
                      <div className="space-y-4">
                        {registration.parents.map((parent, index) => (
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
                        ))}
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
                    {registration.authorizedPersons.length > 0 ? (
                      <div className="space-y-4">
                        {registration.authorizedPersons.map(
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
                    {/* Uscita Autonoma */}
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <User className="h-4 w-4" />
                        <Label className="font-medium">Uscita Autonoma</Label>
                      </div>
                      <p className="text-sm">
                        {extendedRegistration.canExitAlone ? (
                          <span className="text-green-600 font-medium">
                            ✓ Il bambino può uscire in autonomia
                          </span>
                        ) : (
                          <span className="text-muted-foreground">
                            Il bambino non può uscire in autonomia
                          </span>
                        )}
                      </p>

                      {extendedRegistration.canExitAlone &&
                        extendedRegistration.allowedExitLocations &&
                        extendedRegistration.allowedExitLocations.length >
                          0 && (
                          <div className="mt-3">
                            <Label className="text-sm font-medium">
                              Luoghi consentiti per uscita autonoma:
                            </Label>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {extendedRegistration.allowedExitLocations.map(
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
                    {extendedRegistration.locationAuthorizations &&
                      extendedRegistration.locationAuthorizations.length >
                        0 && (
                        <div className="border rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <Users className="h-4 w-4" />
                            <Label className="font-medium">
                              Autorizzazioni Specifiche per Luogo
                            </Label>
                          </div>
                          <div className="space-y-3">
                            {extendedRegistration.locationAuthorizations.map(
                              (auth: any) => {
                                const person =
                                  registration.authorizedPersons.find(
                                    (p) => p.id === auth.authorizedPersonId,
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
                              },
                            )}
                          </div>
                        </div>
                      )}

                    {/* Messaggio se non ci sono autorizzazioni specifiche */}
                    {(!extendedRegistration.locationAuthorizations ||
                      extendedRegistration.locationAuthorizations.length ===
                        0) &&
                      !extendedRegistration.canExitAlone && (
                        <div className="text-center py-6">
                          <p className="text-sm text-muted-foreground">
                            Nessuna autorizzazione specifica per luoghi
                            configurata
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Le persone autorizzate possono ritirare da qualsiasi
                            luogo dell'evento
                          </p>
                        </div>
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
