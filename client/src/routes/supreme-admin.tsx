import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/supreme-admin")({
  beforeLoad: ({ context }) => {
    // Check if user is authenticated
    if (!context.auth.data?.user) {
      throw redirect({
        to: "/login",
        search: {
          redirect: location.href,
        },
      });
    }

    // Check if user has Supreme Admin role
    if (context.auth.data.user.role !== "admin") {
      throw redirect({
        to: "/dashboard",
      });
    }
  },
  component: SupremeAdminLayout,
});

function SupremeAdminLayout() {
  return <Outlet />;
}
