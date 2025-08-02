import { formatDistanceToNow } from "date-fns";
import { it } from "date-fns/locale";
import { Calendar, Clock, User, UserCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useRecentActivityQuery } from "@/hooks/useRecentActivityQuery";

export function AdminRecentActivityReal() {
	const { data: activities, isLoading, error } = useRecentActivityQuery(10);

	if (isLoading) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Attività Recenti</CardTitle>
					<CardDescription>Ultime operazioni nel sistema</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					{Array.from({ length: 5 }).map((_, i) => (
						<div key={i} className="flex items-start space-x-3">
							<Skeleton className="h-8 w-8 rounded-full" />
							<div className="flex-1 space-y-1">
								<Skeleton className="h-4 w-32" />
								<Skeleton className="h-3 w-48" />
								<Skeleton className="h-3 w-20" />
							</div>
						</div>
					))}
				</CardContent>
			</Card>
		);
	}

	if (error) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Attività Recenti</CardTitle>
					<CardDescription>Ultime operazioni nel sistema</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="text-center text-red-600 py-4">
						Errore nel caricamento delle attività recenti
					</div>
				</CardContent>
			</Card>
		);
	}

	const getActivityIcon = (type: string) => {
		switch (type) {
			case "registration":
				return <UserCheck className="h-4 w-4 text-green-600" />;
			case "event":
				return <Calendar className="h-4 w-4 text-blue-600" />;
			case "user":
				return <User className="h-4 w-4 text-purple-600" />;
			default:
				return <Clock className="h-4 w-4 text-gray-600" />;
		}
	};

	const getActivityBadgeColor = (type: string) => {
		switch (type) {
			case "registration":
				return "bg-green-100 text-green-800";
			case "event":
				return "bg-blue-100 text-blue-800";
			case "user":
				return "bg-purple-100 text-purple-800";
			default:
				return "bg-gray-100 text-gray-800";
		}
	};

	const formatTimeAgo = (timestamp: string) => {
		try {
			return formatDistanceToNow(new Date(timestamp), {
				addSuffix: true,
				locale: it,
			});
		} catch {
			return "Tempo sconosciuto";
		}
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle>Attività Recenti</CardTitle>
				<CardDescription>Ultime operazioni nel sistema</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				{activities && activities.length > 0 ? (
					activities.map((activity) => (
						<div
							key={activity.id}
							className="flex items-start space-x-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
						>
							<div className="flex-shrink-0 mt-1">
								{getActivityIcon(activity.type)}
							</div>
							<div className="flex-1 min-w-0">
								<div className="flex items-center space-x-2 mb-1">
									<p className="font-medium text-sm">{activity.title}</p>
									<Badge
										variant="secondary"
										className={`text-xs ${getActivityBadgeColor(activity.type)}`}
									>
										{activity.type === "registration" && "Iscrizione"}
										{activity.type === "event" && "Evento"}
										{activity.type === "user" && "Utente"}
									</Badge>
								</div>
								<p className="text-sm text-muted-foreground mb-1">
									{activity.description}
								</p>
								<p className="text-xs text-muted-foreground flex items-center">
									<Clock className="h-3 w-3 mr-1" />
									{formatTimeAgo(activity.timestamp)}
								</p>
							</div>
						</div>
					))
				) : (
					<div className="text-center py-6 text-muted-foreground">
						<Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
						<p className="text-sm">Nessuna attività recente</p>
						<p className="text-xs">
							Le attività appariranno qui quando gli utenti interagiranno con il
							sistema
						</p>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
