import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/eventi')({
  component: () => <div>Pagina Eventi</div>,
}) 