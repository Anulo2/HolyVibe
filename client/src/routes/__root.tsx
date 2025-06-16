import { createRootRouteWithContext, Outlet, redirect } from "@tanstack/react-router"
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { useAuth } from "@/hooks/useAuth"
import { AppSidebar } from "@/components/app-sidebar"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { useEffect } from "react"
import LoginPage from "@/pages/LoginPage"

interface MyRouterContext {
  auth: ReturnType<typeof useAuth>
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  component: RootComponent,
})

function RootComponent() {
  const { session, loading, checkSession } = useAuth()

  useEffect(() => {
    checkSession()
  }, [])

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        {session?.user ? <AuthenticatedLayout /> : <UnauthenticatedLayout />}
      <Toaster />
      <TanStackRouterDevtools />
    </ThemeProvider>
  )
}

function AuthenticatedLayout() {
  return (
    <div className="flex min-h-screen">
      <Outlet />
    </div>
  )
}

function UnauthenticatedLayout() {
  const { pathname } = window.location
  if (pathname !== '/login') {
    // This is a client-side redirect, TanStack Router's redirect() is for loaders.
    window.location.href = '/login'
    return null
  }
  return <Outlet />
} 