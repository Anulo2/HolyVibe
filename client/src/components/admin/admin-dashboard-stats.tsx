import { BarChart3, Calendar, UserCheck, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboardStatsQuery } from "@/hooks/useDashboardStatsQuery";

export function AdminDashboardStats() {
	const { data, isLoading, error } = useDashboardStatsQuery();

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
							<Skeleton className="h-3 w-20" />
						</CardContent>
					</Card>
				))}
			</div>
		);
	}

	if (error) {
		return (
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
				<Card>
					<CardContent className="p-6">
						<div className="text-center text-red-600">
							Errore nel caricamento delle statistiche
						</div>
					</CardContent>
				</Card>
			</div>
		);
	}

	// Calculate growth metrics (these would ideally come from the API with historical data)
	const activeRegistrations =
		(data?.totalRegistrations || 0) - (data?.pendingRegistrations || 0);

	return (
		<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
			<Card>
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="text-sm font-medium">Utenti Totali</CardTitle>
					<Users className="h-4 w-4 text-muted-foreground" />
				</CardHeader>
				<CardContent>
					<div className="text-2xl font-bold">{data?.totalUsers || 0}</div>
					<p className="text-xs text-muted-foreground">
						{data?.totalUsers ? `${data.totalUsers} registrati` : "Nessun dato"}
					</p>
				</CardContent>
			</Card>

			<Card>
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="text-sm font-medium">Eventi Attivi</CardTitle>
					<Calendar className="h-4 w-4 text-muted-foreground" />
				</CardHeader>
				<CardContent>
					<div className="text-2xl font-bold">{data?.openEvents || 0}</div>
					<p className="text-xs text-muted-foreground">
						{data?.totalEvents ? `${data.totalEvents} totali` : "Nessun evento"}
					</p>
				</CardContent>
			</Card>

			<Card>
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="text-sm font-medium">
						Iscrizioni Attive
					</CardTitle>
					<UserCheck className="h-4 w-4 text-muted-foreground" />
				</CardHeader>
				<CardContent>
					<div className="text-2xl font-bold">{activeRegistrations}</div>
					<p className="text-xs text-muted-foreground">
						{data?.pendingRegistrations
							? `${data.pendingRegistrations} in attesa`
							: "Nessuna in attesa"}
					</p>
				</CardContent>
			</Card>

			<Card>
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="text-sm font-medium">Famiglie</CardTitle>
					<BarChart3 className="h-4 w-4 text-muted-foreground" />
				</CardHeader>
				<CardContent>
					<div className="text-2xl font-bold">{data?.totalFamilies || 0}</div>
					<p className="text-xs text-muted-foreground">
						{data?.totalFamilies
							? `${data.totalFamilies} registrate`
							: "Nessuna famiglia"}
					</p>
				</CardContent>
			</Card>
		</div>
	);
}
