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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Camera } from "lucide-react"

interface UtentiDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  utente?: any
}

export function UtentiDialog({ open, onOpenChange, utente }: UtentiDialogProps) {
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    ruolo: "utente",
    stato: "attivo",
    password: "",
    confermaPassword: "",
    avatar: "/placeholder.svg",
  })

  useEffect(() => {
    if (utente) {
      // Se stiamo modificando un utente esistente, popoliamo il form
      setFormData({
        nome: utente.nome || "",
        email: utente.email || "",
        ruolo: utente.ruolo || "utente",
        stato: utente.stato || "attivo",
        password: "",
        confermaPassword: "",
        avatar: utente.avatar || "/placeholder.svg",
      })
    } else {
      // Reset del form per un nuovo utente
      setFormData({
        nome: "",
        email: "",
        ruolo: "utente",
        stato: "attivo",
        password: "",
        confermaPassword: "",
        avatar: "/placeholder.svg",
      })
    }
  }, [utente, open])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { id, value } = e.target
    setFormData((prev) => ({ ...prev, [id]: value }))
  }

  const handleSelectChange = (id: string, value: string) => {
    setFormData((prev) => ({ ...prev, [id]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Qui implementeresti la logica per salvare i dati
    console.log("Dati dell'utente:", formData)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{utente ? "Modifica utente" : "Crea nuovo utente"}</DialogTitle>
          <DialogDescription>
            {utente ? "Modifica i dettagli dell'utente esistente." : "Inserisci i dettagli per creare un nuovo utente."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <Avatar className="h-24 w-24">
                <AvatarImage src={formData.avatar} alt="Avatar" />
                <AvatarFallback>{formData.nome.charAt(0) || "U"}</AvatarFallback>
              </Avatar>
              <Button size="icon" variant="secondary" className="absolute bottom-0 right-0 rounded-full">
                <Camera className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="nome">Nome completo *</Label>
            <Input id="nome" value={formData.nome} onChange={handleChange} placeholder="Nome e cognome" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Indirizzo email"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ruolo">Ruolo *</Label>
              <Select value={formData.ruolo} onValueChange={(value) => handleSelectChange("ruolo", value)}>
                <SelectTrigger id="ruolo">
                  <SelectValue placeholder="Seleziona ruolo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="utente">Utente</SelectItem>
                  <SelectItem value="animatore">Animatore</SelectItem>
                  <SelectItem value="editor">Editor</SelectItem>
                  <SelectItem value="amministratore">Amministratore</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="stato">Stato *</Label>
              <Select value={formData.stato} onValueChange={(value) => handleSelectChange("stato", value)}>
                <SelectTrigger id="stato">
                  <SelectValue placeholder="Seleziona stato" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="attivo">Attivo</SelectItem>
                  <SelectItem value="inattivo">Inattivo</SelectItem>
                  <SelectItem value="sospeso">Sospeso</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {!utente && (
            <>
              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Password"
                  required={!utente}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confermaPassword">Conferma password *</Label>
                <Input
                  id="confermaPassword"
                  type="password"
                  value={formData.confermaPassword}
                  onChange={handleChange}
                  placeholder="Conferma password"
                  required={!utente}
                />
              </div>
            </>
          )}

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annulla
            </Button>
            <Button type="submit">{utente ? "Salva Modifiche" : "Crea Utente"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
