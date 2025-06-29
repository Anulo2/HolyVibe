import { createFileRoute, redirect } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";

export const Route = createFileRoute("/parrocchie")({
    beforeLoad: ({ context }) => {
        if (!context.auth.data?.user) {
            throw redirect({
                to: "/login",
                search: {
                    redirect: location.href,
                },
            });
        }
    },
    component: ParrocchiePage,
});

function ParrocchiePage() {
    const { auth } = Route.useRouteContext();
    const currentUser = auth.data?.user;

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">Parrocchie</h1>
            <div className="rounded-lg border bg-card p-6">
                <p>Gestione delle parrocchie/organizzazioni.</p>
                <p className="text-muted-foreground">Questa sezione è in costruzione.</p>
            </div>
        </div>
    );
} 