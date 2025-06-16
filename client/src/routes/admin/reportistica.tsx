import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/reportistica')({
  component: () => <div>Pagina Reportistica</div>,
}) 