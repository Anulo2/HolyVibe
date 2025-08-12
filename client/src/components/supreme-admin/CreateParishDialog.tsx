import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	Building2,
	Globe,
	Loader2,
	Mail,
	MapPin,
	Phone,
	User,
} from "lucide-react";
import React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { orpcClient } from "../../lib/orpc-client";
import { Button } from "../ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "../ui/dialog";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "../ui/form";
import { Input } from "../ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../ui/select";
import { Textarea } from "../ui/textarea";

const createParishSchema = z.object({
	name: z.string().min(1, "Il nome della parrocchia è obbligatorio"),
	description: z.string().optional(),
	email: z.string().email("Email non valida").optional().or(z.literal("")),
	phone: z.string().optional(),
	address: z.string().optional(),
	website: z.string().url("URL non valido").optional().or(z.literal("")),
	ownerId: z.string().min(1, "Seleziona un amministratore per la parrocchia"),
});

type CreateParishFormData = z.infer<typeof createParishSchema>;

interface CreateParishDialogProps {
	children: React.ReactNode;
}

export function CreateParishDialog({ children }: CreateParishDialogProps) {
	const queryClient = useQueryClient();

	// Query to get all users for owner selection
	const { data: usersData, isLoading: isLoadingUsers } = useQuery({
		queryKey: ["supreme-admin", "users", "for-selection"],
		queryFn: () =>
			orpcClient.supremeAdmin.getAllUsers({
				page: 1,
				limit: 100, // Get enough users for selection
			}),
	});

	const form = useForm<CreateParishFormData>({
		resolver: zodResolver(createParishSchema),
		defaultValues: {
			name: "",
			description: "",
			email: "",
			phone: "",
			address: "",
			website: "",
			ownerId: "",
		},
	});

	const createParishMutation = useMutation({
		mutationFn: (data: CreateParishFormData) =>
			orpcClient.supremeAdmin.createOrganization(data),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ["supreme-admin", "organizations"],
			});
			toast.success("Parrocchia creata con successo!");
			form.reset();
			setIsOpen(false);
		},
		onError: (error: any) => {
			toast.error(error.message || "Errore nella creazione della parrocchia");
		},
	});

	const [isOpen, setIsOpen] = React.useState(false);

	const onSubmit = (data: CreateParishFormData) => {
		createParishMutation.mutate(data);
	};

	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			<DialogTrigger asChild>{children}</DialogTrigger>
			<DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<Building2 className="h-5 w-5 text-green-600" />
						Crea Nuova Parrocchia
					</DialogTitle>
					<DialogDescription>
						Crea una nuova parrocchia nel sistema. L'utente selezionato come
						proprietario diventerà automaticamente amministratore della
						parrocchia.
					</DialogDescription>
				</DialogHeader>

				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
						{/* Nome Parrocchia */}
						<FormField
							control={form.control}
							name="name"
							render={({ field }) => (
								<FormItem>
									<FormLabel className="flex items-center gap-2">
										<Building2 className="h-4 w-4" />
										Nome Parrocchia *
									</FormLabel>
									<FormControl>
										<Input
											placeholder="es. Parrocchia San Giuseppe"
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						{/* Descrizione */}
						<FormField
							control={form.control}
							name="description"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Descrizione</FormLabel>
									<FormControl>
										<Textarea
											placeholder="Breve descrizione della parrocchia..."
											className="resize-none"
											rows={3}
											{...field}
										/>
									</FormControl>
									<FormDescription>
										Una breve descrizione che apparirà nella lista delle
										parrocchie
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>

						{/* Amministratore */}
						<FormField
							control={form.control}
							name="ownerId"
							render={({ field }) => (
								<FormItem>
									<FormLabel className="flex items-center gap-2">
										<User className="h-4 w-4" />
										Amministratore Parrocchia *
									</FormLabel>
									<Select
										onValueChange={field.onChange}
										defaultValue={field.value}
									>
										<FormControl>
											<SelectTrigger>
												<SelectValue placeholder="Seleziona un utente come amministratore" />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											{isLoadingUsers ? (
												<div className="flex items-center justify-center py-4">
													<Loader2 className="h-4 w-4 animate-spin" />
													<span className="ml-2 text-sm">
														Caricamento utenti...
													</span>
												</div>
											) : (
												usersData?.users.map((user) => (
													<SelectItem key={user.id} value={user.id}>
														<div className="flex items-center gap-2">
															<div className="flex flex-col">
																<span className="font-medium">
																	{user.name || "Nome non disponibile"}
																</span>
																<span className="text-xs text-muted-foreground">
																	{user.email}
																</span>
															</div>
														</div>
													</SelectItem>
												))
											)}
										</SelectContent>
									</Select>
									<FormDescription>
										L'utente selezionato diventerà amministratore della
										parrocchia
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>

						{/* Informazioni di Contatto */}
						<div className="space-y-4">
							<h3 className="text-lg font-medium">Informazioni di Contatto</h3>

							{/* Email */}
							<FormField
								control={form.control}
								name="email"
								render={({ field }) => (
									<FormItem>
										<FormLabel className="flex items-center gap-2">
											<Mail className="h-4 w-4" />
											Email
										</FormLabel>
										<FormControl>
											<Input
												type="email"
												placeholder="info@parrocchia.it"
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							{/* Telefono */}
							<FormField
								control={form.control}
								name="phone"
								render={({ field }) => (
									<FormItem>
										<FormLabel className="flex items-center gap-2">
											<Phone className="h-4 w-4" />
											Telefono
										</FormLabel>
										<FormControl>
											<Input
												type="tel"
												placeholder="+39 123 456 7890"
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							{/* Indirizzo */}
							<FormField
								control={form.control}
								name="address"
								render={({ field }) => (
									<FormItem>
										<FormLabel className="flex items-center gap-2">
											<MapPin className="h-4 w-4" />
											Indirizzo
										</FormLabel>
										<FormControl>
											<Input
												placeholder="Via Roma 123, 00100 Roma RM"
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							{/* Sito Web */}
							<FormField
								control={form.control}
								name="website"
								render={({ field }) => (
									<FormItem>
										<FormLabel className="flex items-center gap-2">
											<Globe className="h-4 w-4" />
											Sito Web
										</FormLabel>
										<FormControl>
											<Input
												type="url"
												placeholder="https://www.parrocchia.it"
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						{/* Buttons */}
						<div className="flex justify-end space-x-3 pt-6 border-t">
							<Button
								type="button"
								variant="outline"
								onClick={() => setIsOpen(false)}
								disabled={createParishMutation.isPending}
							>
								Annulla
							</Button>
							<Button
								type="submit"
								disabled={createParishMutation.isPending}
								className="bg-green-600 hover:bg-green-700"
							>
								{createParishMutation.isPending ? (
									<>
										<Loader2 className="h-4 w-4 animate-spin mr-2" />
										Creando...
									</>
								) : (
									<>
										<Building2 className="h-4 w-4 mr-2" />
										Crea Parrocchia
									</>
								)}
							</Button>
						</div>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
