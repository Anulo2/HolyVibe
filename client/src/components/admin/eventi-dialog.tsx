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
import { CalendarIcon } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { it } from "date-fns/locale"

interface EventiDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  evento?: any
}

export function EventiDialog({ open, onOpenChange, evento }: EventiDialogProps) {
  const [formData, setFormData] = useState({
    titolo: "",
    descrizione: "",
    dataInizio: null as Date | null,
    dataFine: null as Date | null,
    luogo: "",
    etaMin: "",
    etaMax: "",
    postiTotali: "",
    stato: "bozza",
  })

  useEffect(() => {
    if (evento) {
      // Se stiamo modificando un evento esistente, popoliamo il form
      setFormData({
        titolo: evento.titolo || "",
        descrizione: evento.descrizione || "",
        dataInizio: null, // In un'app reale, qui convertiremmo la data
        dataFine: null,
        luogo: evento.luogo || "",
        etaMin: evento.etaMin?.toString() || "",
        etaMax: evento.etaMax?.toString() || "",
        postiTotali: evento.postiTotali?.toString() || "",
        stato: evento.stato || "bozza",
      })
    } else {
      // Reset del form per un nuovo evento
      setFormData({
        titolo: "",
        descrizione: "",
        dataInizio: null,
        dataFine: null,
        luogo: "",
        etaMin: "",
        etaMax: "",
        postiTotali: "",
        stato: "bozza",
      })
    }
  }, [evento, open])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { id, value } = e.target
    setFormData((prev) => ({ ...prev, [id]: value }))
  }

  const handleSelectChange = (id: string, value: string) => {
    setFormData((prev) => ({ ...prev, [id]: value }))
  }

  const handleDateChange = (field: string, date: Date | null) => {
    setFormData((prev) => ({ ...prev, [field]: date }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Qui implementeresti la logica per salvare i dati
    console.log("Dati dell'evento:", formData)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{evento ? "Modifica evento" : "Crea nuovo evento"}</DialogTitle>
          <DialogDescription>
            {evento ? "Modifica i dettagli dell'evento esistente." : "Inserisci i dettagli per creare un nuovo evento."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="titolo">Titolo evento *</Label>
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
              rows={3}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dataInizio">Data inizio *</Label>
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
                    onSelect={(date) => handleDateChange("dataInizio", date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dataFine">Data fine</Label>
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
                    {formData.dataFine ? format(formData.dataFine, "PPP", { locale: it }) : <span>Seleziona data</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.dataFine || undefined}
                    onSelect={(date) => handleDateChange("dataFine", date)}
                    initialFocus
                    disabled={(date) => (formData.dataInizio ? date < formData.dataInizio : false)}
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="etaMin">Età minima *</Label>
              <Input
                id="etaMin"
                type="number"
                min="0"
                max="18"
                value={formData.etaMin}
                onChange={handleChange}
                placeholder="Età"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="etaMax">Età massima *</Label>
              <Input
                id="etaMax"
                type="number"
                min="0"
                max="18"
                value={formData.etaMax}
                onChange={handleChange}
                placeholder="Età"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="postiTotali">Posti disponibili *</Label>
              <Input
                id="postiTotali"
                type="number"
                min="1"
                value={formData.postiTotali}
                onChange={handleChange}
                placeholder="Numero posti"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="stato">Stato *</Label>
            <Select value={formData.stato} onValueChange={(value) => handleSelectChange("stato", value)}>
              <SelectTrigger id="stato">
                <SelectValue placeholder="Seleziona stato" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bozza">Bozza</SelectItem>
                <SelectItem value="aperto">Aperto</SelectItem>
                <SelectItem value="chiuso">Chiuso</SelectItem>
                <SelectItem value="completo">Completo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annulla
            </Button>
            <Button type="submit">{evento ? "Salva Modifiche" : "Crea Evento"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
