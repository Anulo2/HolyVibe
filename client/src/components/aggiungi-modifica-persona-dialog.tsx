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

interface AggiungiModificaPersonaDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  familyId: string | null
  onAddPerson: (data: any) => void
  onUpdatePerson: (data: any) => void
  person?: any
}

export function AggiungiModificaPersonaDialog({
  open,
  onOpenChange,
  familyId,
  onAddPerson,
  onUpdatePerson,
  person,
}: AggiungiModificaPersonaDialogProps) {
  const [formData, setFormData] = useState({
    fullName: "",
    relationship: "",
    phone: "",
    email: "",
  })

  useEffect(() => {
    if (person) {
      // Se stiamo modificando una persona esistente, popoliamo il form
      setFormData({
        fullName: person.fullName || "",
        relationship: person.relationship || "",
        phone: person.phone || "",
        email: person.email || "",
      })
    } else {
      // Reset del form per una nuova persona
      setFormData({
        fullName: "",
        relationship: "",
        phone: "",
        email: "",
      })
    }
  }, [person, open])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { id, value } = e.target
    setFormData((prev) => ({ ...prev, [id]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!familyId) return

    // Clean up the data before sending - convert empty strings to undefined
    const cleanedData = {
      fullName: formData.fullName.trim(),
      relationship: formData.relationship,
      phone: formData.phone.trim() || undefined,
      email: formData.email.trim() || undefined,
    }

    if (person) {
      // Editing existing person
      onUpdatePerson({
        id: person.id,
        ...cleanedData,
      })
    } else {
      // Adding new person
      onAddPerson({
        familyId,
        ...cleanedData,
      })
    }
    
    onOpenChange(false)
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{person ? "Modifica persona autorizzata" : "Aggiungi persona autorizzata"}</DialogTitle>
          <DialogDescription>
            {person
              ? "Modifica i dati della persona autorizzata a ritirare i tuoi figli."
              : "Aggiungi una persona autorizzata a ritirare i tuoi figli (nonni, zii, ecc.)."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Nome completo *</Label>
            <Input 
              id="fullName" 
              value={formData.fullName} 
              onChange={handleChange} 
              placeholder="Nome e cognome" 
              required 
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="relationship">Relazione con il bambino *</Label>
            <select
              id="relationship"
              value={formData.relationship}
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
              <Label htmlFor="phone">Telefono *</Label>
              <Input
                id="phone"
                value={formData.phone}
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
                placeholder="Indirizzo email (opzionale)"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annulla
            </Button>
            <Button type="submit" disabled={!familyId}>
              {person ? "Modifica" : "Aggiungi"} Persona
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
