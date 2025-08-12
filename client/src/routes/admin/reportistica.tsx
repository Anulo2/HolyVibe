import { createFileRoute, redirect } from "@tanstack/react-router";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import {
	Activity,
	BarChart3,
	Calendar,
	Euro,
	PieChart,
	TrendingUp,
	Users,
} from "lucide-react";
import { useState } from "react";
import {
	Area,
	AreaChart,
	Bar,
	BarChart,
	CartesianGrid,
	Cell,
	Line,
	LineChart,
	Pie,
	PieChart as RechartsPieChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import { RoleGuard } from "@/components/admin/role-guard";
import { Badge } from "@/components/ui/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
// import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	type ExportFormat,
	type ExportType,
	useAgeDistributionReport,
	useEventsStatsReport,
	useExportDataMutation,
	useFinancialReport,
	useUserAnalyticsReport,
} from "@/hooks/useAdvancedReports";

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

const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff7300", "#0088fe"];

function ReportisticaPage() {
	const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
	const [activeTab, setActiveTab] = useState("eventi");

	const startDate = dateRange.from
		? format(dateRange.from, "yyyy-MM-dd")
		: undefined;
	const endDate = dateRange.to ? format(dateRange.to, "yyyy-MM-dd") : undefined;

	// Query hooks for different reports
	const eventsStatsQuery = useEventsStatsReport(startDate, endDate);
	const userAnalyticsQuery = useUserAnalyticsReport(startDate, endDate);
	const financialQuery = useFinancialReport(startDate, endDate);
	const ageDistributionQuery = useAgeDistributionReport(startDate, endDate);

	const exportDataMutation = useExportDataMutation();

	const handleExport = (exportType: ExportType, format: ExportFormat) => {
		exportDataMutation.mutate({
			exportType,
			format,
			startDate,
			endDate,
		});
	};

	const formatCurrency = (value: number) => {
		return new Intl.NumberFormat("it-IT", {
			style: "currency",
			currency: "EUR",
		}).format(value);
	};

	const formatDate = (dateString: string) => {
		return format(new Date(`${dateString}-01`), "MMM yyyy", { locale: it });
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
				<div>
					<h1 className="text-3xl font-bold">Reportistica</h1>
					<p className="text-muted-foreground">
						Analisi e statistiche dettagliate della parrocchia.
					</p>
				</div>

				{/* Filters and Export */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<BarChart3 className="h-5 w-5" />
							Filtri e Export
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="flex flex-col sm:flex-row gap-4 items-end">
							<div className="flex-1">
								<label className="text-sm font-medium mb-2 block">
									Periodo di analisi
								</label>
								<div className="flex items-center gap-2">
									<input
										type="date"
										value={
											dateRange.from ? format(dateRange.from, "yyyy-MM-dd") : ""
										}
										onChange={(e) =>
											setDateRange({
												...dateRange,
												from: e.target.value
													? new Date(e.target.value)
													: undefined,
											})
										}
										className="px-3 py-2 border rounded-md"
									/>
									<span>-</span>
									<input
										type="date"
										value={
											dateRange.to ? format(dateRange.to, "yyyy-MM-dd") : ""
										}
										onChange={(e) =>
											setDateRange({
												...dateRange,
												to: e.target.value
													? new Date(e.target.value)
													: undefined,
											})
										}
										className="px-3 py-2 border rounded-md"
									/>
								</div>
							</div>
							<div className="flex gap-2">
								<Select
									onValueChange={(value) => {
										const [type, format] = value.split("-") as [
											ExportType,
											ExportFormat,
										];
										handleExport(type, format);
									}}
								>
									<SelectTrigger className="w-[200px]">
										<SelectValue placeholder="Export dati" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="events-csv">Eventi (CSV)</SelectItem>
										<SelectItem value="events-json">Eventi (JSON)</SelectItem>
										<SelectItem value="users-csv">Utenti (CSV)</SelectItem>
										<SelectItem value="users-json">Utenti (JSON)</SelectItem>
										<SelectItem value="registrations-csv">
											Iscrizioni (CSV)
										</SelectItem>
										<SelectItem value="registrations-json">
											Iscrizioni (JSON)
										</SelectItem>
										<SelectItem value="children-csv">Bambini (CSV)</SelectItem>
										<SelectItem value="children-json">
											Bambini (JSON)
										</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Report Tabs */}
				<Tabs value={activeTab} onValueChange={setActiveTab}>
					<TabsList className="grid w-full grid-cols-4">
						<TabsTrigger value="eventi">
							<Calendar className="h-4 w-4 mr-2" />
							Eventi
						</TabsTrigger>
						<TabsTrigger value="utenti">
							<Users className="h-4 w-4 mr-2" />
							Utenti
						</TabsTrigger>
						<TabsTrigger value="finanziari">
							<Euro className="h-4 w-4 mr-2" />
							Finanziari
						</TabsTrigger>
						<TabsTrigger value="demografia">
							<PieChart className="h-4 w-4 mr-2" />
							Demografia
						</TabsTrigger>
					</TabsList>

					{/* Eventi Tab */}
					<TabsContent value="eventi" className="space-y-6">
						{eventsStatsQuery.isLoading ? (
							<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
								{Array.from({ length: 6 }).map((_, i) => (
									<Card key={i}>
										<CardHeader>
											<Skeleton className="h-4 w-32" />
										</CardHeader>
										<CardContent>
											<Skeleton className="h-8 w-20 mb-2" />
											<Skeleton className="h-32 w-full" />
										</CardContent>
									</Card>
								))}
							</div>
						) : eventsStatsQuery.error ? (
							<Card>
								<CardContent className="p-6">
									<p className="text-red-600">
										Errore nel caricamento dei dati degli eventi
									</p>
								</CardContent>
							</Card>
						) : (
							<div className="space-y-6">
								{/* Events Summary Cards */}
								<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
									<Card>
										<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
											<CardTitle className="text-sm font-medium">
												Eventi Totali
											</CardTitle>
											<Calendar className="h-4 w-4 text-muted-foreground" />
										</CardHeader>
										<CardContent>
											<div className="text-2xl font-bold">
												{eventsStatsQuery.data?.data?.totalEvents?.[0]?.count ||
													0}
											</div>
											<p className="text-xs text-muted-foreground">
												Nel periodo selezionato
											</p>
										</CardContent>
									</Card>

									<Card>
										<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
											<CardTitle className="text-sm font-medium">
												Partecipanti Medi
											</CardTitle>
											<Users className="h-4 w-4 text-muted-foreground" />
										</CardHeader>
										<CardContent>
											<div className="text-2xl font-bold">
												{eventsStatsQuery.data?.data?.monthlyStats?.length
													? Math.round(
															eventsStatsQuery.data.data.monthlyStats.reduce(
																(sum: number, stat: any) =>
																	sum + (stat.avgParticipants || 0),
																0,
															) /
																eventsStatsQuery.data.data.monthlyStats.length,
														)
													: 0}
											</div>
											<p className="text-xs text-muted-foreground">
												Per evento
											</p>
										</CardContent>
									</Card>

									<Card>
										<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
											<CardTitle className="text-sm font-medium">
												Evento Top
											</CardTitle>
											<TrendingUp className="h-4 w-4 text-muted-foreground" />
										</CardHeader>
										<CardContent>
											<div className="text-lg font-bold truncate">
												{eventsStatsQuery.data?.data?.popularEvents?.[0]
													?.title || "N/A"}
											</div>
											<p className="text-xs text-muted-foreground">
												{eventsStatsQuery.data?.data?.popularEvents?.[0]
													?.currentParticipants || 0}{" "}
												partecipanti
											</p>
										</CardContent>
									</Card>
								</div>

								{/* Monthly Events Chart */}
								<Card>
									<CardHeader>
										<CardTitle>Andamento Eventi per Mese</CardTitle>
										<CardDescription>
											Numero di eventi e partecipanti medi nel tempo
										</CardDescription>
									</CardHeader>
									<CardContent>
										<ResponsiveContainer width="100%" height={300}>
											<AreaChart
												data={eventsStatsQuery.data?.data?.monthlyStats || []}
											>
												<CartesianGrid strokeDasharray="3 3" />
												<XAxis dataKey="month" tickFormatter={formatDate} />
												<YAxis />
												<Tooltip
													labelFormatter={formatDate}
													formatter={(value, name) => [
														name === "count"
															? value
															: Math.round(Number(value)),
														name === "count" ? "Eventi" : "Partecipanti Medi",
													]}
												/>
												<Area
													type="monotone"
													dataKey="count"
													stackId="1"
													stroke="#8884d8"
													fill="#8884d8"
													name="count"
												/>
												<Area
													type="monotone"
													dataKey="avgParticipants"
													stackId="2"
													stroke="#82ca9d"
													fill="#82ca9d"
													name="avgParticipants"
												/>
											</AreaChart>
										</ResponsiveContainer>
									</CardContent>
								</Card>

								{/* Popular Events Table */}
								<Card>
									<CardHeader>
										<CardTitle>Eventi Più Popolari</CardTitle>
										<CardDescription>
											Classifica eventi per numero di partecipanti
										</CardDescription>
									</CardHeader>
									<CardContent>
										<div className="space-y-4">
											{eventsStatsQuery.data?.data?.popularEvents
												?.slice(0, 5)
												.map((event: any, index: number) => (
													<div
														key={event.id}
														className="flex items-center justify-between p-4 border rounded-lg"
													>
														<div className="flex items-center gap-4">
															<Badge variant="secondary">#{index + 1}</Badge>
															<div>
																<h4 className="font-medium">{event.title}</h4>
																<p className="text-sm text-muted-foreground">
																	{event.currentParticipants}/
																	{event.maxParticipants} partecipanti
																</p>
															</div>
														</div>
														<div className="text-right">
															<div className="font-bold">
																{Math.round(event.fillRate)}%
															</div>
															<Progress
																value={event.fillRate}
																className="w-20"
															/>
														</div>
													</div>
												))}
										</div>
									</CardContent>
								</Card>
							</div>
						)}
					</TabsContent>

					{/* Utenti Tab */}
					<TabsContent value="utenti" className="space-y-6">
						{userAnalyticsQuery.isLoading ? (
							<div className="grid gap-4 md:grid-cols-2">
								{Array.from({ length: 4 }).map((_, i) => (
									<Card key={i}>
										<CardHeader>
											<Skeleton className="h-4 w-32" />
										</CardHeader>
										<CardContent>
											<Skeleton className="h-32 w-full" />
										</CardContent>
									</Card>
								))}
							</div>
						) : userAnalyticsQuery.error ? (
							<Card>
								<CardContent className="p-6">
									<p className="text-red-600">
										Errore nel caricamento dei dati degli utenti
									</p>
								</CardContent>
							</Card>
						) : (
							<div className="space-y-6">
								{/* User Growth Chart */}
								<Card>
									<CardHeader>
										<CardTitle>Crescita Utenti</CardTitle>
										<CardDescription>
											Nuovi utenti registrati per mese
										</CardDescription>
									</CardHeader>
									<CardContent>
										<ResponsiveContainer width="100%" height={300}>
											<LineChart
												data={
													userAnalyticsQuery.data?.data?.monthlyGrowth || []
												}
											>
												<CartesianGrid strokeDasharray="3 3" />
												<XAxis dataKey="month" tickFormatter={formatDate} />
												<YAxis />
												<Tooltip
													labelFormatter={formatDate}
													formatter={(value) => [value, "Nuovi Utenti"]}
												/>
												<Line
													type="monotone"
													dataKey="newUsers"
													stroke="#8884d8"
													strokeWidth={2}
													dot={{ fill: "#8884d8" }}
												/>
											</LineChart>
										</ResponsiveContainer>
									</CardContent>
								</Card>

								{/* Active Users */}
								<Card>
									<CardHeader>
										<CardTitle>Utenti Più Attivi</CardTitle>
										<CardDescription>
											Utenti con più iscrizioni agli eventi
										</CardDescription>
									</CardHeader>
									<CardContent>
										<div className="space-y-4">
											{userAnalyticsQuery.data?.data?.activeUsers
												?.slice(0, 10)
												.map((user: any, index: number) => (
													<div
														key={user.userId}
														className="flex items-center justify-between"
													>
														<div className="flex items-center gap-4">
															<Badge variant="outline">#{index + 1}</Badge>
															<div>
																<p className="font-medium">{user.name}</p>
																<p className="text-sm text-muted-foreground">
																	{user.email}
																</p>
															</div>
														</div>
														<Badge>{user.registrationCount} iscrizioni</Badge>
													</div>
												))}
										</div>
									</CardContent>
								</Card>
							</div>
						)}
					</TabsContent>

					{/* Finanziari Tab */}
					<TabsContent value="finanziari" className="space-y-6">
						{financialQuery.isLoading ? (
							<div className="grid gap-4 md:grid-cols-2">
								{Array.from({ length: 4 }).map((_, i) => (
									<Card key={i}>
										<CardHeader>
											<Skeleton className="h-4 w-32" />
										</CardHeader>
										<CardContent>
											<Skeleton className="h-32 w-full" />
										</CardContent>
									</Card>
								))}
							</div>
						) : financialQuery.error ? (
							<Card>
								<CardContent className="p-6">
									<p className="text-red-600">
										Errore nel caricamento dei dati finanziari
									</p>
								</CardContent>
							</Card>
						) : (
							<div className="space-y-6">
								{/* Financial Summary */}
								<div className="grid gap-4 md:grid-cols-3">
									<Card>
										<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
											<CardTitle className="text-sm font-medium">
												Entrate Totali
											</CardTitle>
											<Euro className="h-4 w-4 text-muted-foreground" />
										</CardHeader>
										<CardContent>
											<div className="text-2xl font-bold">
												{formatCurrency(
													financialQuery.data?.data?.monthlyFinancial?.reduce(
														(sum: number, item: any) =>
															sum + (item.totalRevenue || 0),
														0,
													) || 0,
												)}
											</div>
											<p className="text-xs text-muted-foreground">
												Nel periodo selezionato
											</p>
										</CardContent>
									</Card>

									<Card>
										<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
											<CardTitle className="text-sm font-medium">
												Eventi a Pagamento
											</CardTitle>
											<Calendar className="h-4 w-4 text-muted-foreground" />
										</CardHeader>
										<CardContent>
											<div className="text-2xl font-bold">
												{financialQuery.data?.data?.monthlyFinancial?.reduce(
													(sum: number, item: any) =>
														sum + (item.paidEvents || 0),
													0,
												) || 0}
											</div>
											<p className="text-xs text-muted-foreground">
												Eventi con costo
											</p>
										</CardContent>
									</Card>

									<Card>
										<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
											<CardTitle className="text-sm font-medium">
												Eventi Gratuiti
											</CardTitle>
											<Activity className="h-4 w-4 text-muted-foreground" />
										</CardHeader>
										<CardContent>
											<div className="text-2xl font-bold">
												{financialQuery.data?.data?.monthlyFinancial?.reduce(
													(sum: number, item: any) =>
														sum + (item.freeEvents || 0),
													0,
												) || 0}
											</div>
											<p className="text-xs text-muted-foreground">
												Eventi gratuiti
											</p>
										</CardContent>
									</Card>
								</div>

								{/* Revenue Chart */}
								<Card>
									<CardHeader>
										<CardTitle>Entrate Mensili</CardTitle>
										<CardDescription>
											Andamento delle entrate nel tempo
										</CardDescription>
									</CardHeader>
									<CardContent>
										<ResponsiveContainer width="100%" height={300}>
											<BarChart
												data={financialQuery.data?.data?.monthlyFinancial || []}
											>
												<CartesianGrid strokeDasharray="3 3" />
												<XAxis dataKey="month" tickFormatter={formatDate} />
												<YAxis
													tickFormatter={(value) => formatCurrency(value)}
												/>
												<Tooltip
													labelFormatter={formatDate}
													formatter={(value) => [
														formatCurrency(Number(value)),
														"Entrate",
													]}
												/>
												<Bar dataKey="totalRevenue" fill="#8884d8" />
											</BarChart>
										</ResponsiveContainer>
									</CardContent>
								</Card>

								{/* Top Revenue Events */}
								<Card>
									<CardHeader>
										<CardTitle>Eventi con Maggiori Entrate</CardTitle>
										<CardDescription>
											Classifica eventi per entrate generate
										</CardDescription>
									</CardHeader>
									<CardContent>
										<div className="space-y-4">
											{financialQuery.data?.data?.revenueByEvent
												?.slice(0, 10)
												.map((event: any, index: number) => (
													<div
														key={event.id}
														className="flex items-center justify-between"
													>
														<div className="flex items-center gap-4">
															<Badge variant="outline">#{index + 1}</Badge>
															<div>
																<p className="font-medium">{event.title}</p>
																<p className="text-sm text-muted-foreground">
																	{event.participants} partecipanti
																</p>
															</div>
														</div>
														<div className="text-right">
															<div className="font-bold">
																{formatCurrency(event.revenue)}
															</div>
															<div className="text-sm text-muted-foreground">
																{formatCurrency(Number(event.price || 0))} per
																persona
															</div>
														</div>
													</div>
												))}
										</div>
									</CardContent>
								</Card>
							</div>
						)}
					</TabsContent>

					{/* Demografia Tab */}
					<TabsContent value="demografia" className="space-y-6">
						{ageDistributionQuery.isLoading ? (
							<Card>
								<CardHeader>
									<Skeleton className="h-4 w-32" />
								</CardHeader>
								<CardContent>
									<Skeleton className="h-64 w-full" />
								</CardContent>
							</Card>
						) : ageDistributionQuery.error ? (
							<Card>
								<CardContent className="p-6">
									<p className="text-red-600">
										Errore nel caricamento dei dati demografici
									</p>
								</CardContent>
							</Card>
						) : (
							<div className="space-y-6">
								{/* Age Distribution Chart */}
								<Card>
									<CardHeader>
										<CardTitle>Distribuzione per Età</CardTitle>
										<CardDescription>
											Suddivisione dei bambini iscritti per fascia d'età
										</CardDescription>
									</CardHeader>
									<CardContent>
										<div className="grid md:grid-cols-2 gap-6">
											<ResponsiveContainer width="100%" height={300}>
												<RechartsPieChart>
													<Pie
														data={
															ageDistributionQuery.data?.data
																?.ageDistribution || []
														}
														dataKey="count"
														nameKey="ageGroup"
														cx="50%"
														cy="50%"
														outerRadius={80}
														label={({ ageGroup, count }: any) =>
															`${ageGroup}: ${count}`
														}
													>
														{(
															ageDistributionQuery.data?.data
																?.ageDistribution || []
														).map((_: any, index: number) => (
															<Cell
																key={`cell-${index}`}
																fill={COLORS[index % COLORS.length]}
															/>
														))}
													</Pie>
													<Tooltip />
												</RechartsPieChart>
											</ResponsiveContainer>

											<div className="space-y-4">
												{ageDistributionQuery.data?.data?.ageDistribution?.map(
													(item: any, index: number) => (
														<div
															key={item.ageGroup}
															className="flex items-center justify-between"
														>
															<div className="flex items-center gap-3">
																<div
																	className="w-4 h-4 rounded-full"
																	style={{
																		backgroundColor:
																			COLORS[index % COLORS.length],
																	}}
																/>
																<span className="font-medium">
																	{item.ageGroup} anni
																</span>
															</div>
															<Badge variant="secondary">
																{item.count} bambini
															</Badge>
														</div>
													),
												)}
											</div>
										</div>
									</CardContent>
								</Card>
							</div>
						)}
					</TabsContent>
				</Tabs>
			</div>
		</RoleGuard>
	);
}
