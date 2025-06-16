"use client"

import type React from "react"

import { useEffect, useState } from "react"

interface RoleGuardProps {
  children: React.ReactNode
  allowedRoles: string[]
  fallback?: React.ReactNode
}

export function RoleGuard({ children, allowedRoles, fallback = null }: RoleGuardProps) {
  // In un'applicazione reale, otterresti il ruolo dell'utente da un contesto di autenticazione
  // o da una chiamata API. Per questo esempio, simuliamo un ruolo "amministratore"
  const [userRole, setUserRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulazione del caricamento del ruolo utente
    const fetchUserRole = async () => {
      // In un'app reale, qui faresti una chiamata API o leggeresti da un context
      await new Promise((resolve) => setTimeout(resolve, 100))
      setUserRole("amministratore") // Simuliamo un utente amministratore
      setLoading(false)
    }

    fetchUserRole()
  }, [])

  if (loading) {
    return null // O un componente di loading
  }

  if (!userRole || !allowedRoles.includes(userRole)) {
    return fallback
  }

  return <>{children}</>
}
