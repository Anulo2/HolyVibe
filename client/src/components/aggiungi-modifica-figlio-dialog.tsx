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
import { CalendarIcon, AlertCircle, Loader2 } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { it } from "date-fns/locale"
import { toast } from "sonner"
import { useAddChildMutation, useUpdateChildMutation } from "../hooks/useFamilyQuery"

// Helper function to format date as YYYY-MM-DD without timezone issues
const formatDateForSubmission = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Helper function to parse date string without timezone issues
const parseDateString = (dateString: string): Date => {
  const [year, month, day] = dateString.split('-').map(Number)
  return new Date(year, month - 1, day) // month is 0-indexed in Date constructor
}

interface Child {
  id: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  birthPlace?: string;
  fiscalCode?: string;
  gender?: 'M' | 'F' | 'A';
  allergies?: string;
  medicalNotes?: string;
  familyId: string;
}

interface AggiungiModificaFiglioDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  child?: Child
  familyId: string
  onSuccess: () => void
}

export function AggiungiModificaFiglioDialog({
  open,
  onOpenChange,
  child,
  familyId,
  onSuccess,
}: AggiungiModificaFiglioDialogProps) {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    birthDate: null as Date | null,
    birthPlace: "",
    fiscalCode: "",
    gender: "" as "" | "M" | "F" | "A",
    allergies: "",
    medicalNotes: "",
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  const { mutateAsync: addChildMutation } = useAddChildMutation()
  const { mutateAsync: updateChildMutation } = useUpdateChildMutation()

  useEffect(() => {
    if (child) {
      // Se stiamo modificando un figlio esistente, popoliamo il form
      setFormData({
        firstName: child.firstName || "",
        lastName: child.lastName || "",
        birthDate: child.birthDate ? parseDateString(child.birthDate) : null,
        birthPlace: child.birthPlace || "",
        fiscalCode: child.fiscalCode || "",
        gender: child.gender || "",
        allergies: child.allergies || "",
        medicalNotes: child.medicalNotes || "",
      })
    } else {
      // Reset del form per un nuovo figlio
      setFormData({
        firstName: "",
        lastName: "",
        birthDate: null,
        birthPlace: "",
        fiscalCode: "",
        gender: "",
        allergies: "",
        medicalNotes: "",
      })
    }
    setErrors({})
  }, [child, open])

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { value } = e.target
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }))
    }
  }

  const handleSelectChange = (field: string) => (value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }))
    }
  }

  const handleDateChange = (date: Date | null) => {
    setFormData((prev) => ({ ...prev, birthDate: date }))
    if (errors.birthDate) {
      setErrors(prev => ({ ...prev, birthDate: "" }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.firstName.trim()) {
      newErrors.firstName = "Il nome è obbligatorio"
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = "Il cognome è obbligatorio"
    }

    if (!formData.birthDate) {
      newErrors.birthDate = "La data di nascita è obbligatoria"
    } else if (formData.birthDate > new Date()) {
      newErrors.birthDate = "La data di nascita non può essere nel futuro"
    }

    if (!formData.gender) {
      newErrors.gender = "Il genere è obbligatorio"
    }

    if (formData.fiscalCode && formData.fiscalCode.length !== 16) {
      newErrors.fiscalCode = "Il codice fiscale deve essere di 16 caratteri"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      const submitData = {
        familyId,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        birthDate: formatDateForSubmission(formData.birthDate!), // Format as YYYY-MM-DD
        birthPlace: formData.birthPlace.trim() || undefined,
        fiscalCode: formData.fiscalCode.trim() || undefined,
        gender: formData.gender === 'A' ? 'O' : formData.gender as 'M' | 'F' | 'O',
        allergies: formData.allergies.trim() || undefined,
        medicalNotes: formData.medicalNotes.trim() || undefined,
      }

      if (child) {
        // Update existing child
        const updateData = {
          id: child.id,
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          birthDate: formatDateForSubmission(formData.birthDate!),
          birthPlace: formData.birthPlace.trim() || undefined,
          fiscalCode: formData.fiscalCode.trim() || undefined,
          gender: formData.gender === 'A' ? 'O' : formData.gender as 'M' | 'F' | 'O',
          allergies: formData.allergies.trim() || undefined,
          medicalNotes: formData.medicalNotes.trim() || undefined,
        };
        
        console.log("Sending update data:", updateData);
        await updateChildMutation(updateData);
        toast.success("Bambino modificato con successo!")
      } else {
        // Add new child
        await addChildMutation(submitData)
        toast.success("Bambino aggiunto con successo!")
      }
      onSuccess()
      onOpenChange(false)
    } catch (error) {
      console.error("Errore durante il salvataggio:", error)
      toast.error("Errore durante il salvataggio. Riprova.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {child ? "Modifica dati figlio" : "Aggiungi un nuovo figlio"}
          </DialogTitle>
          <DialogDescription>
            {child
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
                  <Label htmlFor="firstName">Nome *</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={handleChange("firstName")}
                    placeholder="Nome del figlio"
                    className={cn(errors.firstName && "border-red-500")}
                    disabled={isSubmitting}
                  />
                  {errors.firstName && (
                    <p className="text-sm text-red-600">{errors.firstName}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Cognome *</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={handleChange("lastName")}
                    placeholder="Cognome del figlio"
                    className={cn(errors.lastName && "border-red-500")}
                    disabled={isSubmitting}
                  />
                  {errors.lastName && (
                    <p className="text-sm text-red-600">{errors.lastName}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Data di Nascita *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.birthDate && "text-muted-foreground",
                          errors.birthDate && "border-red-500"
                        )}
                        disabled={isSubmitting}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.birthDate ? (
                          format(formData.birthDate, "PPP", { locale: it })
                        ) : (
                          <span>Seleziona data</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <div className="p-3">
                        <div className="flex items-center justify-between space-x-2 mb-3">
                          <Select
                            value={formData.birthDate ? formData.birthDate.getFullYear().toString() : ""}
                            onValueChange={(year) => {
                              const currentDate = formData.birthDate || new Date()
                              const newDate = new Date(currentDate)
                              newDate.setFullYear(parseInt(year))
                              handleDateChange(newDate)
                            }}
                          >
                            <SelectTrigger className="w-[100px]">
                              <SelectValue placeholder="Anno" />
                            </SelectTrigger>
                            <SelectContent>
                              {Array.from({ length: 35 }, (_, i) => {
                                const year = new Date().getFullYear() - i
                                return (
                                  <SelectItem key={year} value={year.toString()}>
                                    {year}
                                  </SelectItem>
                                )
                              })}
                            </SelectContent>
                          </Select>
                          
                          <Select
                            value={formData.birthDate ? formData.birthDate.getMonth().toString() : ""}
                            onValueChange={(month) => {
                              const currentDate = formData.birthDate || new Date()
                              const newDate = new Date(currentDate)
                              newDate.setMonth(parseInt(month))
                              handleDateChange(newDate)
                            }}
                          >
                            <SelectTrigger className="w-[120px]">
                              <SelectValue placeholder="Mese" />
                            </SelectTrigger>
                            <SelectContent>
                              {[
                                "Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno",
                                "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"
                              ].map((month, index) => (
                                <SelectItem key={index} value={index.toString()}>
                                  {month}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <Calendar
                          mode="single"
                          selected={formData.birthDate || undefined}
                          onSelect={handleDateChange}
                          disabled={(date) => date > new Date()}
                          month={formData.birthDate || undefined}
                          className="border-0"
                        />
                      </div>
                    </PopoverContent>
                  </Popover>
                  {errors.birthDate && (
                    <p className="text-sm text-red-600">{errors.birthDate}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Genere *</Label>
                  <Select 
                    value={formData.gender} 
                    onValueChange={handleSelectChange("gender")}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger className={cn(errors.gender && "border-red-500")}>
                      <SelectValue placeholder="Seleziona genere" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="M">Maschio</SelectItem>
                      <SelectItem value="F">Femmina</SelectItem>
                      <SelectItem value="A">Altro</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.gender && (
                    <p className="text-sm text-red-600">{errors.gender}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="birthPlace">Luogo di Nascita</Label>
                <Input
                  id="birthPlace"
                  value={formData.birthPlace}
                  onChange={handleChange("birthPlace")}
                  placeholder="Città di nascita"
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fiscalCode">Codice Fiscale</Label>
                <Input
                  id="fiscalCode"
                  value={formData.fiscalCode}
                  onChange={handleChange("fiscalCode")}
                  placeholder="Codice fiscale (opzionale)"
                  maxLength={16}
                  className={cn("uppercase", errors.fiscalCode && "border-red-500")}
                  disabled={isSubmitting}
                />
                {errors.fiscalCode && (
                  <p className="text-sm text-red-600">{errors.fiscalCode}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Inserisci il codice fiscale di 16 caratteri (opzionale)
                </p>
              </div>
            </TabsContent>

            <TabsContent value="sanitari" className="space-y-4 mt-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="allergies">Allergie e Intolleranze</Label>
                  <div className="rounded-full bg-amber-100 p-1">
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                  </div>
                </div>
                <Textarea
                  id="allergies"
                  value={formData.allergies}
                  onChange={handleChange("allergies")}
                  placeholder="Elenca eventuali allergie o intolleranze alimentari (lascia vuoto se non presenti)"
                  rows={3}
                  disabled={isSubmitting}
                />
                <p className="text-xs text-muted-foreground">
                  Queste informazioni sono importanti per garantire la sicurezza del bambino durante gli eventi
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="medicalNotes">Note Mediche</Label>
                <Textarea
                  id="medicalNotes"
                  value={formData.medicalNotes}
                  onChange={handleChange("medicalNotes")}
                  placeholder="Eventuali condizioni mediche, farmaci da assumere o altre informazioni sanitarie importanti"
                  rows={3}
                  disabled={isSubmitting}
                />
                <p className="text-xs text-muted-foreground">
                  Informazioni aggiuntive che potrebbero essere utili in caso di emergenza
                </p>
              </div>
            </TabsContent>

            <DialogFooter className="mt-6">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Annulla
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {child ? "Salva Modifiche" : "Aggiungi Figlio"}
              </Button>
            </DialogFooter>
          </form>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
