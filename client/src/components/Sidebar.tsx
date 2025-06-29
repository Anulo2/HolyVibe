import { Link, useLocation } from "@tanstack/react-router";
import {
	Baby,
	BarChart3,
	Building,
	Calendar,
	LayoutDashboard,
	Settings,
	UserCheck,
	Users,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

const navigationItems = [
	{
		to: "/dashboard",
		icon: Users,
		label: "Panoramica",
		roles: [], // Available to all users
	},
	{
		to: "/famiglia",
		icon: Baby,
		label: "Famiglia",
		roles: [], // Available to all users
	},
	{
		to: "/eventi",
		icon: Calendar,
		label: "Eventi",
		roles: [], // Available to all users
	},
	{
		to: "/profilo",
		icon: Settings,
		label: "Profilo",
		roles: [], // Available to all users
	},
	{
		to: "/parrocchie",
		icon: Building,
		label: "Parrocchie",
		roles: [], // Available to all users
	},
];

const adminNavigationItems = [
	{
		to: "/admin",
		icon: LayoutDashboard,
		label: "Admin Dashboard",
		roles: ["amministratore", "editor", "animatore"],
	},
	{
		to: "/admin/eventi",
		icon: Calendar,
		label: "Gestione Eventi",
		roles: ["amministratore", "editor", "animatore"],
	},
	{
		to: "/admin/iscrizioni",
		icon: UserCheck,
		label: "Gestione Iscrizioni",
		roles: ["amministratore", "editor", "animatore"],
	},
	{
		to: "/admin/utenti",
		icon: Users,
		label: "Gestione Utenti",
		roles: ["amministratore"],
	},
	{
		to: "/admin/reportistica",
		icon: BarChart3,
		label: "Reportistica",
		roles: ["amministratore"],
	},
	{
		to: "/admin/impostazioni",
		icon: Settings,
		label: "Impostazioni",
		roles: ["amministratore"],
	},
];

export function Sidebar() {
	const location = useLocation();
	const currentPath = location.pathname;
	const { userRole, loading } = useAuth();

	// Don't render anything while loading
	if (loading) {
		return (
			<aside className="w-64 border-r bg-card p-4">
				<div className="animate-pulse space-y-2">
					<div className="h-10 bg-muted rounded-md" />
					<div className="h-10 bg-muted rounded-md" />
					<div className="h-10 bg-muted rounded-md" />
					<div className="h-10 bg-muted rounded-md" />
					<div className="h-10 bg-muted rounded-md" />
				</div>
			</aside>
		);
	}

	// Check if user has admin role
	const hasAdminAccess =
		userRole && ["amministratore", "editor", "animatore"].includes(userRole);

	// Filter admin items based on user role
	const visibleAdminItems = adminNavigationItems.filter(
		(item) => item.roles.length === 0 || item.roles.includes(userRole || ""),
	);

	return (
		<aside className="w-64 border-r bg-card p-4">
			<nav className="space-y-2">
				{/* Regular navigation items */}
				{navigationItems.map((item) => {
					const Icon = item.icon;
					const isActive = currentPath === item.to;

					return (
						<Link
							key={item.to}
							to={item.to}
							className={cn(
								"flex w-full items-center space-x-3 rounded-md px-3 py-2 text-left text-sm transition-colors",
								isActive
									? "bg-primary text-primary-foreground"
									: "hover:bg-accent",
							)}
						>
							<Icon size={16} />
							<span>{item.label}</span>
						</Link>
					);
				})}

				{/* Admin section separator */}
				{hasAdminAccess && visibleAdminItems.length > 0 && (
					<>
						<hr className="my-4 border-border" />
						<div className="px-3 py-2">
							<span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
								Amministrazione
							</span>
						</div>

						{/* Admin navigation items */}
						{visibleAdminItems.map((item) => {
							const Icon = item.icon;
							const isActive = currentPath === item.to;

							return (
								<Link
									key={item.to}
									to={item.to}
									className={cn(
										"flex w-full items-center space-x-3 rounded-md px-3 py-2 text-left text-sm transition-colors",
										isActive
											? "bg-primary text-primary-foreground"
											: "hover:bg-accent",
									)}
								>
									<Icon size={16} />
									<span>{item.label}</span>
								</Link>
							);
						})}
					</>
				)}
			</nav>
		</aside>
	);
}
