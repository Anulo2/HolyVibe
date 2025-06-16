"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Calendar, Home, Users, Mail, User, LogOut, Settings, ChevronDown, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/context/auth-context"

export function AppSidebar() {
  const pathname = usePathname()
  const { user, signOut } = useAuth()

  const routes = [
    {
      label: "Dashboard",
      icon: Home,
      href: "/",
      active: pathname === "/",
    },
    {
      label: "Famiglia",
      icon: Users,
      href: "/famiglia",
      active: pathname === "/famiglia",
    },
    {
      label: "Eventi",
      icon: Calendar,
      href: "/eventi",
      active: pathname === "/eventi",
    },
    {
      label: "Inviti",
      icon: Mail,
      href: "/inviti",
      active: pathname === "/inviti",
    },
    {
      label: "Profilo",
      icon: User,
      href: "/profilo",
      active: pathname === "/profilo",
    },
  ]

  return (
    <>
      {/* Mobile Sidebar */}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle Menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[240px] sm:w-[300px]">
          <div className="flex flex-col h-full">
            <div className="px-2 py-4">
              <h2 className="text-lg font-bold mb-4">FamilyApp</h2>
              <nav className="space-y-1">
                {routes.map((route) => (
                  <Link
                    key={route.href}
                    href={route.href}
                    className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                      route.active ? "bg-primary text-primary-foreground" : "hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <route.icon className="h-4 w-4" />
                    {route.label}
                  </Link>
                ))}
              </nav>
            </div>
            <div className="mt-auto p-4">
              {user && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`}
                        alt={user.user_metadata?.full_name || "User"}
                      />
                      <AvatarFallback>{(user.user_metadata?.full_name || "U").charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="text-sm">
                      <p className="font-medium">{user.user_metadata?.full_name || "Utente"}</p>
                      <p className="text-xs text-muted-foreground truncate max-w-[180px]">{user.email}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => signOut()}>
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar */}
      <div className="hidden border-r bg-background md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
        <div className="flex flex-col h-full">
          <div className="flex h-14 items-center border-b px-4">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-xl font-bold">FamilyApp</span>
            </Link>
          </div>
          <div className="flex-1 overflow-auto py-2">
            <nav className="grid items-start px-2 text-sm">
              {routes.map((route) => (
                <Link
                  key={route.href}
                  href={route.href}
                  className={`flex items-center gap-3 rounded-md px-3 py-2 transition-colors ${
                    route.active ? "bg-primary text-primary-foreground" : "hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <route.icon className="h-4 w-4" />
                  {route.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="mt-auto p-4 border-t">
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="w-full justify-start px-2">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage
                          src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`}
                          alt={user.user_metadata?.full_name || "User"}
                        />
                        <AvatarFallback>{(user.user_metadata?.full_name || "U").charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="text-sm text-left">
                        <p className="font-medium">{user.user_metadata?.full_name || "Utente"}</p>
                        <p className="text-xs text-muted-foreground truncate max-w-[120px]">{user.email}</p>
                      </div>
                      <ChevronDown className="ml-auto h-4 w-4" />
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Il mio account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profilo">
                      <User className="mr-2 h-4 w-4" />
                      <span>Profilo</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/profilo?tab=password">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Impostazioni</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => signOut()}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Esci</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
