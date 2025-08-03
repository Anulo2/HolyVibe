"use client";

import {
  AlertCircle,
  CalendarDays,
  Loader2,
  MapPin,
  Users,
} from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAllChildren } from "@/hooks/useAllChildren";
import { useAllAuthorizedPersons } from "@/hooks/useAllAuthorizedPersons";
import {
  useCreateRegistrationMutation,
  useCheckChildRegistrationQuery,
} from "@/hooks/useRegistrationsQuery";

interface IscrizioneFiglioDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  evento: any;
}

// Component for displaying child with registration status
function ChildRegistrationCard({
  child,
  evento,
  age,
  eligible,
  fullName,
  isSelected,
  onSelect,
}: {
  child: any;
  evento: any;
  age: number;
  eligible: boolean;
  fullName: string;
  isSelected: boolean;
  onSelect: () => void;
}) {
  // Check if child is already registered for this event
  const { data: existingRegistration, isLoading: checkingRegistration } =
    useCheckChildRegistrationQuery(
      evento?.id,
      child.id,
      !!evento?.id && !!child.id,
    );

  const isAlreadyRegistered = !!existingRegistration;
  const canSelect = eligible && !isAlreadyRegistered;

  const getStatusText = () => {
    if (!eligible) return "Non idoneo per questo evento";
    if (isAlreadyRegistered) {
      const status = existingRegistration?.status;
      const statusText =
        {
          pending: "già iscritto (in attesa)",
          confirmed: "già iscritto (confermato)",
          waitlist: "già iscritto (lista d'attesa)",
          cancelled: "iscrizione annullata",
        }[status] || "già iscritto";
      return statusText;
    }
    return "";
  };

  const statusText = getStatusText();

  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-lg border ${
        canSelect ? "cursor-pointer" : "opacity-50 cursor-not-allowed"
      } ${
        isSelected
          ? "border-primary bg-primary/5"
          : "border-muted hover:border-primary/50"
      } ${isAlreadyRegistered ? "bg-amber-50 border-amber-200" : ""}`}
      onClick={() => canSelect && onSelect()}
    >
      <Avatar>
        <AvatarImage src={child.avatarUrl} alt={fullName} />
        <AvatarFallback>{child.firstName.charAt(0)}</AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <p className="font-medium">{fullName}</p>
        <p className="text-sm text-muted-foreground">
          {age} anni • {child.familyName}
          {statusText && ` - ${statusText}`}
        </p>
        {isAlreadyRegistered && (
          <div className="flex items-center gap-1 mt-1">
            <AlertCircle className="h-3 w-3 text-amber-600" />
            <span className="text-xs text-amber-700">
              Questo figlio è già iscritto a questo evento
            </span>
          </div>
        )}
      </div>
      {checkingRegistration && (
        <div className="ml-auto">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      )}
      {canSelect && !checkingRegistration && (
        <div className="ml-auto">
          <div
            className={`size-5 rounded-full border-2 ${
              isSelected ? "border-primary bg-primary" : "border-muted"
            }`}
          />
        </div>
      )}
    </div>
  );
}

export function IscrizioneFiglioDialog({
  open,
  onOpenChange,
  evento,
}: IscrizioneFiglioDialogProps) {
  const [figlioSelezionato, setFiglioSelezionato] = useState<string | null>(
    null,
  );
  const [personeAutorizzate, setPersoneAutorizzate] = useState<string[]>([]);
  const [accettaTermini, setAccettaTermini] = useState(false);
  const [consensoFoto, setConsensoFoto] = useState(true);
  const [consensoDati, setConsensoDati] = useState(true);
  const [canExitAlone, setCanExitAlone] = useState(false);
  const [allowedExitLocations, setAllowedExitLocations] = useState<string[]>(
    [],
  );
  const [locationAuthorizations, setLocationAuthorizations] = useState<{
    [key: string]: { [key: string]: boolean };
  }>({});

  // Use custom hooks for data fetching
  const {
    allChildren,
    isLoading: childrenLoading,
    families,
    calculateAge,
    isChildEligible: isEligible,
    getEligibleChildren,
  } = useAllChildren();

  const { allAuthorizedPersons, isLoading: personsLoading } =
    useAllAuthorizedPersons();

  // Mutation for creating registration
  const createRegistrationMutation = useCreateRegistrationMutation();

  // Reset del form quando si apre il dialog
  useEffect(() => {
    if (open) {
      setFiglioSelezionato(null);
      setPersoneAutorizzate([]);
      setAccettaTermini(false);
      setConsensoFoto(true);
      setConsensoDati(true);
      setCanExitAlone(false);
      setAllowedExitLocations([]);
      setLocationAuthorizations({});
    }
  }, [open]);

  // Check if child is eligible for the event
  const isChildEligible = (birthDate: string) => {
    return isEligible(birthDate, evento?.minAge || 0, evento?.maxAge || 100);
  };

  // Filter eligible children
  const eligibleChildren = getEligibleChildren(
    evento?.minAge || 0,
    evento?.maxAge || 100,
  );

  const handlePersonaChange = (personaId: string) => {
    setPersoneAutorizzate((current) =>
      current.includes(personaId)
        ? current.filter((id) => id !== personaId)
        : [...current, personaId],
    );
  };

  const handleLocationAuthorizationChange = (
    personId: string,
    location: string,
    canPickup: boolean,
  ) => {
    setLocationAuthorizations((current) => ({
      ...current,
      [personId]: {
        ...current[personId],
        [location]: canPickup,
      },
    }));
  };

  const handleExitLocationChange = (location: string, allowed: boolean) => {
    setAllowedExitLocations((current) =>
      allowed
        ? [...current.filter((loc) => loc !== location), location]
        : current.filter((loc) => loc !== location),
    );
  };

  // Parse locations from event
  const eventLocations = evento?.locations
    ? typeof evento.locations === "string"
      ? JSON.parse(evento.locations)
      : evento.locations
    : [evento?.location].filter(Boolean);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!figlioSelezionato) {
      toast.error("Seleziona un figlio da iscrivere");
      return;
    }

    if (!accettaTermini) {
      toast.error("Devi accettare i termini per procedere");
      return;
    }

    if (!consensoDati) {
      toast.error(
        "Devi accettare la privacy policy per il trattamento dei dati",
      );
      return;
    }

    try {
      // Prepare location authorizations data
      const locationAuthData = [];
      for (const personId of personeAutorizzate) {
        for (const location of eventLocations) {
          if (locationAuthorizations[personId]?.[location]) {
            locationAuthData.push({
              authorizedPersonId: personId,
              location: location,
              canPickup: true,
            });
          }
        }
      }

      await createRegistrationMutation.mutateAsync({
        eventId: evento.id,
        childId: figlioSelezionato,
        photoPrivacyConsent: consensoFoto,
        dataPrivacyConsent: consensoDati,
        authorizedPersonIds:
          personeAutorizzate.length > 0 ? personeAutorizzate : undefined,
        canExitAlone: canExitAlone,
        allowedExitLocations:
          canExitAlone && allowedExitLocations.length > 0
            ? allowedExitLocations
            : undefined,
        locationAuthorizations:
          locationAuthData.length > 0 ? locationAuthData : undefined,
      });

      toast.success("Iscrizione completata con successo!");
      onOpenChange(false);
    } catch (error) {
      console.error("Registration error:", error);
      toast.error("Errore durante l'iscrizione. Riprova.");
    }
  };

  if (!evento) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[98vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Iscrivi tuo figlio a {evento.title}</DialogTitle>
          <DialogDescription>
            Compila il modulo per iscrivere tuo figlio all'evento
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <div className="space-y-2">
            <div className="rounded-lg border p-4 space-y-3">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
                <span>
                  {new Date(evento.startDate).toLocaleDateString("it-IT")}
                  {evento.endDate &&
                    evento.endDate !== evento.startDate &&
                    ` - ${new Date(evento.endDate).toLocaleDateString("it-IT")}`}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>
                  {eventLocations.length > 1
                    ? `${eventLocations.length} luoghi: ${eventLocations.join(", ")}`
                    : eventLocations[0]}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span>
                  Età: {evento.minAge}-{evento.maxAge} anni
                </span>
              </div>
            </div>
          </div>

          <Tabs defaultValue="figlio" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="figlio">Seleziona Figlio</TabsTrigger>
              <TabsTrigger value="autorizzati">Persone Autorizzate</TabsTrigger>
              <TabsTrigger value="uscite">Autorizzazioni Uscita</TabsTrigger>
            </TabsList>

            <TabsContent value="figlio" className="space-y-4 mt-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Seleziona il figlio da iscrivere *</Label>
                  {families.length > 1 && (
                    <span className="text-xs text-muted-foreground">
                      {eligibleChildren.length} figli idonei da{" "}
                      {families.length} famiglie
                      {allChildren.length > eligibleChildren.length &&
                        ` (${allChildren.length - eligibleChildren.length} non idonei)`}
                    </span>
                  )}
                </div>
                {childrenLoading ? (
                  <div className="flex items-center justify-center p-4">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-2">
                    {allChildren.map((figlio) => {
                      const age = calculateAge(figlio.birthDate);
                      const eligible = isChildEligible(figlio.birthDate);
                      const fullName = `${figlio.firstName} ${figlio.lastName}`;
                      return (
                        <ChildRegistrationCard
                          key={figlio.id}
                          child={figlio}
                          evento={evento}
                          age={age}
                          eligible={eligible}
                          fullName={fullName}
                          isSelected={figlioSelezionato === figlio.id}
                          onSelect={() =>
                            eligible && setFiglioSelezionato(figlio.id)
                          }
                        />
                      );
                    })}
                  </div>
                )}
                {allChildren.length === 0 && !childrenLoading && (
                  <div className="text-center p-4">
                    <p>Non hai ancora aggiunto figli alla tua famiglia</p>
                    <Button variant="link" className="mt-2">
                      Aggiungi un figlio
                    </Button>
                  </div>
                )}
                {allChildren.length > 0 &&
                  eligibleChildren.length === 0 &&
                  !childrenLoading && (
                    <div className="text-center p-4 space-y-2">
                      <p>
                        Nessuno dei tuoi figli rientra nella fascia di età per
                        questo evento
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Età richiesta: {evento?.minAge || 0}-
                        {evento?.maxAge || 100} anni
                      </p>
                      <div className="text-xs text-muted-foreground mt-2">
                        I tuoi figli:
                        {allChildren.map((child, index) => (
                          <div key={child.id}>
                            {child.firstName} {child.lastName} (
                            {calculateAge(child.birthDate)} anni)
                            {index < allChildren.length - 1 && ", "}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
            </TabsContent>

            <TabsContent value="autorizzati" className="space-y-4 mt-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Persone autorizzate a ritirare il bambino</Label>
                  <div className="flex items-center gap-2">
                    {families.length > 1 && allAuthorizedPersons.length > 0 && (
                      <span className="text-xs text-muted-foreground">
                        {allAuthorizedPersons.length} persone
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground">
                      (Opzionale)
                    </span>
                  </div>
                </div>
                {personsLoading ? (
                  <div className="flex items-center justify-center p-4">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-2">
                    {allAuthorizedPersons.map((persona) => (
                      <div
                        key={persona.id}
                        className="flex items-center gap-3 p-3 rounded-lg border"
                      >
                        <Checkbox
                          id={`persona-${persona.id}`}
                          checked={personeAutorizzate.includes(persona.id)}
                          onCheckedChange={() =>
                            handlePersonaChange(persona.id)
                          }
                        />
                        <Label
                          htmlFor={`persona-${persona.id}`}
                          className="flex items-center gap-3 cursor-pointer flex-1"
                        >
                          <Avatar>
                            <AvatarImage
                              src={persona.avatarUrl}
                              alt={persona.fullName}
                            />
                            <AvatarFallback>
                              {persona.fullName.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{persona.fullName}</p>
                            <p className="text-sm text-muted-foreground">
                              {persona.relationship} • {persona.familyName}
                            </p>
                          </div>
                        </Label>
                      </div>
                    ))}
                  </div>
                )}
                {allAuthorizedPersons.length === 0 && !personsLoading && (
                  <div className="text-center p-4">
                    <p>Non hai ancora aggiunto persone autorizzate</p>
                    <Button variant="link" className="mt-2">
                      Aggiungi una persona autorizzata
                    </Button>
                  </div>
                )}
                <div className="mt-2 rounded-md bg-amber-50 p-3 text-sm flex gap-2">
                  <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0" />
                  <p className="text-amber-800">
                    Se non selezioni nessuna persona, solo i genitori saranno
                    autorizzati a ritirare il bambino.
                  </p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="uscite" className="space-y-4 mt-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="exit-alone"
                      checked={canExitAlone}
                      onCheckedChange={(checked) =>
                        setCanExitAlone(checked === true)
                      }
                    />
                    <Label htmlFor="exit-alone" className="text-sm font-medium">
                      Il bambino può uscire in autonomia (senza accompagnatore)
                    </Label>
                  </div>
                  {canExitAlone && (
                    <div className="ml-6 space-y-2">
                      <Label className="text-sm text-muted-foreground">
                        Seleziona i luoghi da cui può uscire autonomamente:
                      </Label>
                      {eventLocations.map((location: string) => (
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
                                checked === true,
                              )
                            }
                          />
                          <Label
                            htmlFor={`exit-location-${location}`}
                            className="text-sm"
                          >
                            {location}
                          </Label>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {personeAutorizzate.length > 0 && eventLocations.length > 1 && (
                  <div className="space-y-3 border-t pt-4">
                    <Label className="text-sm font-medium">
                      Autorizzazioni specifiche per luogo
                    </Label>
                    <div className="space-y-3">
                      {allAuthorizedPersons
                        .filter((person) =>
                          personeAutorizzate.includes(person.id),
                        )
                        .map((person) => (
                          <div
                            key={person.id}
                            className="border rounded-lg p-3 space-y-2"
                          >
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarImage
                                  src={person.avatarUrl}
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
                              {eventLocations.map((location: string) => (
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
                                        checked === true,
                                      )
                                    }
                                  />
                                  <Label
                                    htmlFor={`auth-${person.id}-${location}`}
                                    className="text-xs"
                                  >
                                    Può ritirare da: {location}
                                  </Label>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                <div className="rounded-md bg-blue-50 p-3 text-sm flex gap-2">
                  <AlertCircle className="h-5 w-5 text-blue-500 flex-shrink-0" />
                  <div className="text-blue-800">
                    <p className="font-medium mb-1">Importante:</p>
                    <ul className="text-xs space-y-1 list-disc list-inside">
                      <li>
                        Se il bambino può uscire autonomamente, specificare da
                        quali luoghi
                      </li>
                      <li>
                        Per eventi con più luoghi, puoi autorizzare persone
                        specifiche per luoghi specifici
                      </li>
                      <li>
                        Se non specifichi autorizzazioni per luogo, le persone
                        autorizzate potranno ritirare da qualsiasi luogo
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="space-y-4 border-t pt-4">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="consenso-dati"
                  checked={consensoDati}
                  onCheckedChange={(checked) =>
                    setConsensoDati(checked === true)
                  }
                  required
                />
                <Label htmlFor="consenso-dati" className="text-sm">
                  Accetto la{" "}
                  <a
                    href="/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    privacy policy
                  </a>{" "}
                  per il trattamento dei dati personali *
                </Label>
              </div>

              {evento?.willTakePhotos && (
                <div className="space-y-3">
                  {/* Dichiarazione specifica dell'organizzazione */}
                  {evento?.organization?.photoVideoMinorsDeclaration && (
                    <div className="bg-purple-50 dark:bg-purple-950/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
                      <h5 className="font-semibold mb-2 text-purple-700 dark:text-purple-300">
                        Dichiarazione Autorizzazione Foto/Video Minorenni
                      </h5>
                      <div className="text-xs text-muted-foreground whitespace-pre-wrap bg-background p-3 rounded">
                        {evento.organization.photoVideoMinorsDeclaration}
                      </div>
                      <div className="mt-2 text-xs text-purple-600 dark:text-purple-400">
                        Dichiarazione di: {evento.organization.name}
                      </div>
                    </div>
                  )}

                  {/* Checkbox per il consenso */}
                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="consenso-foto"
                      checked={consensoFoto}
                      onCheckedChange={(checked) =>
                        setConsensoFoto(checked === true)
                      }
                      className="mt-1"
                    />
                    <Label htmlFor="consenso-foto" className="text-sm">
                      Autorizzo il trattamento di foto e video del mio figlio/a
                      per{" "}
                      {evento?.photosForSocialMedia
                        ? "documentazione dell'attività e pubblicazione sui canali social dell'organizzazione"
                        : "documentazione dell'attività"}
                      {evento?.organization?.photoVideoMinorsDeclaration
                        ? " secondo le finalità e nei limiti indicati nella dichiarazione sopra riportata"
                        : ""}
                      .
                      {!evento?.organization?.photoVideoMinorsDeclaration && (
                        <span>
                          {" "}
                          (
                          <a
                            href="/privacy"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            vedi informativa privacy generale
                          </a>
                          )
                        </span>
                      )}
                    </Label>
                  </div>
                </div>
              )}

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="termini"
                  checked={accettaTermini}
                  onCheckedChange={(checked) =>
                    setAccettaTermini(checked === true)
                  }
                  required
                />
                <Label htmlFor="termini" className="text-sm">
                  Accetto i termini e le condizioni dell'evento, incluse le
                  politiche di cancellazione e rimborso *
                </Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createRegistrationMutation.isPending}
            >
              Annulla
            </Button>
            <Button
              type="submit"
              disabled={
                !figlioSelezionato ||
                !accettaTermini ||
                !consensoDati ||
                createRegistrationMutation.isPending
              }
            >
              {createRegistrationMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Iscrivendo...
                </>
              ) : (
                "Conferma Iscrizione"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
