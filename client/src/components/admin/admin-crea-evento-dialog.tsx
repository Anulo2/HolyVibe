"use client";

import { format } from "date-fns";
import { it } from "date-fns/locale";
import { CalendarIcon, Upload, Loader2 } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { cn } from "@/lib/utils";
import { useCreateEventMutation } from "@/hooks/useEventsQuery";
import { FileUpload } from "@/components/ui/file-upload";
import { useFileUpload } from "@/hooks/useFileUpload";

export function AdminCreaEventoDialog({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
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
    status: "draft" as "draft" | "open" | "closed" | "full" | "cancelled",
    immagine: null as File | null,
    imageUrl: "",
    // Extended information fields
    dettagliCompleti: "",
    programma: "",
    requisiti: "",
    cosPortare: "",
    noteGenitori: "",
    contattiEmergenza: "",
    puntoRitrovo: "",
    orarioConsegna: "",
    orarioRitiro: "",
    includePranzo: false,
    includeMerenda: false,
    trasportoFornito: false,
    dipendeMeteo: false,
    noteSpeciali: "",
    politicaCancellazione: "",
    consensoFoto: true,
    immaginiAggiuntive: "",
  });

  const createEventMutation = useCreateEventMutation();
  const fileUpload = useFileUpload({
    folder: "events",
    optimize: true,
    onUploadSuccess: (result) => {
      setFormData((prev) => ({
        ...prev,
        imageUrl: result.url,
      }));
    },
    showToasts: false, // We'll handle toasts ourselves
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleFileSelect = (file: File) => {
    setFormData((prev) => ({
      ...prev,
      immagine: file,
      imageUrl: "", // Will be set after upload
    }));
  };

  const handleFileRemove = () => {
    setFormData((prev) => ({
      ...prev,
      immagine: null,
      imageUrl: "",
    }));
    fileUpload.reset();
  };

  const handleDateChange = (
    field: "dataInizio" | "dataFine",
    date: Date | undefined,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: date || null }));
  };

  const handleDescriptionChange = (content: string) => {
    setFormData((prev) => ({ ...prev, descrizione: content }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.titolo.trim()) {
      toast.error("Il titolo è obbligatorio");
      return;
    }
    if (!formData.descrizione.trim()) {
      toast.error("La descrizione è obbligatoria");
      return;
    }
    if (!formData.dataInizio) {
      toast.error("La data di inizio è obbligatoria");
      return;
    }
    if (!formData.luogo.trim()) {
      toast.error("Il luogo è obbligatorio");
      return;
    }
    if (!formData.etaMin || !formData.etaMax) {
      toast.error("Le età minima e massima sono obbligatorie");
      return;
    }
    if (!formData.postiDisponibili) {
      toast.error("Il numero di posti disponibili è obbligatorio");
      return;
    }

    try {
      const eventData = {
        title: formData.titolo,
        description: formData.descrizione,
        startDate: formData.dataInizio.toISOString(),
        endDate: formData.dataFine?.toISOString(),
        location: formData.luogo,
        minAge: parseInt(formData.etaMin),
        maxAge: parseInt(formData.etaMax),
        maxParticipants: parseInt(formData.postiDisponibili),
        price: formData.prezzo || "0",
        imageUrl: formData.imageUrl || undefined,
        // Extended information fields
        detailedDescription: formData.dettagliCompleti || undefined,
        program: formData.programma || undefined,
        requirements: formData.requisiti || undefined,
        whatToBring: formData.cosPortare || undefined,
        parentNotes: formData.noteGenitori || undefined,
        emergencyContacts: formData.contattiEmergenza || undefined,
        meetingPoint: formData.puntoRitrovo || undefined,
        dropOffTime: formData.orarioConsegna || undefined,
        pickUpTime: formData.orarioRitiro || undefined,
        includesLunch: formData.includePranzo,
        includesSnack: formData.includeMerenda,
        transportProvided: formData.trasportoFornito,
        weatherDependent: formData.dipendeMeteo,
        specialNotes: formData.noteSpeciali || undefined,
        cancellationPolicy: formData.politicaCancellazione || undefined,
        photographyConsent: formData.consensoFoto,
        additionalImages: formData.immaginiAggiuntive || undefined,
      };

      // Upload image if selected
      if (formData.immagine && !formData.imageUrl) {
        const uploadResult = await fileUpload.uploadFile(formData.immagine);
        eventData.imageUrl = uploadResult.url;
      }

      await createEventMutation.mutateAsync(eventData);

      toast.success("Evento creato con successo!");
      setOpen(false);

      // Clean up preview URL
      if (formData.imageUrl && formData.immagine) {
        URL.revokeObjectURL(formData.imageUrl);
      }

      // Reset form
      setFormData({
        titolo: "",
        descrizione: "",
        dataInizio: null,
        dataFine: null,
        luogo: "",
        etaMin: "",
        etaMax: "",
        postiDisponibili: "",
        prezzo: "",
        status: "draft",
        immagine: null,
        imageUrl: "",
        // Extended information fields
        dettagliCompleti: "",
        programma: "",
        requisiti: "",
        cosPortare: "",
        noteGenitori: "",
        contattiEmergenza: "",
        puntoRitrovo: "",
        orarioConsegna: "",
        orarioRitiro: "",
        includePranzo: false,
        includeMerenda: false,
        trasportoFornito: false,
        dipendeMeteo: false,
        noteSpeciali: "",
        politicaCancellazione: "",
        consensoFoto: true,
        immaginiAggiuntive: "",
      });
    } catch (error) {
      console.error("Errore durante la creazione dell'evento:", error);
      toast.error("Errore durante la creazione dell'evento");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Crea Nuovo Evento</DialogTitle>
          <DialogDescription>
            Inserisci i dettagli per creare un nuovo evento. Tutti i campi
            contrassegnati con * sono obbligatori.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <Tabs defaultValue="informazioni" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="informazioni">Informazioni Base</TabsTrigger>
              <TabsTrigger value="dettagli">Dettagli Estesi</TabsTrigger>
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
                <RichTextEditor
                  content={formData.descrizione}
                  onChange={handleDescriptionChange}
                  placeholder="Descrivi l'evento in dettaglio..."
                  className="min-h-[200px]"
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
                        onSelect={(date: Date | undefined) =>
                          handleDateChange("dataInizio", date)
                        }
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
                        onSelect={(date: Date | undefined) =>
                          handleDateChange("dataFine", date)
                        }
                        initialFocus
                        disabled={(date: Date) =>
                          formData.dataInizio
                            ? date < formData.dataInizio
                            : false
                        }
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

            <TabsContent value="dettagli" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="dettagliCompleti">
                    Descrizione Dettagliata
                  </Label>
                  <RichTextEditor
                    content={formData.dettagliCompleti}
                    onChange={(content) =>
                      setFormData((prev) => ({
                        ...prev,
                        dettagliCompleti: content,
                      }))
                    }
                    placeholder="Descrizione completa e dettagliata dell'evento..."
                    className="min-h-[120px]"
                  />
                </div>

                <div>
                  <Label htmlFor="programma">Programma della Giornata</Label>
                  <RichTextEditor
                    content={formData.programma}
                    onChange={(content) =>
                      setFormData((prev) => ({ ...prev, programma: content }))
                    }
                    placeholder="Es: 9:00 - Accoglienza, 9:30 - Attività..."
                    className="min-h-[100px]"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="requisiti">Requisiti</Label>
                    <textarea
                      id="requisiti"
                      value={formData.requisiti}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border rounded-md min-h-[80px]"
                      placeholder="Requisiti o prerequisiti necessari..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="cosPortare">Cosa Portare</Label>
                    <textarea
                      id="cosPortare"
                      value={formData.cosPortare}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border rounded-md min-h-[80px]"
                      placeholder="Lista di cosa devono portare i partecipanti..."
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="noteGenitori">Note per i Genitori</Label>
                  <textarea
                    id="noteGenitori"
                    value={formData.noteGenitori}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border rounded-md min-h-[80px]"
                    placeholder="Informazioni importanti per i genitori..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="contattiEmergenza">
                      Contatti di Emergenza
                    </Label>
                    <textarea
                      id="contattiEmergenza"
                      value={formData.contattiEmergenza}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border rounded-md min-h-[60px]"
                      placeholder="Numeri di telefono per emergenze..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="puntoRitrovo">Punto di Ritrovo</Label>
                    <Input
                      id="puntoRitrovo"
                      value={formData.puntoRitrovo}
                      onChange={handleChange}
                      placeholder="Luogo specifico di ritrovo"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="orarioConsegna">Orario Consegna</Label>
                    <Input
                      id="orarioConsegna"
                      type="time"
                      value={formData.orarioConsegna}
                      onChange={handleChange}
                    />
                  </div>
                  <div>
                    <Label htmlFor="orarioRitiro">Orario Ritiro</Label>
                    <Input
                      id="orarioRitiro"
                      type="time"
                      value={formData.orarioRitiro}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium">Servizi Inclusi</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.includePranzo}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            includePranzo: e.target.checked,
                          }))
                        }
                        className="rounded"
                      />
                      <span>Include Pranzo</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.includeMerenda}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            includeMerenda: e.target.checked,
                          }))
                        }
                        className="rounded"
                      />
                      <span>Include Merenda</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.trasportoFornito}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            trasportoFornito: e.target.checked,
                          }))
                        }
                        className="rounded"
                      />
                      <span>Trasporto Fornito</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.dipendeMeteo}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            dipendeMeteo: e.target.checked,
                          }))
                        }
                        className="rounded"
                      />
                      <span>Dipende dal Meteo</span>
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="noteSpeciali">Note Speciali</Label>
                    <textarea
                      id="noteSpeciali"
                      value={formData.noteSpeciali}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border rounded-md min-h-[80px]"
                      placeholder="Note speciali o avvertenze..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="politicaCancellazione">
                      Politica di Cancellazione
                    </Label>
                    <textarea
                      id="politicaCancellazione"
                      value={formData.politicaCancellazione}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border rounded-md min-h-[80px]"
                      placeholder="Regole per cancellazioni e rimborsi..."
                    />
                  </div>
                </div>

                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.consensoFoto}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          consensoFoto: e.target.checked,
                        }))
                      }
                      className="rounded"
                    />
                    <span>
                      Richiedi consenso per foto/video durante l'evento
                    </span>
                  </label>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="media" className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Immagine Evento Principale</Label>
                  <FileUpload
                    onFileSelect={handleFileSelect}
                    onFileRemove={handleFileRemove}
                    accept="image/*"
                    maxSize={5 * 1024 * 1024} // 5MB
                    value={formData.immagine || formData.imageUrl}
                    placeholder="Trascina qui un'immagine o clicca per caricarla"
                    showPreview={true}
                    disabled={
                      createEventMutation.isPending || fileUpload.isUploading
                    }
                    uploadProgress={fileUpload.uploadProgress}
                    isUploading={fileUpload.isUploading}
                    onValidationError={(error) => toast.error(error)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="immaginiAggiuntive">
                    URL Immagini Aggiuntive (JSON)
                  </Label>
                  <textarea
                    id="immaginiAggiuntive"
                    value={formData.immaginiAggiuntive}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border rounded-md min-h-[80px]"
                    placeholder='["https://esempio1.jpg", "https://esempio2.jpg"]'
                  />
                  <p className="text-sm text-muted-foreground">
                    Inserisci un array JSON di URL immagini aggiuntive per la
                    galleria dell'evento
                  </p>
                </div>
                {fileUpload.isError && (
                  <p className="text-sm text-destructive">
                    {fileUpload.error?.message ||
                      "Errore durante il caricamento"}
                  </p>
                )}
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={createEventMutation.isPending}
            >
              Annulla
            </Button>
            <Button
              type="submit"
              disabled={createEventMutation.isPending || fileUpload.isUploading}
            >
              {createEventMutation.isPending || fileUpload.isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {fileUpload.isUploading ? "Caricamento..." : "Creazione..."}
                </>
              ) : (
                "Crea Evento"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
