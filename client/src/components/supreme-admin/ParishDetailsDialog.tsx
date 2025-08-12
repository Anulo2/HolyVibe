import { format } from "date-fns";
import { it } from "date-fns/locale";
import {
	Building2,
	Calendar,
	Globe,
	Mail,
	MapPin,
	Phone,
	Shield,
	User,
	Users,
} from "lucide-react";
import type React from "react";
import { Badge } from "../ui/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "../ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "../ui/dialog";
import { Separator } from "../ui/separator";

interface Organization {
	id: string;
	name: string;
	description: string | null;
	email: string | null;
	phone: string | null;
	address: string | null;
	website: string | null;
	image: string | null;
	ownerId: string;
	createdAt: string;
	memberCount: number;
	eventCount: number;
}

interface ParishDetailsDialogProps {
	children: React.ReactNode;
	organization: Organization | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function ParishDetailsDialog({
	children,
	organization,
	open,
	onOpenChange,
}: ParishDetailsDialogProps) {
	// Query to get owner details - TEMPORANEAMENTE COMMENTATO
	// const { data: ownerData, isLoading: isLoadingOwner } = useQuery({
	//   queryKey: ["supreme-admin", "user-details", organization?.ownerId],
	//   queryFn: () =>
	//     organization?.ownerId
	//       ? orpcClient.supremeAdmin.getUserDetails({
	//           userId: organization.ownerId,
	//         })
	//       : Promise.resolve(null),
	//   enabled: !!organization?.ownerId,
	// });

	// Debug: log the owner data structure
	// console.log("Owner data:", ownerData);

	if (!organization) {
		return (
			<Dialog open={open} onOpenChange={onOpenChange}>
				<DialogTrigger asChild>{children}</DialogTrigger>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Errore</DialogTitle>
						<DialogDescription>
							Impossibile caricare i dettagli della parrocchia.
						</DialogDescription>
					</DialogHeader>
				</DialogContent>
			</Dialog>
		);
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogTrigger asChild>{children}</DialogTrigger>
			<DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<Building2 className="h-5 w-5 text-green-600" />
						Dettagli Parrocchia
					</DialogTitle>
					<DialogDescription>
						Informazioni complete sulla parrocchia {organization.name}
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-6">
					{/* Intestazione con info principale */}
					<Card>
						<CardHeader>
							<div className="flex items-start gap-4">
								<div className="h-16 w-16 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
									{organization.image ? (
										<img
											src={organization.image}
											alt={organization.name}
											className="h-16 w-16 rounded-lg object-cover"
										/>
									) : (
										<Building2 className="h-8 w-8 text-green-600" />
									)}
								</div>
								<div className="flex-1 min-w-0">
									<CardTitle className="text-xl">{organization.name}</CardTitle>
									{organization.description && (
										<CardDescription className="mt-2 text-sm">
											{organization.description}
										</CardDescription>
									)}
									<div className="flex items-center gap-4 mt-3">
										<Badge
											variant="secondary"
											className="bg-green-100 text-green-800"
										>
											<Shield className="h-3 w-3 mr-1" />
											Parrocchia
										</Badge>
										<span className="text-xs text-muted-foreground">
											Creata il{" "}
											{format(
												new Date(organization.createdAt),
												"dd MMMM yyyy",
												{ locale: it },
											)}
										</span>
									</div>
								</div>
							</div>
						</CardHeader>
					</Card>

					{/* Statistiche */}
					<div className="grid grid-cols-2 gap-4">
						<Card>
							<CardContent className="pt-6">
								<div className="flex items-center gap-3">
									<div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
										<Users className="h-5 w-5 text-blue-600" />
									</div>
									<div>
										<p className="text-2xl font-bold">
											{organization.memberCount}
										</p>
										<p className="text-sm text-muted-foreground">
											Membri attivi
										</p>
									</div>
								</div>
							</CardContent>
						</Card>
						<Card>
							<CardContent className="pt-6">
								<div className="flex items-center gap-3">
									<div className="h-10 w-10 bg-orange-100 rounded-lg flex items-center justify-center">
										<Calendar className="h-5 w-5 text-orange-600" />
									</div>
									<div>
										<p className="text-2xl font-bold">
											{organization.eventCount}
										</p>
										<p className="text-sm text-muted-foreground">
											Eventi totali
										</p>
									</div>
								</div>
							</CardContent>
						</Card>
					</div>

					{/* Informazioni di contatto */}
					<Card>
						<CardHeader>
							<CardTitle className="text-lg flex items-center gap-2">
								<Phone className="h-4 w-4" />
								Informazioni di Contatto
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							{organization.email && (
								<div className="flex items-center gap-3">
									<div className="h-8 w-8 bg-gray-100 rounded flex items-center justify-center">
										<Mail className="h-4 w-4 text-gray-600" />
									</div>
									<div className="flex-1">
										<p className="text-sm font-medium">Email</p>
										<p className="text-sm text-muted-foreground">
											{organization.email}
										</p>
									</div>
								</div>
							)}

							{organization.phone && (
								<div className="flex items-center gap-3">
									<div className="h-8 w-8 bg-gray-100 rounded flex items-center justify-center">
										<Phone className="h-4 w-4 text-gray-600" />
									</div>
									<div className="flex-1">
										<p className="text-sm font-medium">Telefono</p>
										<p className="text-sm text-muted-foreground">
											{organization.phone}
										</p>
									</div>
								</div>
							)}

							{organization.address && (
								<div className="flex items-center gap-3">
									<div className="h-8 w-8 bg-gray-100 rounded flex items-center justify-center">
										<MapPin className="h-4 w-4 text-gray-600" />
									</div>
									<div className="flex-1">
										<p className="text-sm font-medium">Indirizzo</p>
										<p className="text-sm text-muted-foreground">
											{organization.address}
										</p>
									</div>
								</div>
							)}

							{organization.website && (
								<div className="flex items-center gap-3">
									<div className="h-8 w-8 bg-gray-100 rounded flex items-center justify-center">
										<Globe className="h-4 w-4 text-gray-600" />
									</div>
									<div className="flex-1">
										<p className="text-sm font-medium">Sito Web</p>
										<a
											href={organization.website}
											target="_blank"
											rel="noopener noreferrer"
											className="text-sm text-blue-600 hover:underline"
										>
											{organization.website}
										</a>
									</div>
								</div>
							)}

							{!organization.email &&
								!organization.phone &&
								!organization.address &&
								!organization.website && (
									<div className="text-center py-8">
										<p className="text-muted-foreground">
											Nessuna informazione di contatto disponibile
										</p>
									</div>
								)}
						</CardContent>
					</Card>

					{/* Informazioni amministrative */}
					<Card>
						<CardHeader>
							<CardTitle className="text-lg flex items-center gap-2">
								<User className="h-4 w-4" />
								Informazioni Amministrative
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="grid grid-cols-2 gap-4">
								<div>
									<p className="text-sm font-medium text-muted-foreground">
										ID Parrocchia
									</p>
									<p className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
										{organization.id}
									</p>
								</div>
								<div>
									<p className="text-sm font-medium text-muted-foreground">
										ID Proprietario
									</p>
									<p className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
										{organization.ownerId}
									</p>
								</div>
							</div>

							<Separator />

							<div className="grid grid-cols-2 gap-4">
								<div>
									<p className="text-sm font-medium text-muted-foreground">
										Data Creazione
									</p>
									<p className="text-sm">
										{format(
											new Date(organization.createdAt),
											"dd/MM/yyyy 'alle' HH:mm",
											{
												locale: it,
											},
										)}
									</p>
								</div>
								<div>
									<p className="text-sm font-medium text-muted-foreground">
										Stato
									</p>
									<Badge
										variant="outline"
										className="text-green-600 border-green-200"
									>
										Attiva
									</Badge>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>
			</DialogContent>
		</Dialog>
	);
}
