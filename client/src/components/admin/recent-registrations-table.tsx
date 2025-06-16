import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export function RecentRegistrationsTable() {
  // Dati di esempio per le iscrizioni recenti
  const recentRegistrations = [
    {
      id: 1,
      evento: "Campo Estivo Montagna",
      bambino: {
        nome: "Luca Rossi",
        eta: 10,
        avatar: "/placeholder.svg",
      },
      genitore: {
        nome: "Mario Rossi",
        email: "mario.rossi@example.com",
        avatar: "/placeholder.svg",
      },
      dataIscrizione: "2025-02-15",
      stato: "confermata",
    },
    {
      id: 2,
      evento: "Corso di Nuoto",
      bambino: {
        nome: "Sofia Rossi",
        eta: 7,
        avatar: "/placeholder.svg",
      },
      genitore: {
        nome: "Mario Rossi",
        email: "mario.rossi@example.com",
        avatar: "/placeholder.svg",
      },
      dataIscrizione: "2025-02-20",
      stato: "confermata",
    },
    {
      id: 4,
      evento: "Campus Sportivo",
      bambino: {
        nome: "Giulia Verdi",
        eta: 9,
        avatar: "/placeholder.svg",
      },
      genitore: {
        nome: "Giuseppe Verdi",
        email: "giuseppe.verdi@example.com",
        avatar: "/placeholder.svg",
      },
      dataIscrizione: "2025-03-01",
      stato: "in attesa",
    },
    {
      id: 5,
      evento: "Corso di Pittura",
      bambino: {
        nome: "Andrea Neri",
        eta: 8,
        avatar: "/placeholder.svg",
      },
      genitore: {
        nome: "Anna Neri",
        email: "anna.neri@example.com",
        avatar: "/placeholder.svg",
      },
      dataIscrizione: "2025-02-25",
      stato: "confermata",
    },
  ]

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>Iscrizioni Recenti</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentRegistrations.map((registration) => (
            <div
              key={registration.id}
              className="flex flex-col md:flex-row md:items-center justify-between border-b pb-4 last:border-0 last:pb-0 gap-4"
            >
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={registration.bambino.avatar} alt={registration.bambino.nome} />
                  <AvatarFallback>{registration.bambino.nome.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-medium">{registration.bambino.nome}</h3>
                  <p className="text-sm text-muted-foreground">{registration.evento}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-sm">
                  <span className="text-muted-foreground">Genitore:</span> {registration.genitore.nome}
                </div>
                <Badge
                  variant={
                    registration.stato === "confermata"
                      ? "success"
                      : registration.stato === "in attesa"
                        ? "secondary"
                        : "destructive"
                  }
                >
                  {registration.stato.charAt(0).toUpperCase() + registration.stato.slice(1)}
                </Badge>
                <Button variant="outline" size="sm">
                  Dettagli
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
