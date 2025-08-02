"use client";

import { Phone, UserPlus } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { orpcClient } from "@/lib/orpc-client";

interface InvitaGenitoreDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  famiglia?: any;
}

export function InvitaGenitoreDialog({
  open,
  onOpenChange,
  famiglia,
}: InvitaGenitoreDialogProps) {
  const [formData, setFormData] = useState({
    phoneNumber: "",
    messaggio: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.phoneNumber || !famiglia?.id) {
      toast.error("Numero di telefono e famiglia sono richiesti");
      return;
    }

    setIsSubmitting(true);

    try {
      const invitationData = {
        familyId: famiglia.id,
        phoneNumber: formData.phoneNumber,
        message: formData.messaggio || undefined,
      };

      const result = await orpcClient.family.sendInvitation(invitationData);

      if (!result.success) {
        throw new Error("Failed to send invitation");
      }

      toast.success(
        `Un SMS di invito è stato inviato a ${formData.phoneNumber}`,
      );

      // Reset del form e chiusura del dialog
      setFormData({ phoneNumber: "", messaggio: "" });
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error sending invitation:", error);

      let errorMessage =
        "Si è verificato un errore durante l'invio dell'invito. Riprova più tardi.";

      if (error.message?.includes("CONFLICT")) {
        if (error.message.includes("pending invitation")) {
          errorMessage =
            "Questo utente ha già un invito in sospeso per questa famiglia.";
        } else if (error.message.includes("already a member")) {
          errorMessage = "Questo utente è già membro di questa famiglia.";
        }
      } else if (error.message?.includes("FORBIDDEN")) {
        errorMessage =
          "Non hai i permessi per inviare inviti per questa famiglia.";
      }

      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Invita un genitore</DialogTitle>
          <DialogDescription>
            Invita un altro genitore a unirsi a{" "}
            {famiglia?.name || "questa famiglia"}. Riceverà un SMS con le
            istruzioni per registrarsi e accettare l'invito.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="phoneNumber">
              Numero di telefono del genitore *
            </Label>
            <div className="relative">
              <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="phoneNumber"
                type="tel"
                value={formData.phoneNumber}
                onChange={handleChange}
                placeholder="+39 123 456 7890"
                className="pl-10"
                required
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Inserisci il numero di telefono completo di prefisso
              internazionale. La persona riceverà un SMS con le istruzioni per
              registrarsi e unirsi alla famiglia.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="messaggio">
              Messaggio personalizzato (opzionale)
            </Label>
            <Textarea
              id="messaggio"
              value={formData.messaggio}
              onChange={handleChange}
              placeholder="Aggiungi un messaggio personalizzato all'invito..."
              rows={3}
            />
          </div>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
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
  );
}
