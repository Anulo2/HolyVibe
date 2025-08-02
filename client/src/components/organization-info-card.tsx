import {
	Building2,
	ExternalLink,
	Globe,
	Mail,
	MapPin,
	Phone,
	User,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import type { OrganizationInfo } from "@/hooks/useSettings";

interface OrganizationInfoCardProps {
	organization: OrganizationInfo;
	isLoading?: boolean;
	showRole?: boolean;
}

export function OrganizationInfoCard({
	organization,
	isLoading = false,
	showRole = true,
}: OrganizationInfoCardProps) {
	if (isLoading) {
		return (
			<Card>
				<CardHeader>
					<div className="flex items-center space-x-4">
						<Skeleton className="h-16 w-16 rounded-full" />
						<div className="space-y-2">
							<Skeleton className="h-6 w-48" />
							<Skeleton className="h-4 w-24" />
						</div>
					</div>
				</CardHeader>
				<CardContent className="space-y-4">
					{Array.from({ length: 5 }).map((_, i) => (
						<div key={i} className="flex items-center space-x-3">
							<Skeleton className="h-4 w-4" />
							<Skeleton className="h-4 w-32" />
						</div>
					))}
				</CardContent>
			</Card>
		);
	}

	const getRoleBadgeVariant = (role: string) => {
		switch (role.toLowerCase()) {
			case "amministratore":
				return "default";
			case "moderatore":
				return "secondary";
			case "membro":
				return "outline";
			default:
				return "outline";
		}
	};

	const getRoleDisplayName = (role: string) => {
		switch (role.toLowerCase()) {
			case "amministratore":
				return "Amministratore";
			case "moderatore":
				return "Moderatore";
			case "membro":
				return "Membro";
			default:
				return role;
		}
	};

	return (
		<Card>
			<CardHeader>
				<div className="flex items-start justify-between">
					<div className="flex items-center space-x-4">
						{organization.logo ? (
							<img
								src={organization.logo}
								alt={organization.name}
								className="h-16 w-16 rounded-full object-cover border-2 border-border"
							/>
						) : (
							<div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
								<Building2 className="h-8 w-8 text-muted-foreground" />
							</div>
						)}
						<div>
							<CardTitle className="text-xl">{organization.name}</CardTitle>
							{showRole && (
								<Badge
									variant={getRoleBadgeVariant(organization.userRole)}
									className="mt-2"
								>
									<User className="h-3 w-3 mr-1" />
									{getRoleDisplayName(organization.userRole)}
								</Badge>
							)}
						</div>
					</div>
				</div>
			</CardHeader>
			<CardContent className="space-y-4">
				{organization.description && (
					<>
						<div>
							<p className="text-sm text-muted-foreground leading-relaxed">
								{organization.description}
							</p>
						</div>
						<Separator />
					</>
				)}

				<div className="space-y-3">
					<h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
						Informazioni di Contatto
					</h4>

					{organization.address && (
						<div className="flex items-start space-x-3">
							<MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
							<span className="text-sm">{organization.address}</span>
						</div>
					)}

					{organization.phone && (
						<div className="flex items-center space-x-3">
							<Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
							<a
								href={`tel:${organization.phone}`}
								className="text-sm hover:underline"
							>
								{organization.phone}
							</a>
						</div>
					)}

					{organization.email && (
						<div className="flex items-center space-x-3">
							<Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
							<a
								href={`mailto:${organization.email}`}
								className="text-sm hover:underline"
							>
								{organization.email}
							</a>
						</div>
					)}

					{organization.website && (
						<div className="flex items-center space-x-3">
							<Globe className="h-4 w-4 text-muted-foreground flex-shrink-0" />
							<a
								href={organization.website}
								target="_blank"
								rel="noopener noreferrer"
								className="text-sm hover:underline flex items-center space-x-1"
							>
								<span>{organization.website}</span>
								<ExternalLink className="h-3 w-3" />
							</a>
						</div>
					)}
				</div>

				{organization.website && (
					<>
						<Separator />
						<div className="flex justify-end">
							<Button variant="outline" size="sm" asChild>
								<a
									href={organization.website}
									target="_blank"
									rel="noopener noreferrer"
									className="flex items-center space-x-2"
								>
									<Globe className="h-4 w-4" />
									<span>Visita il sito web</span>
									<ExternalLink className="h-3 w-3" />
								</a>
							</Button>
						</div>
					</>
				)}
			</CardContent>
		</Card>
	);
}
