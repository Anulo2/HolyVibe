import { createFileRoute, redirect } from "@tanstack/react-router";
import { RoleGuard } from "@/components/admin/role-guard";

export const Route = createFileRoute("/admin/impostazioni")({
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
	component: ImpostazioniPage,
});

function ImpostazioniPage() {
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
					<h1 className="text-3xl font-bold">Impostazioni Sistema</h1>
					<p className="text-muted-foreground">
						Configura le impostazioni della parrocchia e del sistema.
					</p>
				</div>

				<div className="rounded-lg border bg-card p-6">
					<h2 className="text-xl font-semibold mb-4">Configurazioni</h2>
					<div className="grid gap-4 md:grid-cols-2">
						<div className="p-4 border rounded-md">
							<h3 className="font-medium mb-2">Dati Parrocchia</h3>
							<p className="text-sm text-muted-foreground">
								Nome, indirizzo, contatti parrocchia
							</p>
						</div>
						<div className="p-4 border rounded-md">
							<h3 className="font-medium mb-2">Configurazione Eventi</h3>
							<p className="text-sm text-muted-foreground">
								Impostazioni default per eventi
							</p>
						</div>
						<div className="p-4 border rounded-md">
							<h3 className="font-medium mb-2">Notifiche</h3>
							<p className="text-sm text-muted-foreground">
								Configura template email e SMS
							</p>
						</div>
						<div className="p-4 border rounded-md">
							<h3 className="font-medium mb-2">Backup</h3>
							<p className="text-sm text-muted-foreground">
								Gestione backup e ripristino dati
							</p>
						</div>
					</div>
					<p className="mt-4 text-sm text-muted-foreground">
						Le impostazioni complete saranno implementate nelle prossime
						versioni.
					</p>
				</div>
			</div>
		</RoleGuard>
	);
}
