import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { Calendar, UserCheck, Users } from "lucide-react";
import { AdminCreaEventoDialog } from "@/components/admin/admin-crea-evento-dialog";
import { AdminDashboardStats } from "@/components/admin/admin-dashboard-stats";
import { AdminRecentActivityReal } from "@/components/admin/admin-recent-activity-real";
import { RoleGuard } from "@/components/admin/role-guard";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

export const Route = createFileRoute("/admin/")({
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
	component: AdminDashboard,
});

function AdminDashboard() {
	return (
		<RoleGuard
			allowedRoles={["amministratore", "editor", "animatore"]}
			fallback={
				<div className="p-6">
					<div className="text-center">
						<h1 className="text-2xl font-bold text-red-600 mb-4">
							Accesso Negato
						</h1>
						<p className="text-muted-foreground">
							Non hai i permessi per accedere alla sezione amministratore.
						</p>
					</div>
				</div>
			}
		>
			<div className="space-y-6">
				<div>
					<h1 className="text-3xl font-bold">Dashboard Amministratore</h1>
					<p className="text-muted-foreground">
						Panoramica generale del sistema di gestione parrocchia.
					</p>
				</div>

				{/* Stats Cards */}
				<AdminDashboardStats />

				{/* Quick Actions */}
				<div className="grid gap-6 md:grid-cols-2">
					<Card>
						<CardHeader>
							<CardTitle>Azioni Rapide</CardTitle>
							<CardDescription>
								Operazioni amministrative frequenti
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-2">
							<AdminCreaEventoDialog>
								<Button
									variant="outline"
									className="w-full justify-start h-auto p-3"
								>
									<Calendar className="h-4 w-4 mr-2" />
									<span className="text-sm">Crea nuovo evento</span>
								</Button>
							</AdminCreaEventoDialog>
							<Link to="/admin/utenti" className="block">
								<Button
									variant="outline"
									className="w-full justify-start h-auto p-3"
								>
									<Users className="h-4 w-4 mr-2" />
									<span className="text-sm">Gestisci utenti</span>
								</Button>
							</Link>
							<Link
								to="/admin/iscrizioni"
								search={{ eventId: undefined }}
								className="block"
							>
								<Button
									variant="outline"
									className="w-full justify-start h-auto p-3"
								>
									<UserCheck className="h-4 w-4 mr-2" />
									<span className="text-sm">Visualizza iscrizioni</span>
								</Button>
							</Link>
						</CardContent>
					</Card>

					<AdminRecentActivityReal />
				</div>

				<Card>
					<CardHeader>
						<CardTitle>Sistema</CardTitle>
						<CardDescription>
							Stato del sistema e informazioni tecniche
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="grid gap-4 md:grid-cols-3">
							<div className="text-center p-4 border rounded-md">
								<div className="text-lg font-semibold text-green-600">
									Online
								</div>
								<p className="text-sm text-muted-foreground">Stato Sistema</p>
							</div>
							<div className="text-center p-4 border rounded-md">
								<div className="text-lg font-semibold">v1.0.0</div>
								<p className="text-sm text-muted-foreground">Versione</p>
							</div>
							<div className="text-center p-4 border rounded-md">
								<div className="text-lg font-semibold">99.9%</div>
								<p className="text-sm text-muted-foreground">Uptime</p>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>
		</RoleGuard>
	);
}
