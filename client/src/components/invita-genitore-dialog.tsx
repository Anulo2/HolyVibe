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
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Mail, UserPlus } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { sendFamilyInvitation } from "@/lib/db/family-service"

interface InvitaGenitoreDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  famiglia?: any
}

export function InvitaGenitoreDialog({ open, onOpenChange, famiglia }: InvitaGenitoreDialogProps) {
  const [formData, setFormData] = useState({
    email: "",
    messaggio: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target
    setFormData((prev) => ({ ...prev, [id]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.email || !famiglia?.id) {
      toast({
        title: "Errore",
        description: "Email e famiglia sono richiesti",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const { data, error } = await sendFamilyInvitation(famiglia.id, formData.email, formData.messaggio || undefined)

      if (error) {
        throw error
      }

      toast({
        title: "Invito inviato con successo",
        description: `Un'email di invito è stata inviata a ${formData.email}`,
      })

      // Reset del form e chiusura del dialog
      setFormData({ email: "", messaggio: "" })
      onOpenChange(false)
    } catch (error) {
      console.error("Error sending invitation:", error)
      toast({
        title: "Errore durante l'invio",
        description: "Si è verificato un errore durante l'invio dell'invito. Riprova più tardi.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Invita un genitore</DialogTitle>
          <DialogDescription>
            Invita un altro genitore a unirsi a {famiglia?.nome || "questa famiglia"}. Riceverà un'email con le
            istruzioni per accettare l'invito.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email del genitore *</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="email@esempio.com"
                className="pl-10"
                required
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Assicurati che l'indirizzo email sia corretto. L'invito sarà valido per 7 giorni.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="messaggio">Messaggio personalizzato (opzionale)</Label>
            <Textarea
              id="messaggio"
              value={formData.messaggio}
              onChange={handleChange}
              placeholder="Aggiungi un messaggio personalizzato all'invito..."
              rows={3}
            />
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annulla
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <span className="flex items-center gap-1">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Invio in corso...
                </span>
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Invia invito
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
