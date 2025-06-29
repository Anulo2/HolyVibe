import { createFileRoute, redirect } from "@tanstack/react-router";
import { RoleGuard } from "@/components/admin/role-guard";

export const Route = createFileRoute("/admin/reportistica")({
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
	component: ReportisticaPage,
});

function ReportisticaPage() {
	return (
		<RoleGuard
			allowedRoles={["amministratore"]}
			fallback={
				<div className="p-6">
					<div className="text-center">
						<h1 className="text-2xl font-bold text-red-600 mb-4">
							Accesso Negato
						</h1>
						<p className="text-muted-foreground">
							Non hai i permessi per accedere a questa pagina.
						</p>
					</div>
				</div>
			}
		>
			<div className="space-y-6">
				<div>
					<h1 className="text-3xl font-bold">Reportistica</h1>
					<p className="text-muted-foreground">
						Analisi e statistiche della parrocchia.
					</p>
				</div>

				<div className="rounded-lg border bg-card p-6">
					<h2 className="text-xl font-semibold mb-4">Report Disponibili</h2>
					<div className="grid gap-4 md:grid-cols-2">
						<div className="p-4 border rounded-md">
							<h3 className="font-medium mb-2">Statistiche Eventi</h3>
							<p className="text-sm text-muted-foreground">
								Report su partecipazione e performance eventi
							</p>
						</div>
						<div className="p-4 border rounded-md">
							<h3 className="font-medium mb-2">Analisi Utenti</h3>
							<p className="text-sm text-muted-foreground">
								Statistiche di crescita e engagement utenti
							</p>
						</div>
						<div className="p-4 border rounded-md">
							<h3 className="font-medium mb-2">Report Finanziari</h3>
							<p className="text-sm text-muted-foreground">
								Entrate da eventi e donazioni
							</p>
						</div>
						<div className="p-4 border rounded-md">
							<h3 className="font-medium mb-2">Export Completi</h3>
							<p className="text-sm text-muted-foreground">
								Export dati per analisi esterne
							</p>
						</div>
					</div>
					<p className="mt-4 text-sm text-muted-foreground">
						I report dettagliati saranno implementati nelle prossime versioni.
					</p>
				</div>
			</div>
		</RoleGuard>
	);
}
