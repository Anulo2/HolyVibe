import { Link, useLocation } from "@tanstack/react-router";
import {
	Baby,
	Building,
	Calendar,
	Settings,
	Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigationItems = [
	{
		to: "/dashboard",
		icon: Users,
		label: "Panoramica",
	},
	{
		to: "/famiglia",
		icon: Baby,
		label: "Famiglia",
	},
	{
		to: "/eventi",
		icon: Calendar,
		label: "Eventi",
	},
	{
		to: "/profilo",
		icon: Settings,
		label: "Profilo",
	},
	{
		to: "/parrocchie",
		icon: Building,
		label: "Parrocchie",
	},
];

export function Sidebar() {
	const location = useLocation();
	const currentPath = location.pathname;

	return (
		<aside className="w-64 border-r bg-card p-4">
			<nav className="space-y-2">
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
									: "hover:bg-accent"
							)}
						>
							<Icon size={16} />
							<span>{item.label}</span>
						</Link>
					);
				})}
			</nav>
		</aside>
	);
} 