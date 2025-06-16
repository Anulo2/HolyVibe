import { createFileRoute, Outlet } from '@tanstack/react-router'
import { AdminSidebar } from '@/components/admin/admin-sidebar'

export const Route = createFileRoute('/admin')({
  component: AdminLayout,
})

function AdminLayout() {
  return (
    <div className="flex">
      <AdminSidebar />
      <div className="flex-1 p-6">
        <Outlet />
      </div>
    </div>
  )
} 