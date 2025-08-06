import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { orpcClient } from "../../lib/orpc-client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import {
  Users,
  Building2,
  Calendar,
  Shield,
  TrendingUp,
  Settings,
} from "lucide-react";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/supreme-admin/")({
  component: SupremeAdminDashboard,
});

function SupremeAdminDashboard() {
  const {
    data: stats,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["supreme-admin", "statistics"],
    queryFn: () => orpcClient.supremeAdmin.getSystemStatistics(),
  });

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-6">
        <Card className="border-red-200">
          <CardContent className="pt-6">
            <div className="text-center text-red-600">
              <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">
                Errore nel caricamento
              </h3>
              <p className="text-sm">
                Non è stato possibile caricare le statistiche del sistema.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-2">
        <div className="flex items-center space-x-2">
          <Shield className="h-8 w-8 text-purple-600" />
          <h1 className="text-3xl font-bold tracking-tight">
            Dashboard Supreme Admin
          </h1>
          <Badge variant="secondary" className="bg-purple-100 text-purple-800">
            Privilegi Massimi
          </Badge>
        </div>
        <p className="text-muted-foreground">
          Gestisci tutti gli utenti, le parrocchie e monitora l'attività del
          sistema
        </p>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <Button asChild>
          <Link to="/supreme-admin/users">
            <Users className="h-4 w-4 mr-2" />
            Gestisci Utenti
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/supreme-admin/organizations">
            <Building2 className="h-4 w-4 mr-2" />
            Gestisci Parrocchie
          </Link>
        </Button>
      </div>

      {/* Statistics Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* User Statistics */}
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-900">
              Utenti Totali
            </CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">
              {stats?.users.total || 0}
            </div>
            <div className="text-xs text-blue-700 mt-1">
              <span className="text-green-600">
                +{stats?.users.recentlyJoined || 0}
              </span>{" "}
              negli ultimi 30 giorni
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-purple-50/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-900">
              Supreme Admin
            </CardTitle>
            <Shield className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900">
              {stats?.users.admins || 0}
            </div>
            <div className="text-xs text-purple-700 mt-1">
              {stats?.users.regular || 0} utenti normali
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-900">
              Parrocchie
            </CardTitle>
            <Building2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">
              {stats?.organizations.total || 0}
            </div>
            <div className="text-xs text-green-700 mt-1">
              Organizzazioni attive
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-900">
              Eventi Totali
            </CardTitle>
            <Calendar className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-900">
              {stats?.events.total || 0}
            </div>
            <div className="text-xs text-orange-700 mt-1">
              {stats?.events.active || 0} attivi, {stats?.events.cancelled || 0}{" "}
              cancellati
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-blue-600" />
              Attività Recente
            </CardTitle>
            <CardDescription>
              Panoramica dell'attività degli ultimi 30 giorni
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Users className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium">Nuovi Utenti</p>
                  <p className="text-sm text-muted-foreground">
                    Registrazioni recenti
                  </p>
                </div>
              </div>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                +{stats?.users.recentlyJoined || 0}
              </Badge>
            </div>

            <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Calendar className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="font-medium">Nuovi Eventi</p>
                  <p className="text-sm text-muted-foreground">
                    Eventi creati di recente
                  </p>
                </div>
              </div>
              <Badge
                variant="secondary"
                className="bg-orange-100 text-orange-800"
              >
                +{stats?.events.recentlyCreated || 0}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="h-5 w-5 mr-2 text-green-600" />
              Azioni Rapide
            </CardTitle>
            <CardDescription>Gestisci il sistema rapidamente</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button asChild variant="outline" className="w-full justify-start">
              <Link to="/supreme-admin/users">
                <Users className="h-4 w-4 mr-2" />
                Gestisci Supreme Admin
              </Link>
            </Button>

            <Button asChild variant="outline" className="w-full justify-start">
              <Link to="/supreme-admin/organizations">
                <Building2 className="h-4 w-4 mr-2" />
                Gestisci Parrocchie
              </Link>
            </Button>

            <Button asChild variant="outline" className="w-full justify-start">
              <Link to="/supreme-admin/users" search={{ role: "admin" }}>
                <Shield className="h-4 w-4 mr-2" />
                Visualizza Tutti gli Admin
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* System Health Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Stato del Sistema</CardTitle>
          <CardDescription>
            Panoramica generale della salute del sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
              <div className="h-3 w-3 bg-green-500 rounded-full"></div>
              <div>
                <p className="font-medium text-green-900">Sistema Operativo</p>
                <p className="text-sm text-green-700">
                  Tutti i servizi funzionano correttamente
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
              <div className="h-3 w-3 bg-blue-500 rounded-full"></div>
              <div>
                <p className="font-medium text-blue-900">Database</p>
                <p className="text-sm text-blue-700">Connessione stabile</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
              <div className="h-3 w-3 bg-purple-500 rounded-full"></div>
              <div>
                <p className="font-medium text-purple-900">Autenticazione</p>
                <p className="text-sm text-purple-700">Better-Auth attivo</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
