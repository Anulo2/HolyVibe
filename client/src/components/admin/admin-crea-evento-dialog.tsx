"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CalendarIcon, Upload } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { it } from "date-fns/locale"

export function AdminCreaEventoDialog({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState({
    titolo: "",
    descrizione: "",
    dataInizio: null as Date | null,
    dataFine: null as Date | null,
    luogo: "",
    etaMin: "",
    etaMax: "",
    postiDisponibili: "",
    prezzo: "",
    immagine: null as File | null,
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target
    setFormData((prev) => ({ ...prev, [id]: value }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData((prev) => ({ ...prev, immagine: e.target.files![0] }))
    }
  }

  const handleDateChange = (field: "dataInizio" | "dataFine", date: Date | undefined) => {
    setFormData((prev) => ({ ...prev, [field]: date || null }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("Dati evento:", formData)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Crea Nuovo Evento</DialogTitle>
          <DialogDescription>
            Inserisci i dettagli per creare un nuovo evento. Tutti i campi contrassegnati con * sono obbligatori.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <Tabs defaultValue="informazioni" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="informazioni">Informazioni</TabsTrigger>
              <TabsTrigger value="dettagli">Dettagli</TabsTrigger>
              <TabsTrigger value="media">Media</TabsTrigger>
            </TabsList>

            <TabsContent value="informazioni" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="titolo">Titolo Evento *</Label>
                <Input
                  id="titolo"
                  value={formData.titolo}
                  onChange={handleChange}
                  placeholder="Inserisci il titolo dell'evento"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="descrizione">Descrizione *</Label>
                <Textarea
                  id="descrizione"
                  value={formData.descrizione}
                  onChange={handleChange}
                  placeholder="Descrivi l'evento"
                  rows={4}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dataInizio">Data Inizio *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        id="dataInizio"
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.dataInizio && "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.dataInizio ? (
                          format(formData.dataInizio, "PPP", { locale: it })
                        ) : (
                          <span>Seleziona data</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.dataInizio || undefined}
                        onSelect={(date: Date | undefined) => handleDateChange("dataInizio", date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dataFine">Data Fine *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        id="dataFine"
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.dataFine && "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.dataFine ? (
                          format(formData.dataFine, "PPP", { locale: it })
                        ) : (
                          <span>Seleziona data</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.dataFine || undefined}
                        onSelect={(date: Date | undefined) => handleDateChange("dataFine", date)}
                        initialFocus
                        disabled={(date: Date) => (formData.dataInizio ? date < formData.dataInizio : false)}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="luogo">Luogo *</Label>
                <Input
                  id="luogo"
                  value={formData.luogo}
                  onChange={handleChange}
                  placeholder="Inserisci il luogo dell'evento"
                  required
                />
              </div>
            </TabsContent>

            <TabsContent value="dettagli" className="space-y-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="etaMin">Età Minima *</Label>
                  <Input
                    id="etaMin"
                    type="number"
                    min="0"
                    max="18"
                    value={formData.etaMin}
                    onChange={handleChange}
                    placeholder="Età minima"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="etaMax">Età Massima *</Label>
                  <Input
                    id="etaMax"
                    type="number"
                    min="0"
                    max="18"
                    value={formData.etaMax}
                    onChange={handleChange}
                    placeholder="Età massima"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="postiDisponibili">Posti Disponibili *</Label>
                  <Input
                    id="postiDisponibili"
                    type="number"
                    min="1"
                    value={formData.postiDisponibili}
                    onChange={handleChange}
                    placeholder="Numero di posti"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="prezzo">Prezzo (€) *</Label>
                  <Input
                    id="prezzo"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.prezzo}
                    onChange={handleChange}
                    placeholder="Prezzo in euro"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Stato Evento</Label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                  <option value="preparazione">In preparazione</option>
                  <option value="attivo">Attivo</option>
                  <option value="completo">Completo</option>
                  <option value="concluso">Concluso</option>
                  <option value="annullato">Annullato</option>
                </select>
              </div>
            </TabsContent>

            <TabsContent value="media" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="immagine">Immagine Evento *</Label>
                <div className="border-2 border-dashed rounded-md p-6 flex flex-col items-center justify-center">
                  <Upload className="h-10 w-10 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground mb-1">Trascina qui un'immagine o clicca per caricarla</p>
                  <p className="text-xs text-muted-foreground">PNG, JPG o WEBP (max. 2MB)</p>
                  <Input id="immagine" type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    onClick={() => document.getElementById("immagine")?.click()}
                  >
                    Seleziona File
                  </Button>
                  {formData.immagine && <p className="text-sm mt-2">File selezionato: {formData.immagine.name}</p>}
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Annulla
            </Button>
            <Button type="submit">Crea Evento</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
