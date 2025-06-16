"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { CalendarDays, MapPin, Users, AlertCircle } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface IscrizioneFiglioDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  evento: any
}

export function IscrizioneFiglioDialog({ open, onOpenChange, evento }: IscrizioneFiglioDialogProps) {
  const [figlioSelezionato, setFiglioSelezionato] = useState<string | null>(null)
  const [personeAutorizzate, setPersoneAutorizzate] = useState<string[]>([])
  const [accettaTermini, setAccettaTermini] = useState(false)

  // Reset del form quando si apre il dialog
  useEffect(() => {
    if (open) {
      setFiglioSelezionato(null)
      setPersoneAutorizzate([])
      setAccettaTermini(false)
    }
  }, [open])

  // Dati di esempio per le famiglie
  const famiglia = {
    id: 1,
    nome: "Famiglia Principale",
    figli: [
      {
        id: "3",
        nome: "Luca Rossi",
        eta: 10,
        avatar: "/placeholder.svg",
      },
      {
        id: "4",
        nome: "Sofia Rossi",
        eta: 7,
        avatar: "/placeholder.svg",
      },
    ],
    personeAutorizzate: [
      {
        id: "1",
        nome: "Giovanni Rossi",
        relazione: "Nonno",
        avatar: "/placeholder.svg",
      },
      {
        id: "2",
        nome: "Maria Bianchi",
        relazione: "Nonna",
        avatar: "/placeholder.svg",
      },
      {
        id: "3",
        nome: "Paolo Verdi",
        relazione: "Zio",
        avatar: "/placeholder.svg",
      },
    ],
  }

  const handlePersonaChange = (personaId: string) => {
    setPersoneAutorizzate((current) =>
      current.includes(personaId) ? current.filter((id) => id !== personaId) : [...current, personaId],
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Qui implementeresti la logica per salvare l'iscrizione
    console.log("Iscrizione:", {
      evento: evento?.id,
      figlio: figlioSelezionato,
      personeAutorizzate,
      accettaTermini,
    })
    onOpenChange(false)
  }

  if (!evento) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Iscrivi tuo figlio a {evento.titolo}</DialogTitle>
          <DialogDescription>Compila il modulo per iscrivere tuo figlio all'evento</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <div className="space-y-2">
            <div className="rounded-lg border p-4 space-y-3">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
                <span>{evento.data}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{evento.luogo}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span>
                  Età: {evento.etaMin}-{evento.etaMax} anni
                </span>
              </div>
            </div>
          </div>

          <Tabs defaultValue="figlio" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="figlio">Seleziona Figlio</TabsTrigger>
              <TabsTrigger value="autorizzati">Persone Autorizzate</TabsTrigger>
            </TabsList>

            <TabsContent value="figlio" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Seleziona il figlio da iscrivere *</Label>
                <div className="space-y-2">
                  {famiglia.figli.map((figlio) => (
                    <div
                      key={figlio.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer ${
                        figlioSelezionato === figlio.id ? "border-primary bg-primary/5" : ""
                      }`}
                      onClick={() => setFiglioSelezionato(figlio.id)}
                    >
                      <Avatar>
                        <AvatarImage src={figlio.avatar} alt={figlio.nome} />
                        <AvatarFallback>{figlio.nome.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{figlio.nome}</p>
                        <p className="text-sm text-muted-foreground">{figlio.eta} anni</p>
                      </div>
                      <div className="ml-auto">
                        <div
                          className={`size-5 rounded-full border-2 ${
                            figlioSelezionato === figlio.id ? "border-primary bg-primary" : "border-muted"
                          }`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                {famiglia.figli.length === 0 && (
                  <div className="text-center p-4">
                    <p>Non hai ancora aggiunto figli alla tua famiglia</p>
                    <Button variant="link" className="mt-2">
                      Aggiungi un figlio
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="autorizzati" className="space-y-4 mt-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Persone autorizzate a ritirare il bambino</Label>
                  <span className="text-xs text-muted-foreground">(Opzionale)</span>
                </div>
                <div className="space-y-2">
                  {famiglia.personeAutorizzate.map((persona) => (
                    <div key={persona.id} className="flex items-center gap-3 p-3 rounded-lg border">
                      <Checkbox
                        id={`persona-${persona.id}`}
                        checked={personeAutorizzate.includes(persona.id)}
                        onCheckedChange={() => handlePersonaChange(persona.id)}
                      />
                      <Label
                        htmlFor={`persona-${persona.id}`}
                        className="flex items-center gap-3 cursor-pointer flex-1"
                      >
                        <Avatar>
                          <AvatarImage src={persona.avatar} alt={persona.nome} />
                          <AvatarFallback>{persona.nome.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{persona.nome}</p>
                          <p className="text-sm text-muted-foreground">{persona.relazione}</p>
                        </div>
                      </Label>
                    </div>
                  ))}
                </div>
                {famiglia.personeAutorizzate.length === 0 && (
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
                    Se non selezioni nessuna persona, solo i genitori saranno autorizzati a ritirare il bambino.
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="space-y-2 border-t pt-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="termini"
                checked={accettaTermini}
                onCheckedChange={(checked) => setAccettaTermini(checked === true)}
                required
              />
              <Label htmlFor="termini" className="text-sm">
                Accetto i termini e le condizioni dell'evento, incluse le politiche di cancellazione e rimborso *
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annulla
            </Button>
            <Button type="submit" disabled={!figlioSelezionato || !accettaTermini}>
              Conferma Iscrizione
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
