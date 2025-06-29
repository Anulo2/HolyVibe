import { createFileRoute, redirect } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { useUserProfileMutation } from "@/hooks/useUserQuery";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { type User } from "@/lib/auth-client";

export const Route = createFileRoute("/profilo")({
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
    component: ProfiloPage,
});

function ProfileForm({ user: initialUser }: { user: User }) {
    const [user, setUser] = useState(initialUser);
    const userProfileMutation = useUserProfileMutation();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setUser((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await userProfileMutation.mutateAsync(user);
            toast.success("Profilo aggiornato con successo");
        } catch (error) {
            toast.error("Errore durante l'aggiornamento del profilo");
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
            <div>
                <Label htmlFor="name">Nome</Label>
                <Input
                    id="name"
                    name="name"
                    value={user.name || ""}
                    onChange={handleChange}
                />
            </div>
            <div>
                <Label htmlFor="email">Email</Label>
                <Input
                    id="email"
                    name="email"
                    type="email"
                    value={user.email || ""}
                    onChange={handleChange}
                />
            </div>
             <div>
                <Label htmlFor="phoneNumber">Numero di telefono</Label>
                <Input
                    id="phoneNumber"
                    name="phoneNumber"
                    type="tel"
                    value={user.phoneNumber || ""}
                    onChange={handleChange}
                    disabled
                />
            </div>
            <Button type="submit" disabled={userProfileMutation.isPending}>
                {userProfileMutation.isPending ? "Salvataggio..." : "Salva Modifiche"}
            </Button>
        </form>
    );
}

function ProfiloPage() {
    const { auth } = Route.useRouteContext();
    const currentUser = auth.data!.user!;

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">Il Tuo Profilo</h1>
            <div className="rounded-lg border bg-card p-6">
                <ProfileForm user={currentUser} />
            </div>
        </div>
    );
} 