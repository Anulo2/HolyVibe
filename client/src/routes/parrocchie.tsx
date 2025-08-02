import { createFileRoute, redirect } from "@tanstack/react-router";
import {
	Building2,
	Calendar,
	Clock,
	ExternalLink,
	Globe,
	Info,
	Mail,
	MapPin,
	Phone,
	Settings,
	User,
	Users,
} from "lucide-react";
import { useState } from "react";
import { OrganizationInfoCard } from "@/components/organization-info-card";
import { OrganizationQuickEvents } from "@/components/organization-quick-events";
import { OrganizationSelector } from "@/components/organization-selector";
import { OrganizationStats } from "@/components/organization-stats";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	useActiveOrganization,
	useOrganizationInfoQuery,
	useOrganizationsQuery,
} from "@/hooks/useSettings";

export const Route = createFileRoute("/parrocchie")({
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
	component: ParrocchiePage,
});

function ParrocchiePage() {
	const { auth } = Route.useRouteContext();
	const currentUser = auth.data?.user;
	const [activeTab, setActiveTab] = useState("informazioni");

	// Organization management
	const { activeOrganizationId } = useActiveOrganization();
	const organizationsQuery = useOrganizationsQuery();
	const organizationInfoQuery = useOrganizationInfoQuery(
		activeOrganizationId || undefined,
	);

	const currentOrganization = organizationInfoQuery.data;
	const isAdmin = currentOrganization?.userRole === "amministratore";

	return (
		<div className="space-y-6">
			<div className="flex items-start justify-between">
				<div>
					<h1 className="text-3xl font-bold">Le Mie Parrocchie</h1>
					<p className="text-muted-foreground">
						Visualizza e gestisci le informazioni delle tue parrocchie.
					</p>
				</div>
				{organizationsQuery.data && organizationsQuery.data.length > 1 && (
					<div className="min-w-[300px]">
						<Label className="text-sm font-medium mb-2 block">
							Parrocchia Attiva
						</Label>
						<OrganizationSelector />
					</div>
				)}
			</div>

			{organizationsQuery.isLoading ? (
				<div className="space-y-4">
					<Skeleton className="h-8 w-48" />
					<Skeleton className="h-32 w-full" />
				</div>
			) : organizationsQuery.error ? (
				<Alert>
					<Info className="h-4 w-4" />
					<AlertDescription>
						Errore nel caricamento delle organizzazioni. Riprova più tardi.
					</AlertDescription>
				</Alert>
			) : !organizationsQuery.data || organizationsQuery.data.length === 0 ? (
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Building2 className="h-5 w-5" />
							Nessuna Parrocchia
						</CardTitle>
						<CardDescription>
							Non sei membro di nessuna parrocchia al momento.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<p className="text-sm text-muted-foreground">
							Contatta un amministratore per essere aggiunto a una parrocchia.
						</p>
					</CardContent>
				</Card>
			) : (
				<Tabs
					value={activeTab}
					onValueChange={setActiveTab}
					className="space-y-6"
				>
					<TabsList>
						<TabsTrigger value="informazioni">
							<Info className="h-4 w-4 mr-2" />
							Informazioni
						</TabsTrigger>
						<TabsTrigger value="eventi">
							<Calendar className="h-4 w-4 mr-2" />
							Eventi
						</TabsTrigger>
						<TabsTrigger value="organizzazioni">
							<Building2 className="h-4 w-4 mr-2" />
							Tutte le Parrocchie
						</TabsTrigger>
						{isAdmin && (
							<TabsTrigger value="gestione">
								<Settings className="h-4 w-4 mr-2" />
								Gestione
							</TabsTrigger>
						)}
					</TabsList>

					<TabsContent value="informazioni" className="space-y-6">
						{currentOrganization ? (
							<>
								<OrganizationStats
									organizationId={activeOrganizationId || undefined}
									showUserRole={true}
									userRole={currentOrganization.userRole}
								/>
								<div className="grid gap-6 lg:grid-cols-2">
									<OrganizationInfoCard
										organization={currentOrganization}
										isLoading={organizationInfoQuery.isLoading}
										showRole={false}
									/>
									<OrganizationQuickEvents
										organizationId={activeOrganizationId || undefined}
										limit={3}
									/>
								</div>
							</>
						) : (
							<Alert>
								<Info className="h-4 w-4" />
								<AlertDescription>
									Seleziona una parrocchia per visualizzarne le informazioni.
								</AlertDescription>
							</Alert>
						)}
					</TabsContent>

					<TabsContent value="eventi" className="space-y-6">
						{currentOrganization ? (
							<div className="space-y-6">
								<div className="grid gap-6 lg:grid-cols-2">
									<OrganizationQuickEvents
										organizationId={activeOrganizationId || undefined}
										limit={10}
									/>
									<Card>
										<CardHeader>
											<CardTitle className="flex items-center gap-2">
												<Calendar className="h-5 w-5" />
												Azioni Rapide
											</CardTitle>
										</CardHeader>
										<CardContent className="space-y-3">
											<Button className="w-full" asChild>
												<a href="/eventi" className="flex items-center gap-2">
													<Calendar className="h-4 w-4" />
													Visualizza tutti gli eventi
												</a>
											</Button>
											<Button variant="outline" className="w-full" asChild>
												<a
													href="/eventi?filter=my"
													className="flex items-center gap-2"
												>
													<User className="h-4 w-4" />
													Le mie iscrizioni
												</a>
											</Button>
											{isAdmin && (
												<Button variant="outline" className="w-full" asChild>
													<a
														href="/admin/eventi"
														className="flex items-center gap-2"
													>
														<Settings className="h-4 w-4" />
														Gestisci eventi
													</a>
												</Button>
											)}
										</CardContent>
									</Card>
								</div>
							</div>
						) : (
							<Alert>
								<Info className="h-4 w-4" />
								<AlertDescription>
									Seleziona una parrocchia per visualizzare i suoi eventi.
								</AlertDescription>
							</Alert>
						)}
					</TabsContent>

					<TabsContent value="organizzazioni" className="space-y-6">
						<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
							{organizationsQuery.data?.map((org) => (
								<Card
									key={org.id}
									className="cursor-pointer hover:shadow-md transition-shadow"
								>
									<CardHeader className="pb-3">
										<div className="flex flex-col space-y-3">
											<div className="flex items-center space-x-3">
												{org.image ? (
													<img
														src={org.image}
														alt={org.name}
														className="h-10 w-10 rounded-full object-cover flex-shrink-0"
													/>
												) : (
													<div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
														<Building2 className="h-5 w-5 text-muted-foreground" />
													</div>
												)}
												<div className="flex-1 min-w-0">
													<CardTitle className="text-base leading-tight break-words hyphens-auto overflow-wrap-break-word">
														{org.name}
													</CardTitle>
												</div>
											</div>
											<div className="flex justify-start">
												<Badge variant="outline" className="text-xs">
													{org.role}
												</Badge>
											</div>
										</div>
									</CardHeader>
									<CardContent className="pt-0">
										<div className="space-y-3">
											<div className="text-xs text-muted-foreground">
												<div className="flex items-center">
													<User className="h-3 w-3 mr-1 flex-shrink-0" />
													<span>Il tuo ruolo: {org.role}</span>
												</div>
											</div>
											{activeOrganizationId === org.id && (
												<Badge variant="default" className="text-xs w-fit">
													Attualmente selezionata
												</Badge>
											)}
										</div>
									</CardContent>
								</Card>
							))}
						</div>
					</TabsContent>

					{isAdmin && (
						<TabsContent value="gestione" className="space-y-6">
							<Card>
								<CardHeader>
									<CardTitle className="flex items-center gap-2">
										<Settings className="h-5 w-5" />
										Pannello Amministratore
									</CardTitle>
									<CardDescription>
										Strumenti di gestione per amministratori della parrocchia.
									</CardDescription>
								</CardHeader>
								<CardContent className="space-y-4">
									<div className="grid gap-4 md:grid-cols-2">
										<Button variant="outline" className="h-auto p-4" asChild>
											<a href="/admin/impostazioni">
												<div className="text-left">
													<div className="font-medium">
														Impostazioni Sistema
													</div>
													<div className="text-sm text-muted-foreground">
														Configura impostazioni della parrocchia
													</div>
												</div>
											</a>
										</Button>
										<Button variant="outline" className="h-auto p-4" asChild>
											<a href="/admin/eventi">
												<div className="text-left">
													<div className="font-medium">Gestione Eventi</div>
													<div className="text-sm text-muted-foreground">
														Crea e gestisci eventi parrocchiali
													</div>
												</div>
											</a>
										</Button>
										<Button variant="outline" className="h-auto p-4" asChild>
											<a href="/admin/iscrizioni">
												<div className="text-left">
													<div className="font-medium">Iscrizioni</div>
													<div className="text-sm text-muted-foreground">
														Gestisci iscrizioni agli eventi
													</div>
												</div>
											</a>
										</Button>
										<Button variant="outline" className="h-auto p-4" asChild>
											<a href="/admin/famiglie">
												<div className="text-left">
													<div className="font-medium">Famiglie</div>
													<div className="text-sm text-muted-foreground">
														Gestione famiglie e membri
													</div>
												</div>
											</a>
										</Button>
									</div>
								</CardContent>
							</Card>
						</TabsContent>
					)}
				</Tabs>
			)}
		</div>
	);
}
