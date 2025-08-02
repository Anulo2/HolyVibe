import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { orpcClient } from "@/lib/orpc-client";

interface ProfileCompletionGuardProps {
  children: React.ReactNode;
}

export function ProfileCompletionGuard({
  children,
}: ProfileCompletionGuardProps) {
  const session = authClient.useSession();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [showProfileForm, setShowProfileForm] = useState(false);

  useEffect(() => {
    if (session.data?.user) {
      const user = session.data.user;
      const hasTemporaryEmail = user.email?.includes("@family-app.com");
      const hasTemporaryName =
        user.name?.startsWith("+") || user.name?.match(/^\d+$/);

      if (hasTemporaryEmail || hasTemporaryName) {
        setShowProfileForm(true);
        // Pre-fill with current values if they exist
        if (user.email && !hasTemporaryEmail) {
          setEmail(user.email);
        }
        if (user.name && !hasTemporaryName) {
          setName(user.name);
        }
      } else {
        setShowProfileForm(false);
      }
    }
  }, [session.data?.user]);

  const handleCompleteProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !name.trim()) {
      toast.error("Email e nome sono richiesti");
      return;
    }

    setIsLoading(true);
    try {
      const result = await orpcClient.user.updateProfile({
        email: email.trim(),
        name: name.trim(),
      });

      if (result.success) {
        toast.success("Profilo completato con successo!");
        setShowProfileForm(false);
        // Refresh the session to get updated user data
        await session.refetch();
      } else {
        toast.error("Errore durante l'aggiornamento del profilo");
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes("CONFLICT")) {
        toast.error("L'indirizzo email è già in uso.");
      } else {
        console.error("Error updating profile:", error);
        toast.error("Errore durante l'aggiornamento del profilo");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authClient.signOut();
      navigate({ to: "/login", search: { redirect: "" } });
    } catch (error) {
      console.error("Error signing out:", error);
      toast.error("Errore durante il logout");
    }
  };

  // If session is loading, show loading state
  if (session.isPending) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Loading...</h1>
          <p className="text-muted-foreground">
            Please wait while we load your session.
          </p>
        </div>
      </div>
    );
  }

  // If user is not authenticated, redirect to login
  if (!session.data?.user) {
    navigate({ to: "/login", search: { redirect: "" } });
    return null;
  }

  // If profile is incomplete, show completion form
  if (showProfileForm) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">
              Completa il tuo profilo
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Inserisci la tua email e nome reale per accedere al portale
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCompleteProfile} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="La tua email"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Nome completo *</Label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Il tuo nome completo"
                  required
                />
              </div>

              <div className="flex flex-col space-y-2 pt-4">
                <Button type="submit" disabled={isLoading} className="w-full">
                  {isLoading ? "Salvataggio..." : "Completa profilo"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleLogout}
                  className="w-full"
                >
                  Logout
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Profile is complete, render children
  return <>{children}</>;
}
