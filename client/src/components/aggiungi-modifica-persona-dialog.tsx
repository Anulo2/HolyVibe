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
import { CalendarIcon } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { it } from "date-fns/locale"

interface AggiungiModificaPersonaDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  persona?: any
  onClose: () => void
}

export function AggiungiModificaPersonaDialog({
  open,
  onOpenChange,
  persona,
  onClose,
}: AggiungiModificaPersonaDialogProps) {
  const [formData, setFormData] = useState({
    nome: "",
    relazione: "",
    telefono: "",
    email: "",
    documentoTipo: "",
    documentoNumero: "",
    documentoScadenza: null as Date | null,
  })

  useEffect(() => {
    if (persona) {
      // Se stiamo modificando una persona esistente, popoliamo il form
      setFormData({
        nome: persona.nome || "",
        relazione: persona.relazione || "",
        telefono: persona.telefono || "",
        email: persona.email || "",
        documentoTipo: persona.documento?.tipo || "",
        documentoNumero: persona.documento?.numero || "",
        documentoScadenza: persona.documento?.scadenza ? new Date(persona.documento.scadenza) : null,
      })
    } else {
      // Reset del form per una nuova persona
      setFormData({
        nome: "",
        relazione: "",
        telefono: "",
        email: "",
        documentoTipo: "",
        documentoNumero: "",
        documentoScadenza: null,
      })
    }
  }, [persona, open])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { id, value } = e.target
    setFormData((prev) => ({ ...prev, [id]: value }))
  }

  const handleDateChange = (date: Date | null) => {
    setFormData((prev) => ({ ...prev, documentoScadenza: date }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Qui implementeresti la logica per salvare i dati
    console.log("Dati della persona:", formData)
    onClose()
  }

  const relazioniOptions = [
    "Nonno",
    "Nonna",
    "Zio",
    "Zia",
    "Fratello maggiorenne",
    "Sorella maggiorenne",
    "Cugino/a",
    "Amico di famiglia",
    "Baby sitter",
    "Altro",
  ]

  const documentiOptions = ["Carta d'identità", "Patente", "Passaporto", "Altro documento"]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{persona ? "Modifica persona autorizzata" : "Aggiungi persona autorizzata"}</DialogTitle>
          <DialogDescription>
            {persona
              ? "Modifica i dati della persona autorizzata a ritirare i tuoi figli. Tutti i campi contrassegnati con * sono obbligatori."
              : "Aggiungi una persona autorizzata a ritirare i tuoi figli (nonni, zii, ecc.). Tutti i campi contrassegnati con * sono obbligatori."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome completo *</Label>
            <Input id="nome" value={formData.nome} onChange={handleChange} placeholder="Nome e cognome" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="relazione">Relazione con il bambino *</Label>
            <select
              id="relazione"
              value={formData.relazione}
              onChange={handleChange}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              required
            >
              <option value="">Seleziona relazione</option>
              {relazioniOptions.map((relazione) => (
                <option key={relazione} value={relazione}>
                  {relazione}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="telefono">Telefono *</Label>
              <Input
                id="telefono"
                value={formData.telefono}
                onChange={handleChange}
                placeholder="Numero di telefono"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Indirizzo email"
              />
            </div>
          </div>

          <div className="border-t pt-4 mt-4">
            <h3 className="text-lg font-medium mb-4">Documento d'identità</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="documentoTipo">Tipo documento *</Label>
                <select
                  id="documentoTipo"
                  value={formData.documentoTipo}
                  onChange={handleChange}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  required
                >
                  <option value="">Seleziona tipo documento</option>
                  {documentiOptions.map((doc) => (
                    <option key={doc} value={doc}>
                      {doc}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="documentoNumero">Numero documento *</Label>
                <Input
                  id="documentoNumero"
                  value={formData.documentoNumero}
                  onChange={handleChange}
                  placeholder="Numero del documento"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="documentoScadenza">Data di scadenza *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="documentoScadenza"
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.documentoScadenza && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.documentoScadenza ? (
                        format(formData.documentoScadenza, "PPP", { locale: it })
                      ) : (
                        <span>Seleziona data</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.documentoScadenza || undefined}
                      onSelect={handleDateChange}
                      initialFocus
                      disabled={(date) => date < new Date()}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={onClose}>
              Annulla
            </Button>
            <Button type="submit">{persona ? "Salva Modifiche" : "Aggiungi Persona"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
