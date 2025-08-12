import { createFileRoute, redirect } from "@tanstack/react-router";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import {
	AlertCircle,
	AlertTriangle,
	Bell,
	Building,
	Calendar,
	CheckCircle,
	Database,
	Download,
	Info,
	RefreshCw,
	Save,
	Upload,
} from "lucide-react";
import * as React from "react";
import { useState } from "react";
import { RoleGuard } from "@/components/admin/role-guard";
import { OrganizationSelector } from "@/components/organization-selector";
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
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
	type EventSettings,
	type NotificationSettings,
	type ParishSettings,
	useActiveOrganization,
	useBackupsQuery,
	useCreateBackupMutation,
	useEventSettingsQuery,
	useNotificationSettingsQuery,
	useParishSettingsQuery,
	useRestoreBackupMutation,
	useSystemInfoQuery,
	useUpdateEventSettingsMutation,
	useUpdateNotificationSettingsMutation,
	useUpdateParishSettingsMutation,
} from "@/hooks/useSettings";

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
	const [activeTab, setActiveTab] = useState("parrocchia");
	const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
	const [selectedBackup, setSelectedBackup] = useState<string>("");

	// Active organization
	const { activeOrganizationId } = useActiveOrganization();

	// Parish Settings
	const parishSettingsQuery = useParishSettingsQuery(
		activeOrganizationId || undefined,
	);
	const updateParishSettingsMutation = useUpdateParishSettingsMutation(
		activeOrganizationId || undefined,
	);
	const [parishForm, setParishForm] = useState<ParishSettings>({
		name: "",
		address: "",
		phone: "",
		email: "",
		website: "",
		logo: "",
		description: "",
		photoVideoMinorsDeclaration: "",
	});

	// Event Settings
	const eventSettingsQuery = useEventSettingsQuery();
	const updateEventSettingsMutation = useUpdateEventSettingsMutation();
	const [eventForm, setEventForm] = useState<EventSettings>({
		defaultMaxParticipants: 100,
		defaultRegistrationDeadlineHours: 24,
		requirePhotoVideoConsent: true,
		autoConfirmRegistrations: false,
		allowWaitingList: true,
		maxWaitingListSize: 50,
		sendConfirmationEmails: true,
		sendReminderEmails: true,
		reminderHoursBefore: 24,
	});

	// Notification Settings
	const notificationSettingsQuery = useNotificationSettingsQuery();
	const updateNotificationSettingsMutation =
		useUpdateNotificationSettingsMutation();
	const [notificationForm, setNotificationForm] =
		useState<NotificationSettings>({
			emailNotifications: true,
			smsNotifications: false,
			pushNotifications: true,
			eventReminders: true,
			registrationUpdates: true,
			systemAlerts: true,
			weeklyDigest: false,
			monthlyReport: false,
		});

	// System Info and Backups
	const systemInfoQuery = useSystemInfoQuery();
	const backupsQuery = useBackupsQuery();
	const createBackupMutation = useCreateBackupMutation();
	const restoreBackupMutation = useRestoreBackupMutation();

	// Update forms when data loads
	React.useEffect(() => {
		if (parishSettingsQuery.data) {
			setParishForm(parishSettingsQuery.data);
		}
	}, [parishSettingsQuery.data]);

	React.useEffect(() => {
		if (eventSettingsQuery.data) {
			setEventForm(eventSettingsQuery.data);
		}
	}, [eventSettingsQuery.data]);

	React.useEffect(() => {
		if (notificationSettingsQuery.data) {
			setNotificationForm(notificationSettingsQuery.data);
		}
	}, [notificationSettingsQuery.data]);

	const handleParishSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		updateParishSettingsMutation.mutate(parishForm);
	};

	const handleEventSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		updateEventSettingsMutation.mutate(eventForm);
	};

	const handleNotificationSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		updateNotificationSettingsMutation.mutate(notificationForm);
	};

	const handleCreateBackup = () => {
		createBackupMutation.mutate();
	};

	const handleRestoreBackup = () => {
		if (selectedBackup) {
			restoreBackupMutation.mutate(selectedBackup);
			setRestoreDialogOpen(false);
			setSelectedBackup("");
		}
	};

	const formatFileSize = (bytes: number) => {
		if (bytes === 0) return "0 Bytes";
		const k = 1024;
		const sizes = ["Bytes", "KB", "MB", "GB"];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return `${parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
	};

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
				<div className="flex items-start justify-between">
					<div>
						<h1 className="text-3xl font-bold">Impostazioni Sistema</h1>
						<p className="text-muted-foreground">
							Configura le impostazioni della parrocchia e del sistema.
						</p>
					</div>
					<div className="min-w-[300px]">
						<Label className="text-sm font-medium mb-2 block">
							Organizzazione Attiva
						</Label>
						<OrganizationSelector />
					</div>
				</div>

				<Tabs value={activeTab} onValueChange={setActiveTab}>
					<TabsList className="grid w-full grid-cols-5">
						<TabsTrigger value="parrocchia">
							<Building className="h-4 w-4 mr-2" />
							Parrocchia
						</TabsTrigger>
						<TabsTrigger value="eventi">
							<Calendar className="h-4 w-4 mr-2" />
							Eventi
						</TabsTrigger>
						<TabsTrigger value="notifiche">
							<Bell className="h-4 w-4 mr-2" />
							Notifiche
						</TabsTrigger>
						<TabsTrigger value="backup">
							<Database className="h-4 w-4 mr-2" />
							Backup
						</TabsTrigger>
						<TabsTrigger value="sistema">
							<Info className="h-4 w-4 mr-2" />
							Sistema
						</TabsTrigger>
					</TabsList>

					{/* Parrocchia Tab */}
					<TabsContent value="parrocchia" className="space-y-6">
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<Building className="h-5 w-5" />
									Informazioni Parrocchia
								</CardTitle>
								<CardDescription>
									Configura i dati principali della parrocchia
								</CardDescription>
							</CardHeader>
							<CardContent>
								{parishSettingsQuery.isLoading ? (
									<div className="space-y-4">
										{Array.from({ length: 6 }).map((_, i) => (
											<div key={i} className="space-y-2">
												<Skeleton className="h-4 w-20" />
												<Skeleton className="h-10 w-full" />
											</div>
										))}
									</div>
								) : (
									<form onSubmit={handleParishSubmit} className="space-y-6">
										<div className="grid gap-4 md:grid-cols-2">
											<div className="space-y-2">
												<Label htmlFor="name">Nome Parrocchia *</Label>
												<Input
													id="name"
													value={parishForm.name}
													onChange={(e) =>
														setParishForm({
															...parishForm,
															name: e.target.value,
														})
													}
													placeholder="Parrocchia di Santa Maria"
													required
												/>
											</div>
											<div className="space-y-2">
												<Label htmlFor="email">Email</Label>
												<Input
													id="email"
													type="email"
													value={parishForm.email || ""}
													onChange={(e) =>
														setParishForm({
															...parishForm,
															email: e.target.value,
														})
													}
													placeholder="info@parrocchia.it"
												/>
											</div>
										</div>

										<div className="grid gap-4 md:grid-cols-2">
											<div className="space-y-2">
												<Label htmlFor="phone">Telefono</Label>
												<Input
													id="phone"
													value={parishForm.phone || ""}
													onChange={(e) =>
														setParishForm({
															...parishForm,
															phone: e.target.value,
														})
													}
													placeholder="+39 123 456 7890"
												/>
											</div>
											<div className="space-y-2">
												<Label htmlFor="website">Sito Web</Label>
												<Input
													id="website"
													type="url"
													value={parishForm.website || ""}
													onChange={(e) =>
														setParishForm({
															...parishForm,
															website: e.target.value,
														})
													}
													placeholder="https://www.parrocchia.it"
												/>
											</div>
										</div>

										<div className="space-y-2">
											<Label htmlFor="address">Indirizzo</Label>
											<Textarea
												id="address"
												value={parishForm.address || ""}
												onChange={(e) =>
													setParishForm({
														...parishForm,
														address: e.target.value,
													})
												}
												placeholder="Via Roma 1, 12345 Città (PR)"
												rows={2}
											/>
										</div>

										<div className="space-y-2">
											<Label htmlFor="logo">URL Logo</Label>
											<Input
												id="logo"
												type="url"
												value={parishForm.logo || ""}
												onChange={(e) =>
													setParishForm({ ...parishForm, logo: e.target.value })
												}
												placeholder="https://example.com/logo.png"
											/>
										</div>

										<div className="space-y-2">
											<Label htmlFor="description">Descrizione</Label>
											<Textarea
												id="description"
												value={parishForm.description || ""}
												onChange={(e) =>
													setParishForm({
														...parishForm,
														description: e.target.value,
													})
												}
												placeholder="Breve descrizione della parrocchia..."
												rows={3}
											/>
										</div>

										<div className="space-y-2">
											<Label htmlFor="photoVideoMinorsDeclaration">
												Dichiarazione Autorizzazione Foto/Video Minorenni
											</Label>
											<Textarea
												id="photoVideoMinorsDeclaration"
												value={parishForm.photoVideoMinorsDeclaration || ""}
												onChange={(e) =>
													setParishForm({
														...parishForm,
														photoVideoMinorsDeclaration: e.target.value,
													})
												}
												placeholder="Inserisci qui la dichiarazione specifica della tua parrocchia per l'autorizzazione al trattamento di foto e video dei minorenni..."
												rows={6}
											/>
											<p className="text-xs text-muted-foreground">
												Questa dichiarazione verrà mostrata nei dettagli degli
												eventi e durante la registrazione. Se lasciata vuota,
												verrà utilizzata una dichiarazione generica.
											</p>
										</div>

										<Button
											type="submit"
											disabled={updateParishSettingsMutation.isPending}
											className="w-full sm:w-auto"
										>
											{updateParishSettingsMutation.isPending ? (
												<RefreshCw className="h-4 w-4 mr-2 animate-spin" />
											) : (
												<Save className="h-4 w-4 mr-2" />
											)}
											Salva Impostazioni
										</Button>
									</form>
								)}
							</CardContent>
						</Card>
					</TabsContent>

					{/* Eventi Tab */}
					<TabsContent value="eventi" className="space-y-6">
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<Calendar className="h-5 w-5" />
									Impostazioni Eventi
								</CardTitle>
								<CardDescription>
									Configura i valori predefiniti per la creazione di eventi
								</CardDescription>
							</CardHeader>
							<CardContent>
								{eventSettingsQuery.isLoading ? (
									<div className="space-y-4">
										{Array.from({ length: 4 }).map((_, i) => (
											<div key={i} className="space-y-2">
												<Skeleton className="h-4 w-32" />
												<Skeleton className="h-10 w-full" />
											</div>
										))}
									</div>
								) : (
									<form onSubmit={handleEventSubmit} className="space-y-6">
										<div className="grid gap-4 md:grid-cols-2">
											<div className="space-y-2">
												<Label htmlFor="defaultMaxParticipants">
													Max Partecipanti Default
												</Label>
												<Input
													id="defaultMaxParticipants"
													type="number"
													min="1"
													value={eventForm.defaultMaxParticipants}
													onChange={(e) =>
														setEventForm({
															...eventForm,
															defaultMaxParticipants:
																parseInt(e.target.value) || 100,
														})
													}
												/>
											</div>
											<div className="space-y-2">
												<Label htmlFor="defaultRegistrationDeadlineHours">
													Scadenza Iscrizioni (ore prima)
												</Label>
												<Input
													id="defaultRegistrationDeadlineHours"
													type="number"
													min="1"
													value={eventForm.defaultRegistrationDeadlineHours}
													onChange={(e) =>
														setEventForm({
															...eventForm,
															defaultRegistrationDeadlineHours:
																parseInt(e.target.value) || 24,
														})
													}
												/>
											</div>
										</div>

										<div className="grid gap-4 md:grid-cols-2">
											<div className="space-y-2">
												<Label htmlFor="maxWaitingListSize">
													Dimensione Lista d'Attesa
												</Label>
												<Input
													id="maxWaitingListSize"
													type="number"
													min="0"
													value={eventForm.maxWaitingListSize}
													onChange={(e) =>
														setEventForm({
															...eventForm,
															maxWaitingListSize:
																parseInt(e.target.value) || 50,
														})
													}
												/>
											</div>
											<div className="space-y-2">
												<Label htmlFor="reminderHoursBefore">
													Promemoria (ore prima)
												</Label>
												<Input
													id="reminderHoursBefore"
													type="number"
													min="1"
													value={eventForm.reminderHoursBefore}
													onChange={(e) =>
														setEventForm({
															...eventForm,
															reminderHoursBefore:
																parseInt(e.target.value) || 24,
														})
													}
												/>
											</div>
										</div>

										<Separator />

										<div className="space-y-4">
											<h4 className="text-lg font-medium">
												Comportamenti Default
											</h4>

											<div className="flex items-center justify-between">
												<div className="space-y-0.5">
													<Label>Richiedi Consenso Foto/Video</Label>
													<p className="text-sm text-muted-foreground">
														Richiedi il consenso per foto e video dei minorenni
													</p>
												</div>
												<Switch
													checked={eventForm.requirePhotoVideoConsent}
													onCheckedChange={(checked) =>
														setEventForm({
															...eventForm,
															requirePhotoVideoConsent: checked,
														})
													}
												/>
											</div>

											<div className="flex items-center justify-between">
												<div className="space-y-0.5">
													<Label>Consenti Lista d'Attesa</Label>
													<p className="text-sm text-muted-foreground">
														Permetti iscrizioni anche quando l'evento è pieno
													</p>
												</div>
												<Switch
													checked={eventForm.allowWaitingList}
													onCheckedChange={(checked) =>
														setEventForm({
															...eventForm,
															allowWaitingList: checked,
														})
													}
												/>
											</div>

											<div className="flex items-center justify-between">
												<div className="space-y-0.5">
													<Label>Conferma Automatica</Label>
													<p className="text-sm text-muted-foreground">
														Conferma automaticamente le iscrizioni
													</p>
												</div>
												<Switch
													checked={eventForm.autoConfirmRegistrations}
													onCheckedChange={(checked) =>
														setEventForm({
															...eventForm,
															autoConfirmRegistrations: checked,
														})
													}
												/>
											</div>

											<div className="flex items-center justify-between">
												<div className="space-y-0.5">
													<Label>Invia Email di Conferma</Label>
													<p className="text-sm text-muted-foreground">
														Invia automaticamente email di conferma iscrizione
													</p>
												</div>
												<Switch
													checked={eventForm.sendConfirmationEmails}
													onCheckedChange={(checked) =>
														setEventForm({
															...eventForm,
															sendConfirmationEmails: checked,
														})
													}
												/>
											</div>

											<div className="flex items-center justify-between">
												<div className="space-y-0.5">
													<Label>Invia Email Promemoria</Label>
													<p className="text-sm text-muted-foreground">
														Invia automaticamente email promemoria prima
														dell'evento
													</p>
												</div>
												<Switch
													checked={eventForm.sendReminderEmails}
													onCheckedChange={(checked) =>
														setEventForm({
															...eventForm,
															sendReminderEmails: checked,
														})
													}
												/>
											</div>
										</div>

										<Button
											type="submit"
											disabled={updateEventSettingsMutation.isPending}
											className="w-full sm:w-auto"
										>
											{updateEventSettingsMutation.isPending ? (
												<RefreshCw className="h-4 w-4 mr-2 animate-spin" />
											) : (
												<Save className="h-4 w-4 mr-2" />
											)}
											Salva Impostazioni
										</Button>
									</form>
								)}
							</CardContent>
						</Card>
					</TabsContent>

					{/* Notifiche Tab */}
					<TabsContent value="notifiche" className="space-y-6">
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<Bell className="h-5 w-5" />
									Impostazioni Notifiche
								</CardTitle>
								<CardDescription>
									Configura i template e le modalità di notifica
								</CardDescription>
							</CardHeader>
							<CardContent>
								{notificationSettingsQuery.isLoading ? (
									<div className="space-y-4">
										{Array.from({ length: 6 }).map((_, i) => (
											<Skeleton key={i} className="h-20 w-full" />
										))}
									</div>
								) : (
									<form
										onSubmit={handleNotificationSubmit}
										className="space-y-6"
									>
										<div className="space-y-4">
											<h4 className="text-lg font-medium">
												Canali di Notifica
											</h4>

											<div className="flex items-center justify-between">
												<div className="space-y-0.5">
													<Label>Notifiche Email</Label>
													<p className="text-sm text-muted-foreground">
														Invia notifiche via email
													</p>
												</div>
												<Switch
													checked={notificationForm.emailNotifications}
													onCheckedChange={(checked) =>
														setNotificationForm({
															...notificationForm,
															emailNotifications: checked,
														})
													}
												/>
											</div>

											<div className="flex items-center justify-between">
												<div className="space-y-0.5">
													<Label>Notifiche SMS</Label>
													<p className="text-sm text-muted-foreground">
														Invia notifiche via SMS
													</p>
												</div>
												<Switch
													checked={notificationForm.smsNotifications}
													onCheckedChange={(checked) =>
														setNotificationForm({
															...notificationForm,
															smsNotifications: checked,
														})
													}
												/>
											</div>

											<div className="flex items-center justify-between">
												<div className="space-y-0.5">
													<Label>Notifiche Push</Label>
													<p className="text-sm text-muted-foreground">
														Invia notifiche push
													</p>
												</div>
												<Switch
													checked={notificationForm.pushNotifications}
													onCheckedChange={(checked) =>
														setNotificationForm({
															...notificationForm,
															pushNotifications: checked,
														})
													}
												/>
											</div>

											<div className="flex items-center justify-between">
												<div className="space-y-0.5">
													<Label>Promemoria Eventi</Label>
													<p className="text-sm text-muted-foreground">
														Invia promemoria automatici per gli eventi
													</p>
												</div>
												<Switch
													checked={notificationForm.eventReminders}
													onCheckedChange={(checked) =>
														setNotificationForm({
															...notificationForm,
															eventReminders: checked,
														})
													}
												/>
											</div>

											<div className="flex items-center justify-between">
												<div className="space-y-0.5">
													<Label>Aggiornamenti Iscrizioni</Label>
													<p className="text-sm text-muted-foreground">
														Notifica aggiornamenti sulle iscrizioni
													</p>
												</div>
												<Switch
													checked={notificationForm.registrationUpdates}
													onCheckedChange={(checked) =>
														setNotificationForm({
															...notificationForm,
															registrationUpdates: checked,
														})
													}
												/>
											</div>

											<div className="flex items-center justify-between">
												<div className="space-y-0.5">
													<Label>Avvisi di Sistema</Label>
													<p className="text-sm text-muted-foreground">
														Notifica problemi e avvisi di sistema
													</p>
												</div>
												<Switch
													checked={notificationForm.systemAlerts}
													onCheckedChange={(checked) =>
														setNotificationForm({
															...notificationForm,
															systemAlerts: checked,
														})
													}
												/>
											</div>

											<div className="flex items-center justify-between">
												<div className="space-y-0.5">
													<Label>Riepilogo Settimanale</Label>
													<p className="text-sm text-muted-foreground">
														Ricevi un riepilogo settimanale delle attività
													</p>
												</div>
												<Switch
													checked={notificationForm.weeklyDigest}
													onCheckedChange={(checked) =>
														setNotificationForm({
															...notificationForm,
															weeklyDigest: checked,
														})
													}
												/>
											</div>

											<div className="flex items-center justify-between">
												<div className="space-y-0.5">
													<Label>Report Mensile</Label>
													<p className="text-sm text-muted-foreground">
														Ricevi un report mensile dettagliato
													</p>
												</div>
												<Switch
													checked={notificationForm.monthlyReport}
													onCheckedChange={(checked) =>
														setNotificationForm({
															...notificationForm,
															monthlyReport: checked,
														})
													}
												/>
											</div>
										</div>

										<Alert>
											<Info className="h-4 w-4" />
											<AlertDescription>
												Le impostazioni di notifica sono state aggiornate. I
												template personalizzati per email e SMS saranno
												disponibili in una versione futura.
											</AlertDescription>
										</Alert>

										<Button
											type="submit"
											disabled={updateNotificationSettingsMutation.isPending}
											className="w-full sm:w-auto"
										>
											{updateNotificationSettingsMutation.isPending ? (
												<RefreshCw className="h-4 w-4 mr-2 animate-spin" />
											) : (
												<Save className="h-4 w-4 mr-2" />
											)}
											Salva Impostazioni
										</Button>
									</form>
								)}
							</CardContent>
						</Card>
					</TabsContent>

					{/* Backup Tab */}
					<TabsContent value="backup" className="space-y-6">
						<div className="grid gap-6 md:grid-cols-2">
							{/* Create Backup */}
							<Card>
								<CardHeader>
									<CardTitle className="flex items-center gap-2">
										<Download className="h-5 w-5" />
										Crea Backup
									</CardTitle>
									<CardDescription>
										Crea un backup completo del sistema
									</CardDescription>
								</CardHeader>
								<CardContent className="space-y-4">
									<Alert>
										<Info className="h-4 w-4" />
										<AlertDescription>
											Il backup includerà tutti i dati della parrocchia: eventi,
											utenti, famiglie e iscrizioni.
										</AlertDescription>
									</Alert>
									<Button
										onClick={handleCreateBackup}
										disabled={createBackupMutation.isPending}
										className="w-full"
									>
										{createBackupMutation.isPending ? (
											<RefreshCw className="h-4 w-4 mr-2 animate-spin" />
										) : (
											<Download className="h-4 w-4 mr-2" />
										)}
										Crea Backup
									</Button>
								</CardContent>
							</Card>

							{/* Backup List */}
							<Card>
								<CardHeader>
									<CardTitle className="flex items-center gap-2">
										<Database className="h-5 w-5" />
										Backup Disponibili
									</CardTitle>
									<CardDescription>Lista dei backup esistenti</CardDescription>
								</CardHeader>
								<CardContent>
									{backupsQuery.isLoading ? (
										<div className="space-y-3">
											{Array.from({ length: 3 }).map((_, i) => (
												<Skeleton key={i} className="h-16 w-full" />
											))}
										</div>
									) : backupsQuery.error ? (
										<p className="text-red-600">
											Errore nel caricamento dei backup
										</p>
									) : (
										<div className="space-y-3">
											{backupsQuery.data?.length === 0 ? (
												<p className="text-muted-foreground text-center py-4">
													Nessun backup disponibile
												</p>
											) : (
												backupsQuery.data?.map((backup) => (
													<div
														key={backup.id}
														className="flex items-center justify-between p-3 border rounded-lg"
													>
														<div>
															<p className="font-medium">{backup.filename}</p>
															<p className="text-sm text-muted-foreground">
																{formatFileSize(backup.size)} -{" "}
																{format(
																	new Date(backup.createdAt),
																	"dd/MM/yyyy HH:mm",
																	{ locale: it },
																)}
															</p>
														</div>
														<Dialog
															open={restoreDialogOpen}
															onOpenChange={setRestoreDialogOpen}
														>
															<DialogTrigger asChild>
																<Button
																	variant="outline"
																	size="sm"
																	onClick={() => setSelectedBackup(backup.id)}
																>
																	<Upload className="h-4 w-4 mr-2" />
																	Ripristina
																</Button>
															</DialogTrigger>
															<DialogContent>
																<DialogHeader>
																	<DialogTitle>Ripristina Backup</DialogTitle>
																	<DialogDescription>
																		Sei sicuro di voler ripristinare questo
																		backup? Tutti i dati attuali verranno
																		sostituiti.
																	</DialogDescription>
																</DialogHeader>
																<Alert className="my-4">
																	<AlertTriangle className="h-4 w-4" />
																	<AlertDescription>
																		<strong>Attenzione:</strong> Questa
																		operazione non può essere annullata. Verrà
																		creato automaticamente un backup della
																		situazione attuale.
																	</AlertDescription>
																</Alert>
																<DialogFooter>
																	<Button
																		variant="outline"
																		onClick={() => setRestoreDialogOpen(false)}
																	>
																		Annulla
																	</Button>
																	<Button
																		onClick={handleRestoreBackup}
																		disabled={restoreBackupMutation.isPending}
																	>
																		{restoreBackupMutation.isPending ? (
																			<RefreshCw className="h-4 w-4 mr-2 animate-spin" />
																		) : (
																			<Upload className="h-4 w-4 mr-2" />
																		)}
																		Ripristina
																	</Button>
																</DialogFooter>
															</DialogContent>
														</Dialog>
													</div>
												))
											)}
										</div>
									)}
								</CardContent>
							</Card>
						</div>
					</TabsContent>

					{/* Sistema Tab */}
					<TabsContent value="sistema" className="space-y-6">
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<Info className="h-5 w-5" />
									Informazioni Sistema
								</CardTitle>
								<CardDescription>
									Stato e configurazione del sistema
								</CardDescription>
							</CardHeader>
							<CardContent>
								{systemInfoQuery.isLoading ? (
									<div className="space-y-4">
										{Array.from({ length: 5 }).map((_, i) => (
											<div key={i} className="flex justify-between">
												<Skeleton className="h-4 w-32" />
												<Skeleton className="h-4 w-20" />
											</div>
										))}
									</div>
								) : systemInfoQuery.error ? (
									<p className="text-red-600">
										Errore nel caricamento delle informazioni di sistema
									</p>
								) : (
									<div className="space-y-4">
										<div className="grid gap-4 md:grid-cols-2">
											<div className="space-y-3">
												<div className="flex justify-between">
													<span className="font-medium">Versione:</span>
													<Badge variant="secondary">
														{systemInfoQuery.data?.version}
													</Badge>
												</div>
												<div className="flex justify-between">
													<span className="font-medium">Ambiente:</span>
													<Badge
														variant={
															process.env.NODE_ENV === "production"
																? "default"
																: "destructive"
														}
													>
														{process.env.NODE_ENV || "development"}
													</Badge>
												</div>
												<div className="flex justify-between">
													<span className="font-medium">Uptime:</span>
													<span>N/A</span>
												</div>
											</div>

											<div className="space-y-3">
												<div className="flex justify-between">
													<span className="font-medium">Database:</span>
													<span>SQLite</span>
												</div>
												<div className="flex justify-between">
													<span className="font-medium">Dimensione DB:</span>
													<span>
														{formatFileSize(
															systemInfoQuery.data?.databaseSize || 0,
														)}
													</span>
												</div>
												<div className="flex justify-between">
													<span className="font-medium">Tabelle:</span>
													<span>12</span>
												</div>
											</div>
										</div>

										<Separator />

										<div>
											<h4 className="font-medium mb-3">Stato Sistema</h4>
											<div className="space-y-2">
												<div className="flex items-center justify-between">
													<span>Database:</span>
													<div className="flex items-center gap-2">
														{systemInfoQuery.data?.systemHealth?.database ? (
															<CheckCircle className="h-4 w-4 text-green-600" />
														) : (
															<AlertCircle className="h-4 w-4 text-red-600" />
														)}
														<span>
															{systemInfoQuery.data?.systemHealth?.database
																? "Online"
																: "Offline"}
														</span>
													</div>
												</div>
												<div className="flex items-center justify-between">
													<span>Email:</span>
													<div className="flex items-center gap-2">
														{systemInfoQuery.data?.systemHealth?.email ? (
															<CheckCircle className="h-4 w-4 text-green-600" />
														) : (
															<AlertCircle className="h-4 w-4 text-red-600" />
														)}
														<span>
															{systemInfoQuery.data?.systemHealth?.email
																? "Funzionante"
																: "Non disponibile"}
														</span>
													</div>
												</div>
												<div className="flex items-center justify-between">
													<span>SMS:</span>
													<div className="flex items-center gap-2">
														{systemInfoQuery.data?.systemHealth?.sms ? (
															<CheckCircle className="h-4 w-4 text-green-600" />
														) : (
															<AlertCircle className="h-4 w-4 text-red-600" />
														)}
														<span>
															{systemInfoQuery.data?.systemHealth?.sms
																? "Funzionante"
																: "Non disponibile"}
														</span>
													</div>
												</div>
											</div>
										</div>

										<Alert>
											<Info className="h-4 w-4" />
											<AlertDescription>
												Per assistenza tecnica o segnalazione problemi, contatta
												il supporto tecnico.
											</AlertDescription>
										</Alert>
									</div>
								)}
							</CardContent>
						</Card>
					</TabsContent>
				</Tabs>
			</div>
		</RoleGuard>
	);
}
