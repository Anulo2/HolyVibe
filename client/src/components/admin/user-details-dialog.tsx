import { format } from "date-fns";
import { it } from "date-fns/locale";
import {
	Calendar,
	Mail,
	Phone,
	Shield,
	User,
	UserCheck,
	UserX,
} from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
	type UserWithRole,
	useRemoveUserFromOrganizationMutation,
	useUpdateUserRoleMutation,
} from "@/hooks/useUsersQuery";
import {
	getRoleColor,
	getRoleLabel,
	roleOptions,
} from "@/lib/users-table-config";
import { cn } from "@/lib/utils";

interface UserDetailsDialogProps {
	user: UserWithRole | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function UserDetailsDialog({
	user,
	open,
	onOpenChange,
}: UserDetailsDialogProps) {
	const [selectedRole, setSelectedRole] = useState<string>("");
	const [isEditing, setIsEditing] = useState(false);

	const updateUserRoleMutation = useUpdateUserRoleMutation();
	const removeUserMutation = useRemoveUserFromOrganizationMutation();

	// Initialize form when user data loads
	React.useEffect(() => {
		if (user) {
			setSelectedRole(user.role || "genitore");
		}
	}, [user]);

	const handleSaveRole = async () => {
		if (!user) return;

		try {
			await updateUserRoleMutation.mutateAsync({
				userId: user.id,
				role: selectedRole,
			});

			setIsEditing(false);
			toast.success("Ruolo utente aggiornato con successo");
		} catch (error) {
			toast.error("Errore nell'aggiornamento del ruolo");
		}
	};

	const handleRemoveUser = async () => {
		if (!user) return;

		const confirmed = window.confirm(
			"Sei sicuro di voler rimuovere questo utente dall'organizzazione?",
		);

		if (confirmed) {
			try {
				await removeUserMutation.mutateAsync(user.id);
				onOpenChange(false);
				toast.success("Utente rimosso dall'organizzazione");
			} catch (error) {
				toast.error("Errore nella rimozione dell'utente");
			}
		}
	};

	const handleCancel = () => {
		if (user) {
			setSelectedRole(user.role || "genitore");
		}
		setIsEditing(false);
	};

	if (!user) return null;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<User className="h-5 w-5" />
						Dettagli Utente
					</DialogTitle>
				</DialogHeader>

				<div className="space-y-6">
					{/* User Info Header */}
					<div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
						<Avatar className="h-16 w-16">
							<AvatarFallback className="text-lg">
								{user.name
									? user.name
											.split(" ")
											.map((n) => n[0])
											.join("")
											.toUpperCase()
									: user.email[0].toUpperCase()}
							</AvatarFallback>
						</Avatar>
						<div className="flex-1 space-y-1">
							<h3 className="text-lg font-semibold">
								{user.name || "Nome non specificato"}
							</h3>
							<p className="text-sm text-muted-foreground flex items-center gap-2">
								<Mail className="h-4 w-4" />
								{user.email}
							</p>
							{user.phoneNumber && (
								<p className="text-sm text-muted-foreground flex items-center gap-2">
									<Phone className="h-4 w-4" />
									{user.phoneNumber}
								</p>
							)}
						</div>
						<div className="text-right">
							<Badge className={cn("mb-2", getRoleColor(user.role))}>
								<Shield className="h-3 w-3 mr-1" />
								{getRoleLabel(user.role)}
							</Badge>
							<p className="text-xs text-muted-foreground">
								{user.role ? "Membro attivo" : "Non membro"}
							</p>
						</div>
					</div>

					{/* User Details */}
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<Card>
							<CardHeader className="pb-3">
								<CardTitle className="text-sm flex items-center gap-2">
									<Calendar className="h-4 w-4" />
									Date Importanti
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-3">
								<div>
									<Label className="text-xs text-muted-foreground">
										Registrazione
									</Label>
									<p className="text-sm font-medium">
										{format(new Date(user.createdAt), "dd MMM yyyy", {
											locale: it,
										})}
									</p>
								</div>
								{user.joinedAt && (
									<div>
										<Label className="text-xs text-muted-foreground">
											Ingresso Organizzazione
										</Label>
										<p className="text-sm font-medium">
											{format(new Date(user.joinedAt), "dd MMM yyyy", {
												locale: it,
											})}
										</p>
									</div>
								)}
								{user.birthDate && (
									<div>
										<Label className="text-xs text-muted-foreground">
											Data di Nascita
										</Label>
										<p className="text-sm font-medium">
											{format(new Date(user.birthDate), "dd MMM yyyy", {
												locale: it,
											})}
										</p>
									</div>
								)}
							</CardContent>
						</Card>

						<Card>
							<CardHeader className="pb-3">
								<CardTitle className="text-sm flex items-center gap-2">
									<Shield className="h-4 w-4" />
									Gestione Ruolo
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="space-y-2">
									<Label className="text-xs text-muted-foreground">
										Ruolo Attuale
									</Label>
									<Badge className={getRoleColor(user.role)}>
										{getRoleLabel(user.role)}
									</Badge>
								</div>

								{!isEditing ? (
									<Button
										size="sm"
										variant="outline"
										onClick={() => setIsEditing(true)}
										className="w-full"
									>
										<UserCheck className="h-4 w-4 mr-2" />
										Modifica Ruolo
									</Button>
								) : (
									<div className="space-y-3">
										<div>
											<Label className="text-xs text-muted-foreground">
												Nuovo Ruolo
											</Label>
											<Select
												value={selectedRole}
												onValueChange={setSelectedRole}
											>
												<SelectTrigger>
													<SelectValue placeholder="Seleziona ruolo" />
												</SelectTrigger>
												<SelectContent>
													{roleOptions.map((role) => (
														<SelectItem key={role.value} value={role.value}>
															<div className="flex items-center gap-2">
																<role.icon className="h-4 w-4" />
																{role.label}
															</div>
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										</div>
										<div className="flex gap-2">
											<Button
												size="sm"
												variant="outline"
												onClick={handleCancel}
												className="flex-1"
											>
												Annulla
											</Button>
											<Button
												size="sm"
												onClick={handleSaveRole}
												disabled={updateUserRoleMutation.isPending}
												className="flex-1"
											>
												{updateUserRoleMutation.isPending ? "..." : "Salva"}
											</Button>
										</div>
									</div>
								)}
							</CardContent>
						</Card>
					</div>

					{/* Danger Zone */}
					{user.role && (
						<>
							<Separator />
							<Card className="border-destructive/50">
								<CardHeader className="pb-3">
									<CardTitle className="text-sm flex items-center gap-2 text-destructive">
										<UserX className="h-4 w-4" />
										Zona Pericolosa
									</CardTitle>
								</CardHeader>
								<CardContent>
									<p className="text-sm text-muted-foreground mb-3">
										Rimuovi questo utente dall'organizzazione. Questa azione non
										può essere annullata.
									</p>
									<Button
										size="sm"
										variant="destructive"
										onClick={handleRemoveUser}
										disabled={removeUserMutation.isPending}
									>
										<UserX className="h-4 w-4 mr-2" />
										{removeUserMutation.isPending
											? "Rimozione..."
											: "Rimuovi dall'Organizzazione"}
									</Button>
								</CardContent>
							</Card>
						</>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}
