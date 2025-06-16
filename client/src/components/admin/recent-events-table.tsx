import { CalendarDays, MapPin, Users } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export function RecentEventsTable() {
  // Dati di esempio per gli eventi recenti
  const recentEvents = [
    {
      id: 1,
      titolo: "Campo Estivo Montagna",
      data: "15-22 Luglio 2025",
      luogo: "Dolomiti, Trentino",
      postiDisponibili: 15,
      postiTotali: 20,
      stato: "aperto",
    },
    {
      id: 2,
      titolo: "Corso di Nuoto",
      data: "Ogni Martedì, Giugno 2025",
      luogo: "Piscina Comunale, Milano",
      postiDisponibili: 8,
      postiTotali: 15,
      stato: "aperto",
    },
    {
      id: 3,
      titolo: "Laboratorio di Robotica",
      data: "10-14 Agosto 2025",
      luogo: "Centro Culturale, Roma",
      postiDisponibili: 12,
      postiTotali: 12,
      stato: "bozza",
    },
    {
      id: 5,
      titolo: "Corso di Pittura",
      data: "5-20 Giugno 2025",
      luogo: "Accademia delle Arti, Bologna",
      postiDisponibili: 0,
      postiTotali: 15,
      stato: "completo",
    },
  ]

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>Eventi Recenti</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentEvents.map((event) => (
            <div
              key={event.id}
              className="flex flex-col md:flex-row md:items-center justify-between border-b pb-4 last:border-0 last:pb-0 gap-4"
            >
              <div>
                <h3 className="font-medium">{event.titolo}</h3>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 text-sm text-muted-foreground mt-1">
                  <div className="flex items-center gap-1">
                    <CalendarDays className="h-3.5 w-3.5" />
                    <span>{event.data}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    <span>{event.luogo}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {event.postiDisponibili}/{event.postiTotali}
                  </span>
                </div>
                <Badge
                  variant={
                    event.stato === "aperto"
                      ? "success"
                      : event.stato === "bozza"
                        ? "secondary"
                        : event.stato === "chiuso"
                          ? "destructive"
                          : "warning"
                  }
                >
                  {event.stato.charAt(0).toUpperCase() + event.stato.slice(1)}
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
