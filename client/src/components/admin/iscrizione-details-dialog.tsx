"use client";

import {
  CalendarDays,
  Download,
  FileText,
  Mail,
  MapPin,
  Phone,
  Printer,
  ShieldCheck,
  User,
  UserCheck,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

interface IscrizioneDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  iscrizione?: any;
}

export function IscrizioneDetailsDialog({
  open,
  onOpenChange,
  iscrizione,
}: IscrizioneDetailsDialogProps) {
  if (!iscrizione) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[98vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Dettagli Iscrizione</DialogTitle>
          <DialogDescription>
            Informazioni complete sull'iscrizione
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-bold">{iscrizione.evento.titolo}</h2>
              <div className="flex items-center gap-2 mt-1 text-muted-foreground">
                <CalendarDays className="h-4 w-4" />
                <span>{iscrizione.evento.data}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Badge
                variant={
                  iscrizione.stato === "confermata"
                    ? "success"
                    : iscrizione.stato === "in attesa"
                      ? "secondary"
                      : "destructive"
                }
              >
                {iscrizione.stato.charAt(0).toUpperCase() +
                  iscrizione.stato.slice(1)}
              </Badge>
              <Badge
                variant={
                  iscrizione.pagamento === "completato"
                    ? "success"
                    : iscrizione.pagamento === "in attesa"
                      ? "warning"
                      : "destructive"
                }
              >
                Pagamento:{" "}
                {iscrizione.pagamento.charAt(0).toUpperCase() +
                  iscrizione.pagamento.slice(1)}
              </Badge>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Bambino</CardTitle>
                <CardDescription>Dati del bambino iscritto</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage
                      src={iscrizione.bambino.avatar}
                      alt={iscrizione.bambino.nome}
                    />
                    <AvatarFallback>
                      {iscrizione.bambino.nome.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-medium">{iscrizione.bambino.nome}</h3>
                    <p className="text-sm text-muted-foreground">
                      {iscrizione.bambino.eta} anni
                    </p>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="grid grid-cols-[100px_1fr]">
                    <span className="font-medium">Data di nascita:</span>
                    <span>12/05/2015</span>
                  </div>
                  <div className="grid grid-cols-[100px_1fr]">
                    <span className="font-medium">Luogo di nascita:</span>
                    <span>Milano</span>
                  </div>
                  <div className="grid grid-cols-[100px_1fr]">
                    <span className="font-medium">Codice fiscale:</span>
                    <span>RSSLCU15E12F205Z</span>
                  </div>
                  <div className="grid grid-cols-[100px_1fr]">
                    <span className="font-medium">Allergie:</span>
                    <span>Nessuna</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Genitore</CardTitle>
                <CardDescription>Dati del genitore</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage
                      src={iscrizione.genitore.avatar}
                      alt={iscrizione.genitore.nome}
                    />
                    <AvatarFallback>
                      {iscrizione.genitore.nome.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-medium">{iscrizione.genitore.nome}</h3>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Mail className="h-3.5 w-3.5" />
                      <span>{iscrizione.genitore.email}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>+39 123 456 7890</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>Genitore principale</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Persone Autorizzate</CardTitle>
                <CardDescription>
                  Persone autorizzate a ritirare il bambino
                </CardDescription>
              </CardHeader>
              <CardContent>
                {iscrizione.authorizedPersons &&
                iscrizione.authorizedPersons.length > 0 ? (
                  <div className="space-y-3">
                    {iscrizione.authorizedPersons.map(
                      (persona: any, index: number) => (
                        <div
                          key={persona.id || `persona-${index}`}
                          className="flex items-center gap-3 p-2 rounded-md border"
                        >
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>
                              {persona.fullName?.charAt(0) ||
                                persona.nome?.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">
                              {persona.fullName || persona.nome}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {persona.relationship || persona.relazione}
                            </p>
                            {(persona.phone || persona.email) && (
                              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                {persona.phone && (
                                  <div className="flex items-center gap-1">
                                    <Phone className="h-3 w-3" />
                                    <span>{persona.phone}</span>
                                  </div>
                                )}
                                {persona.email && (
                                  <div className="flex items-center gap-1">
                                    <Mail className="h-3 w-3" />
                                    <span>{persona.email}</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                ) : (
                  <p className="text-muted-foreground">
                    Nessuna persona autorizzata specificata. Solo i genitori
                    possono ritirare il bambino.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Uscita Autonoma</CardTitle>
                <CardDescription>
                  Autorizzazioni per l'uscita in autonomia
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <UserCheck className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      <span className="font-medium">Uscita autonoma:</span>{" "}
                      {iscrizione.canExitAlone ? (
                        <Badge variant="success" className="ml-1">
                          Autorizzata
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="ml-1">
                          Non autorizzata
                        </Badge>
                      )}
                    </span>
                  </div>

                  {iscrizione.canExitAlone &&
                    iscrizione.allowedExitLocations &&
                    iscrizione.allowedExitLocations.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">
                            Luoghi autorizzati:
                          </span>
                        </div>
                        <div className="ml-6 space-y-1">
                          {iscrizione.allowedExitLocations.map(
                            (location: string, index: number) => (
                              <div
                                key={index}
                                className="flex items-center gap-2"
                              >
                                <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                                <span className="text-sm">{location}</span>
                              </div>
                            ),
                          )}
                        </div>
                      </div>
                    )}

                  {!iscrizione.canExitAlone && (
                    <p className="text-xs text-muted-foreground">
                      Il bambino deve essere ritirato da un genitore o persona
                      autorizzata.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {iscrizione.locationAuthorizations &&
            iscrizione.locationAuthorizations.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Autorizzazioni Specifiche per Luogo</CardTitle>
                  <CardDescription>
                    Autorizzazioni dettagliate per ogni persona e luogo
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Raggruppa le autorizzazioni per persona */}
                    {Object.entries(
                      iscrizione.locationAuthorizations.reduce(
                        (acc: any, auth: any) => {
                          const personName =
                            iscrizione.authorizedPersons?.find(
                              (p: any) => p.id === auth.authorizedPersonId,
                            )?.fullName || "Persona sconosciuta";

                          if (!acc[personName]) {
                            acc[personName] = [];
                          }
                          acc[personName].push(auth);
                          return acc;
                        },
                        {},
                      ),
                    ).map(([personName, auths]: [string, any]) => (
                      <div key={personName} className="border rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <ShieldCheck className="h-4 w-4 text-blue-500" />
                          <span className="font-medium">{personName}</span>
                        </div>
                        <div className="ml-6 space-y-1">
                          {auths.map((auth: any, index: number) => (
                            <div
                              key={index}
                              className="flex items-center gap-2 text-sm"
                            >
                              <div
                                className={`w-1.5 h-1.5 rounded-full ${auth.canPickup ? "bg-green-500" : "bg-red-500"}`}
                              ></div>
                              <span>{auth.location}</span>
                              {auth.canPickup ? (
                                <Badge variant="success" className="text-xs">
                                  Autorizzato
                                </Badge>
                              ) : (
                                <Badge
                                  variant="destructive"
                                  className="text-xs"
                                >
                                  Non autorizzato
                                </Badge>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

          <div className="flex justify-end gap-2">
            <Button variant="outline">
              <Printer className="mr-2 h-4 w-4" />
              Stampa
            </Button>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Esporta PDF
            </Button>
            <Button>
              <FileText className="mr-2 h-4 w-4" />
              Modulo di autorizzazione
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
