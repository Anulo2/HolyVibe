import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

export function AdminRecentActivity() {
  const activities = [
    {
      id: 1,
      user: {
        name: "Mario Rossi",
        avatar: "/placeholder.svg",
      },
      action: "ha iscritto",
      target: "Luca Rossi",
      event: "Campo Estivo Montagna",
      time: "10 minuti fa",
      type: "iscrizione",
    },
    {
      id: 2,
      user: {
        name: "Laura Bianchi",
        avatar: "/placeholder.svg",
      },
      action: "ha creato",
      target: "un nuovo evento",
      event: "Corso di Pittura",
      time: "1 ora fa",
      type: "evento",
    },
    {
      id: 3,
      user: {
        name: "Giovanni Verdi",
        avatar: "/placeholder.svg",
      },
      action: "ha aggiornato",
      target: "i dettagli dell'evento",
      event: "Laboratorio di Robotica",
      time: "2 ore fa",
      type: "aggiornamento",
    },
    {
      id: 4,
      user: {
        name: "Anna Neri",
        avatar: "/placeholder.svg",
      },
      action: "ha aggiunto",
      target: "una persona autorizzata",
      event: "",
      time: "3 ore fa",
      type: "autorizzazione",
    },
    {
      id: 5,
      user: {
        name: "Paolo Gialli",
        avatar: "/placeholder.svg",
      },
      action: "ha cancellato",
      target: "un'iscrizione",
      event: "Corso di Nuoto",
      time: "5 ore fa",
      type: "cancellazione",
    },
  ]

  const getBadgeVariant = (type: string) => {
    switch (type) {
      case "iscrizione":
        return "success"
      case "evento":
        return "secondary"
      case "aggiornamento":
        return "warning"
      case "autorizzazione":
        return "default"
      case "cancellazione":
        return "destructive"
      default:
        return "outline"
    }
  }

  return (
    <div className="space-y-4">
      {activities.map((activity) => (
        <div key={activity.id} className="flex items-start gap-3 pb-3 border-b last:border-0 last:pb-0">
          <Avatar className="h-8 w-8">
            <AvatarImage src={activity.user.avatar} alt={activity.user.name} />
            <AvatarFallback>{activity.user.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <p className="text-sm">
              <span className="font-medium">{activity.user.name}</span> {activity.action}{" "}
              <span className="font-medium">{activity.target}</span>
              {activity.event && (
                <>
                  {" "}
                  per <span className="font-medium">{activity.event}</span>
                </>
              )}
            </p>
            <div className="flex items-center gap-2">
              <p className="text-xs text-muted-foreground">{activity.time}</p>
              <Badge variant={getBadgeVariant(activity.type)} className="text-[10px] px-1.5 py-0">
                {activity.type.charAt(0).toUpperCase() + activity.type.slice(1)}
              </Badge>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
