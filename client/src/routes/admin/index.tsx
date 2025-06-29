import { createFileRoute, redirect } from "@tanstack/react-router";
import { BarChart3, Calendar, UserCheck, Users } from "lucide-react";
import { RoleGuard } from "@/components/admin/role-guard";
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
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium">
								Utenti Totali
							</CardTitle>
							<Users className="h-4 w-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">142</div>
							<p className="text-xs text-muted-foreground">+5 questo mese</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium">
								Eventi Attivi
							</CardTitle>
							<Calendar className="h-4 w-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">12</div>
							<p className="text-xs text-muted-foreground">3 in corso</p>
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
							<div className="text-2xl font-bold">89</div>
							<p className="text-xs text-muted-foreground">
								+12 questa settimana
							</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium">Famiglie</CardTitle>
							<BarChart3 className="h-4 w-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">67</div>
							<p className="text-xs text-muted-foreground">+2 questo mese</p>
						</CardContent>
					</Card>
				</div>

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
							<div className="flex items-center p-2 border rounded-md hover:bg-accent cursor-pointer">
								<Calendar className="h-4 w-4 mr-2" />
								<span className="text-sm">Crea nuovo evento</span>
							</div>
							<div className="flex items-center p-2 border rounded-md hover:bg-accent cursor-pointer">
								<Users className="h-4 w-4 mr-2" />
								<span className="text-sm">Gestisci utenti</span>
							</div>
							<div className="flex items-center p-2 border rounded-md hover:bg-accent cursor-pointer">
								<UserCheck className="h-4 w-4 mr-2" />
								<span className="text-sm">Visualizza iscrizioni</span>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>Attività Recenti</CardTitle>
							<CardDescription>Ultime operazioni nel sistema</CardDescription>
						</CardHeader>
						<CardContent className="space-y-2">
							<div className="text-sm">
								<p className="font-medium">Nuova iscrizione</p>
								<p className="text-muted-foreground">
									Marco Rossi si è iscritto a "Campo Estivo"
								</p>
								<p className="text-xs text-muted-foreground">2 ore fa</p>
							</div>
							<div className="text-sm">
								<p className="font-medium">Evento creato</p>
								<p className="text-muted-foreground">
									Nuovo evento "Laboratorio Arte" pubblicato
								</p>
								<p className="text-xs text-muted-foreground">1 giorno fa</p>
							</div>
							<div className="text-sm">
								<p className="font-medium">Nuovo utente</p>
								<p className="text-muted-foreground">
									Laura Bianchi si è registrata
								</p>
								<p className="text-xs text-muted-foreground">2 giorni fa</p>
							</div>
						</CardContent>
					</Card>
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
