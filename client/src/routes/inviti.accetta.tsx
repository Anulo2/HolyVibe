import { createFileRoute } from "@tanstack/react-router";
import { AlertCircle, CheckCircle, Loader2, UserPlus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	useAcceptInvitationMutation,
	useInvitationDetailsQuery,
} from "@/hooks/useFamily";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/inviti/accetta")({
	validateSearch: (search: Record<string, unknown>) => {
		return {
			token: (search.token as string) || "",
		};
	},
	component: InvitationAcceptancePage,
});

function InvitationAcceptancePage() {
	const { token } = Route.useSearch();
	const [status, setStatus] = useState<
		"loading" | "success" | "error" | "expired" | "login-required"
	>("loading");
	const [errorMessage, setErrorMessage] = useState<string>("");
	const hasPromptedRef = useRef(false);

	// Get current session
	const session = authClient.useSession();

	// Get invitation details (public endpoint)
	const { data: invitationDetails, error: detailsError } =
		useInvitationDetailsQuery(token);

	// Accept invitation mutation (requires auth)
	const acceptInvitationMutation = useAcceptInvitationMutation();

	useEffect(() => {
		if (!token) {
			setStatus("error");
			setErrorMessage("Token di invito mancante");
			return;
		}

		// If we have invitation details
		if (invitationDetails) {
			// Check if invitation is expired
			if (invitationDetails.isExpired) {
				setStatus("expired");
				setErrorMessage("Questo invito è scaduto. Richiedi un nuovo invito.");
				return;
			}

			// Check if user is authenticated
			if (!session.data?.user) {
				setStatus("login-required");
				return;
			}

			// Prompt explicit Sonner confirmation instead of auto-accept
			if (!hasPromptedRef.current) {
				hasPromptedRef.current = true;
				setStatus("loading");
				toast(
					`Invito a unirti alla famiglia "${invitationDetails.familyName}"`,
					{
						description:
							invitationDetails.message ||
							"Clicca Accetta per entrare nella famiglia.",
						action: {
							label: "Accetta invito",
							onClick: () => {
								acceptInvitationMutation.mutate(
									{ token },
									{
										onSuccess: (data) => {
											setStatus("success");
											toast.success(
												`Sei stato aggiunto alla famiglia "${data.familyName}"!`,
											);
										},
										onError: (error: unknown) => {
											const message =
												error instanceof Error ? error.message : String(error);
											console.error("Error accepting invitation:", error);
											if (
												message.includes("GONE") ||
												message.includes("expired")
											) {
												setStatus("expired");
												setErrorMessage(
													"Questo invito è scaduto. Richiedi un nuovo invito.",
												);
											} else if (message.includes("NOT_FOUND")) {
												setStatus("error");
												setErrorMessage("Invito non valido o già utilizzato.");
											} else if (message.includes("CONFLICT")) {
												setStatus("error");
												setErrorMessage("Sei già membro di questa famiglia.");
											} else if (message.includes("FORBIDDEN")) {
												setStatus("error");
												setErrorMessage(
													"Questo invito non è destinato al tuo account.",
												);
											} else {
												setStatus("error");
												setErrorMessage(
													"Errore durante l'accettazione dell'invito. Riprova più tardi.",
												);
											}
										},
									},
								);
							},
						},
					},
				);
				// Provide a separate quick cancel option as another toast
				toast("Vuoi rifiutare questo invito?", {
					description: "Puoi sempre chiedere un nuovo invito in seguito.",
					action: {
						label: "Rifiuta",
						onClick: () => {
							setStatus("error");
							setErrorMessage("Hai rifiutato l'invito.");
						},
					},
				});
			}
		}

		// Handle errors getting invitation details
		if (detailsError) {
			console.error("Error getting invitation details:", detailsError);
			setStatus("error");
			setErrorMessage("Invito non valido o già utilizzato.");
		}
	}, [
		token,
		invitationDetails,
		session.data?.user,
		acceptInvitationMutation,
		detailsError,
	]);

	const handleGoToDashboard = () => {
		window.location.href = "/dashboard";
	};

	const handleGoToLogin = () => {
		// Redirect to login with invitation token as redirect parameter
		window.location.href = `/login?redirect=${encodeURIComponent(window.location.href)}`;
	};

	return (
		<div className="flex min-h-screen items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8">
			<Card className="w-full max-w-md">
				<CardHeader className="text-center">
					<CardTitle className="text-2xl font-bold">
						{status === "loading" && "Caricamento invito..."}
						{status === "login-required" && "Accedi per continuare"}
						{status === "success" && "Invito accettato!"}
						{status === "error" && "Errore nell'invito"}
						{status === "expired" && "Invito scaduto"}
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-6">
					<div className="flex justify-center">
						{status === "loading" && (
							<Loader2 className="h-16 w-16 animate-spin text-primary" />
						)}
						{status === "login-required" && (
							<UserPlus className="h-16 w-16 text-blue-500" />
						)}
						{status === "success" && (
							<CheckCircle className="h-16 w-16 text-green-500" />
						)}
						{(status === "error" || status === "expired") && (
							<AlertCircle className="h-16 w-16 text-red-500" />
						)}
					</div>

					<div className="text-center space-y-2">
						{status === "loading" && (
							<p className="text-muted-foreground">
								Stiamo caricando i dettagli dell'invito...
							</p>
						)}
						{status === "login-required" && (
							<div className="space-y-2">
								<p className="text-blue-600 font-medium">
									Sei stato invitato a unirti alla famiglia "
									{invitationDetails?.familyName}".
								</p>
								{invitationDetails?.message && (
									<p className="text-sm text-muted-foreground italic">
										"{invitationDetails.message}"
									</p>
								)}
								<p className="text-sm text-muted-foreground">
									Effettua l'accesso per accettare l'invito.
								</p>
							</div>
						)}
						{status === "success" && (
							<div className="space-y-2">
								<p className="text-green-600 font-medium">
									Congratulazioni! Sei stato aggiunto con successo alla
									famiglia.
								</p>
								{invitationDetails?.familyName && (
									<p className="text-sm text-muted-foreground">
										Famiglia:{" "}
										<span className="font-medium">
											{invitationDetails.familyName}
										</span>
									</p>
								)}
							</div>
						)}
						{(status === "error" || status === "expired") && (
							<p className="text-red-600">{errorMessage}</p>
						)}
					</div>

					<div className="flex flex-col space-y-2">
						{status === "login-required" && (
							<Button onClick={handleGoToLogin} className="w-full">
								Accedi al tuo account
							</Button>
						)}
						{status === "success" && (
							<Button onClick={handleGoToDashboard} className="w-full">
								Vai alla Dashboard
							</Button>
						)}
						{(status === "error" || status === "expired") && (
							<>
								<Button onClick={handleGoToLogin} className="w-full">
									Accedi al tuo account
								</Button>
								<Button
									variant="outline"
									onClick={() => {
										window.location.href = "/";
									}}
									className="w-full"
								>
									Torna alla Home
								</Button>
							</>
						)}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
