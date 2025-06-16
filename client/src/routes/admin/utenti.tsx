import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/utenti')({
  component: () => <div>Pagina Utenti</div>,
}) 