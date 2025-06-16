"use client"

import { useState } from "react"
import { Bell, User, ChevronDown, Settings, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { useAuth } from "@/hooks/useAuth"

export function AdminHeader() {
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const { session, signOut } = useAuth()
  const user = session?.user

  // Dati di esempio per le notifiche
  const notifications = [
    {
      id: 1,
      title: "Nuova iscrizione",
      message: "Luca Rossi è stato iscritto al Campo Estivo Montagna",
      time: "10 minuti fa",
      read: false,
    },
    {
      id: 2,
      title: "Nuovo utente",
      message: "Marco Gialli si è registrato alla piattaforma",
      time: "1 ora fa",
      read: false,
    },
    {
      id: 3,
      title: "Pagamento ricevuto",
      message: "Pagamento ricevuto per l'iscrizione di Sofia Rossi",
      time: "3 ore fa",
      read: true,
    },
  ]

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <header className="h-16 border-b bg-card flex items-center px-6 justify-between">
      <div>{/* Qui puoi aggiungere un titolo o breadcrumb */}</div>

      <div className="flex items-center gap-4">
        <Sheet open={notificationsOpen} onOpenChange={setNotificationsOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                >
                  {unreadCount}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Notifiche</SheetTitle>
              <SheetDescription>Le tue notifiche recenti</SheetDescription>
            </SheetHeader>
            <div className="mt-6 space-y-4">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 rounded-lg border ${!notification.read ? "bg-muted/50" : ""}`}
                >
                  <div className="flex justify-between items-start">
                    <h4 className="font-medium">{notification.title}</h4>
                    <span className="text-xs text-muted-foreground">{notification.time}</span>
                  </div>
                  <p className="text-sm mt-1">{notification.message}</p>
                </div>
              ))}
              {notifications.length === 0 && (
                <div className="text-center py-6 text-muted-foreground">Nessuna notifica</div>
              )}
            </div>
          </SheetContent>
        </Sheet>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.avatarUrl || "/placeholder.svg"} alt={user?.name || "Admin"} />
                <AvatarFallback>{user?.name?.charAt(0) || "A"}</AvatarFallback>
              </Avatar>
              <div className="flex items-center gap-1">
                <span className="text-sm font-medium">{user?.name || "Admin"}</span>
                <ChevronDown className="h-4 w-4" />
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Il mio account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              <span>Profilo</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              <span>Impostazioni</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={signOut}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Esci</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
