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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CalendarIcon, AlertCircle } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { it } from "date-fns/locale"

interface AggiungiModificaFiglioDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  figlio?: any
  onClose: () => void
}

export function AggiungiModificaFiglioDialog({
  open,
  onOpenChange,
  figlio,
  onClose,
}: AggiungiModificaFiglioDialogProps) {
  const [formData, setFormData] = useState({
    nome: "",
    cognome: "",
    dataNascita: null as Date | null,
    luogoNascita: "",
    codiceFiscale: "",
    genere: "",
    allergie: "",
  })

  useEffect(() => {
    if (figlio) {
      // Se stiamo modificando un figlio esistente, popoliamo il form
      const [nome, cognome] = figlio.nome.split(" ")
      setFormData({
        nome: nome || "",
        cognome: cognome || "",
        dataNascita: figlio.dataNascita ? new Date(figlio.dataNascita) : null,
        luogoNascita: figlio.luogoNascita || "",
        codiceFiscale: figlio.codiceFiscale || "",
        genere: figlio.ruolo === "Figlio" ? "M" : figlio.ruolo === "Figlia" ? "F" : "",
        allergie: figlio.allergie || "",
      })
    } else {
      // Reset del form per un nuovo figlio
      setFormData({
        nome: "",
        cognome: "",
        dataNascita: null,
        luogoNascita: "",
        codiceFiscale: "",
        genere: "",
        allergie: "",
      })
    }
  }, [figlio, open])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { id, value } = e.target
    setFormData((prev) => ({ ...prev, [id]: value }))
  }

  const handleDateChange = (date: Date | null) => {
    setFormData((prev) => ({ ...prev, dataNascita: date }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Qui implementeresti la logica per salvare i dati
    console.log("Dati del figlio:", formData)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{figlio ? "Modifica dati figlio" : "Aggiungi un nuovo figlio"}</DialogTitle>
          <DialogDescription>
            {figlio
              ? "Modifica i dati del figlio. Tutti i campi contrassegnati con * sono obbligatori."
              : "Inserisci i dati del figlio da aggiungere alla famiglia. Tutti i campi contrassegnati con * sono obbligatori."}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="anagrafica" className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="anagrafica">Dati Anagrafici</TabsTrigger>
            <TabsTrigger value="sanitari">Dati Sanitari</TabsTrigger>
          </TabsList>

          <form onSubmit={handleSubmit}>
            <TabsContent value="anagrafica" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome *</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={handleChange}
                    placeholder="Nome del figlio"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cognome">Cognome *</Label>
                  <Input
                    id="cognome"
                    value={formData.cognome}
                    onChange={handleChange}
                    placeholder="Cognome del figlio"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dataNascita">Data di Nascita *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.dataNascita && "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.dataNascita ? (
                          format(formData.dataNascita, "PPP", { locale: it })
                        ) : (
                          <span>Seleziona data</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.dataNascita || undefined}
                        onSelect={handleDateChange}
                        initialFocus
                        disabled={(date) => date > new Date()}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="genere">Genere *</Label>
                  <select
                    id="genere"
                    value={formData.genere}
                    onChange={handleChange}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    required
                  >
                    <option value="">Seleziona</option>
                    <option value="M">Maschio</option>
                    <option value="F">Femmina</option>
                    <option value="A">Altro</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="luogoNascita">Luogo di Nascita *</Label>
                <Input
                  id="luogoNascita"
                  value={formData.luogoNascita}
                  onChange={handleChange}
                  placeholder="Città di nascita"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="codiceFiscale">Codice Fiscale *</Label>
                <Input
                  id="codiceFiscale"
                  value={formData.codiceFiscale}
                  onChange={handleChange}
                  placeholder="Codice fiscale"
                  required
                  maxLength={16}
                  className="uppercase"
                />
                <p className="text-xs text-muted-foreground">Inserisci il codice fiscale di 16 caratteri</p>
              </div>
            </TabsContent>

            <TabsContent value="sanitari" className="space-y-4 mt-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="allergie">Allergie e Intolleranze</Label>
                  <div className="rounded-full bg-amber-100 p-1">
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                  </div>
                </div>
                <Textarea
                  id="allergie"
                  value={formData.allergie}
                  onChange={handleChange}
                  placeholder="Elenca eventuali allergie o intolleranze alimentari (lascia vuoto se non presenti)"
                  rows={4}
                />
                <p className="text-xs text-muted-foreground">
                  Queste informazioni sono importanti per garantire la sicurezza del bambino durante gli eventi
                </p>
              </div>

              {/* Qui potresti aggiungere altri campi sanitari come:
                  - Medicinali da assumere
                  - Condizioni mediche particolari
                  - Contatti di emergenza
                  - ecc. */}
            </TabsContent>

            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={onClose}>
                Annulla
              </Button>
              <Button type="submit">{figlio ? "Salva Modifiche" : "Aggiungi Figlio"}</Button>
            </DialogFooter>
          </form>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
