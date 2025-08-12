import { Link, useLocation } from "@tanstack/react-router";
import {
	Baby,
	BarChart3,
	Building,
	Calendar,
	ClipboardList,
	Crown,
	Info,
	LayoutDashboard,
	Settings,
	Shield,
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
		to: "/iscrizioni",
		icon: ClipboardList,
		label: "Le Mie Iscrizioni",
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

const supremeAdminNavigationItems = [
	{
		to: "/supreme-admin",
		icon: Crown,
		label: "Supreme Admin Dashboard",
	},
	{
		to: "/supreme-admin/users",
		icon: Users,
		label: "Gestione Utenti Globale",
	},
	{
		to: "/supreme-admin/organizations",
		icon: Building,
		label: "Gestione Parrocchie",
	},
];

export function Sidebar() {
	const location = useLocation();
	const currentPath = location.pathname;
	const { userRole, loading, user } = useAuth();

	// Debug info - remove in production
	const isDebugMode = process.env.NODE_ENV === "development";

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

	// Check if user has Supreme Admin role (from better-auth admin plugin)
	const hasSupremeAdminAccess = user?.role === "admin";

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
					const isActive =
						currentPath === item.to ||
						currentPath.startsWith(`${item.to}/`) ||
						currentPath.startsWith(`${item.to}?`);

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
							let isActive = false;
							if (item.to === "/admin") {
								// Admin dashboard is active only on exact match
								isActive = currentPath === "/admin";
							} else {
								// Other admin routes are active when path matches exactly or starts with their route
								isActive =
									currentPath === item.to ||
									currentPath.startsWith(`${item.to}/`) ||
									currentPath.startsWith(`${item.to}?`);
							}

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

				{/* Supreme Admin section */}
				{hasSupremeAdminAccess && (
					<>
						<hr className="my-4 border-border" />
						<div className="px-3 py-2">
							<span className="text-xs font-semibold text-purple-600 uppercase tracking-wider">
								Supreme Admin
							</span>
						</div>

						{/* Supreme Admin navigation items */}
						{supremeAdminNavigationItems.map((item) => {
							const Icon = item.icon;

							// Clean logic for nested routes
							let isActive = false;
							if (item.to === "/supreme-admin") {
								// Dashboard is active only on exact match
								isActive = currentPath === "/supreme-admin";
							} else {
								// Other routes are active when path matches exactly or starts with their route + "/"
								isActive =
									currentPath === item.to ||
									currentPath.startsWith(`${item.to}/`) ||
									currentPath.startsWith(`${item.to}?`);
							}

							return (
								<Link
									key={item.to}
									to={item.to}
									className={cn(
										"flex w-full items-center space-x-3 rounded-md px-3 py-2 text-left text-sm transition-colors",
										isActive
											? "bg-purple-600 text-white"
											: "hover:bg-purple-50 text-purple-700",
									)}
								>
									<Icon size={16} />
									<span>{item.label}</span>
								</Link>
							);
						})}
					</>
				)}

				{/* Privacy and legal section */}
				<hr className="my-4 border-border" />
				<div className="px-3 py-2">
					<span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
						Informazioni
					</span>
				</div>

				<Link
					to="/privacy"
					className={cn(
						"flex w-full items-center space-x-3 rounded-md px-3 py-2 text-left text-sm transition-colors",
						currentPath === "/privacy"
							? "bg-primary text-primary-foreground"
							: "hover:bg-accent",
					)}
				>
					<Shield size={16} />
					<span>Privacy Policy</span>
				</Link>

				{/* Debug section - remove in production */}
				{isDebugMode && hasSupremeAdminAccess && (
					<>
						<hr className="my-4 border-border" />
						<div className="px-3 py-2">
							<span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
								Debug Info
							</span>
						</div>
						<div className="px-3 py-2 text-xs bg-muted rounded-md">
							<div className="flex items-center gap-2 mb-1">
								<Info size={12} />
								<span className="font-medium">Current Path:</span>
							</div>
							<div className="font-mono text-xs break-all">{currentPath}</div>
							<div className="mt-2">
								<span className="font-medium">Active Routes:</span>
								<ul className="mt-1 space-y-1">
									{supremeAdminNavigationItems.map((item) => {
										let isActive = false;
										if (item.to === "/supreme-admin") {
											isActive = currentPath === "/supreme-admin";
										} else {
											isActive =
												currentPath === item.to ||
												currentPath.startsWith(`${item.to}/`) ||
												currentPath.startsWith(`${item.to}?`);
										}
										return (
											<li
												key={item.to}
												className={cn(
													"text-xs px-1 rounded",
													isActive
														? "bg-green-100 text-green-800"
														: "text-muted-foreground",
												)}
											>
												{item.to}: {isActive ? "✓" : "✗"}
											</li>
										);
									})}
								</ul>
							</div>
						</div>
					</>
				)}
			</nav>
		</aside>
	);
}
