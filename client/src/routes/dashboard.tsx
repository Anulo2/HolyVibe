import { createFileRoute, redirect } from '@tanstack/react-router'
import DashboardPage from '@/pages/Dashboard'
import { useAuth } from '@/hooks/useAuth'

export const Route = createFileRoute('/dashboard')({
  beforeLoad: ({ context }) => {
    if (!context.auth.session) {
      throw redirect({
        to: '/login',
        search: {
          redirect: location.href,
        },
      })
    }
  },
  component: DashboardComponent,
})

function DashboardComponent() {
  const { session, signOut } = useAuth()
  return <DashboardPage session={session!} onSignOut={signOut} />
} 