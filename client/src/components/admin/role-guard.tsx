"use client"

import type React from "react"
import { useAuth } from "@/hooks/useAuth"

interface RoleGuardProps {
  children: React.ReactNode
  allowedRoles: string[]
  fallback?: React.ReactNode
}

export function RoleGuard({ children, allowedRoles, fallback = null }: RoleGuardProps) {
  const { session, loading } = useAuth()
  const userRole = session?.user?.role

  if (loading) {
    return null // Or a loading spinner
  }

  if (!userRole || !allowedRoles.includes(userRole)) {
    return <>{fallback}</>
  }

  return <>{children}</>
}
