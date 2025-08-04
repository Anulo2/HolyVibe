import {
  Activity,
  Calendar,
  Clock,
  TrendingUp,
  UserCheck,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useOrganizationStatsQuery } from "@/hooks/useSettings";

interface OrganizationStatsProps {
  organizationId?: string;
  showUserRole?: boolean;
  userRole?: string;
}

interface OrganizationStats {
  totalMembers: number;
  totalEvents: number;
  upcomingEvents: number;
  myRegistrations: number;
  recentActivity: number;
  memberSince: string;
}

export function OrganizationStats({
  organizationId,
  showUserRole = true,
  userRole,
}: OrganizationStatsProps) {
  const {
    data: stats,
    isLoading,
    error,
  } = useOrganizationStatsQuery(organizationId);

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-1" />
              <Skeleton className="h-4 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error || !stats) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            Errore nel caricamento delle statistiche
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatMemberSince = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("it-IT", {
      year: "numeric",
      month: "long",
    }).format(date);
  };

  const statsCards = [
    {
      title: "Membri Totali",
      value: stats.totalUsers,
      description: "nella parrocchia",
      icon: Users,
      color: "text-blue-600",
    },
    {
      title: "Eventi Totali",
      value: stats.totalEvents,
      description: "quest'anno",
      icon: Calendar,
      color: "text-green-600",
    },
    {
      title: "Prossimi Eventi",
      value: stats.activeEvents,
      description: "in programma",
      icon: Clock,
      color: "text-orange-600",
    },
    {
      title: "Mie Iscrizioni",
      value: stats.totalRegistrations,
      description: "eventi attivi",
      icon: UserCheck,
      color: "text-purple-600",
    },
  ];

  return (
    <div className="space-y-6">
      {showUserRole && userRole && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Activity className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Il tuo ruolo</p>
                  <p className="text-xs text-muted-foreground">
                    Registrazioni questo mese: {stats.thisMonthRegistrations}
                  </p>
                </div>
              </div>
              <Badge variant="outline">{userRole}</Badge>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {stats.thisMonthRegistrations > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4" />
              Attività Recente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary">+{stats.thisMonthRegistrations}</Badge>
              <span className="text-sm text-muted-foreground">
                nuove attività negli ultimi 7 giorni
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
