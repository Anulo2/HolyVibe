import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/impostazioni')({
  component: () => <div>Pagina Impostazioni</div>,
}) 