import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { CheckCircle, XCircle } from "lucide-react"

export function AdminIscrizioniTable() {
  const iscrizioni = [
    {
      id: 1,
      bambino: {
        nome: "Luca Rossi",
        eta: 10,
        avatar: "/placeholder.svg",
      },
      genitore: {
        nome: "Mario Rossi",
        email: "mario@example.com",
      },
      evento: "Campo Estivo Montagna",
      data: "15-22 Luglio 2025",
      stato: "In attesa",
      dataIscrizione: "10/06/2025",
    },
    {
      id: 2,
      bambino: {
        nome: "Sofia Bianchi",
        eta: 8,
        avatar: "/placeholder.svg",
      },
      genitore: {
        nome: "Laura Bianchi",
        email: "laura@example.com",
      },
      evento: "Corso di Nuoto",
      data: "Ogni Martedì, Giugno 2025",
      stato: "In attesa",
      dataIscrizione: "09/06/2025",
    },
    {
      id: 3,
      bambino: {
        nome: "Marco Verdi",
        eta: 12,
        avatar: "/placeholder.svg",
      },
      genitore: {
        nome: "Giovanni Verdi",
        email: "giovanni@example.com",
      },
      evento: "Laboratorio di Robotica",
      data: "10-14 Agosto 2025",
      stato: "In attesa",
      dataIscrizione: "08/06/2025",
    },
    {
      id: 4,
      bambino: {
        nome: "Giulia Neri",
        eta: 9,
        avatar: "/placeholder.svg",
      },
      genitore: {
        nome: "Anna Neri",
        email: "anna@example.com",
      },
      evento: "Campus Sportivo",
      data: "1-31 Luglio 2025",
      stato: "In attesa",
      dataIscrizione: "07/06/2025",
    },
  ]

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b">
            <th className="text-left py-3 px-4 font-medium">Bambino</th>
            <th className="text-left py-3 px-4 font-medium">Genitore</th>
            <th className="text-left py-3 px-4 font-medium">Evento</th>
            <th className="text-left py-3 px-4 font-medium">Data Evento</th>
            <th className="text-left py-3 px-4 font-medium">Data Iscrizione</th>
            <th className="text-left py-3 px-4 font-medium">Stato</th>
            <th className="text-right py-3 px-4 font-medium">Azioni</th>
          </tr>
        </thead>
        <tbody>
          {iscrizioni.map((iscrizione) => (
            <tr key={iscrizione.id} className="border-b">
              <td className="py-3 px-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={iscrizione.bambino.avatar} alt={iscrizione.bambino.nome} />
                    <AvatarFallback>{iscrizione.bambino.nome.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{iscrizione.bambino.nome}</p>
                    <p className="text-xs text-muted-foreground">{iscrizione.bambino.eta} anni</p>
                  </div>
                </div>
              </td>
              <td className="py-3 px-4">
                <p>{iscrizione.genitore.nome}</p>
                <p className="text-xs text-muted-foreground">{iscrizione.genitore.email}</p>
              </td>
              <td className="py-3 px-4 font-medium">{iscrizione.evento}</td>
              <td className="py-3 px-4 text-sm">{iscrizione.data}</td>
              <td className="py-3 px-4 text-sm">{iscrizione.dataIscrizione}</td>
              <td className="py-3 px-4">
                <Badge variant="warning">{iscrizione.stato}</Badge>
              </td>
              <td className="py-3 px-4 text-right">
                <div className="flex justify-end gap-2">
                  <Button size="sm" variant="outline" className="h-8 gap-1">
                    <XCircle className="h-4 w-4" />
                    <span>Rifiuta</span>
                  </Button>
                  <Button size="sm" className="h-8 gap-1">
                    <CheckCircle className="h-4 w-4" />
                    <span>Approva</span>
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
