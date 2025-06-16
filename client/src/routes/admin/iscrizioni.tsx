import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/iscrizioni')({
  component: () => <div>Pagina Iscrizioni</div>,
}) 