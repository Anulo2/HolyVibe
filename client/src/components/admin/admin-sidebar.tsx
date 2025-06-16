"use client"

import { Link } from "@tanstack/react-router"
import { LayoutDashboard, CalendarDays, Users, UserCheck, Settings, LogOut, BarChart3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { RoleGuard } from "@/components/admin/role-guard"

export function AdminSidebar() {
  const menuItems = [
    {
      title: "Dashboard",
      icon: LayoutDashboard,
      href: "/admin",
      roles: ["animatore", "editor", "amministratore"],
    },
    {
      title: "Eventi",
      icon: CalendarDays,
      href: "/admin/eventi",
      roles: ["animatore", "editor", "amministratore"],
    },
    {
      title: "Iscrizioni",
      icon: UserCheck,
      href: "/admin/iscrizioni",
      roles: ["animatore", "editor", "amministratore"],
    },
    {
      title: "Utenti",
      icon: Users,
      href: "/admin/utenti",
      roles: ["amministratore"],
    },
    {
      title: "Reportistica",
      icon: BarChart3,
      href: "/admin/reportistica",
      roles: ["amministratore"],
    },
    {
      title: "Impostazioni",
      icon: Settings,
      href: "/admin/impostazioni",
      roles: ["amministratore"],
    },
  ]

  return (
    <div className="w-64 border-r bg-card h-screen flex flex-col">
      <div className="p-6">
        <Link to="/admin" className="flex items-center gap-2 font-bold text-xl">
          <span className="bg-primary text-primary-foreground p-1 rounded">FA</span>
          <span>Admin Panel</span>
        </Link>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {menuItems.map((item) => (
          <RoleGuard key={item.href} allowedRoles={item.roles} fallback={null}>
            <Link
              to={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors`}
              activeProps={{
                className: "bg-primary/10 text-primary font-medium"
              }}
              inactiveProps={{
                className: "text-muted-foreground hover:bg-muted"
              }}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.title}</span>
            </Link>
          </RoleGuard>
        ))}
      </nav>

      <div className="p-4 border-t">
        <Button variant="outline" className="w-full justify-start gap-3">
          <LogOut className="h-4 w-4" />
          <span>Esci</span>
        </Button>
      </div>
    </div>
  )
}
