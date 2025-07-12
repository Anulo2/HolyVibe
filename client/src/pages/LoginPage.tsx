import { useNavigate } from "@tanstack/react-router";
import { useId, useState } from "react";
import { toast } from "sonner";
import { authClient } from "../lib/auth-client";
import { orpcClient } from "../lib/orpc-client";

interface LoginPageProps {
	redirectUrl?: string;
}

export default function LoginPage({ redirectUrl }: LoginPageProps) {
	const phoneId = useId();
	const otpId = useId();
	const emailId = useId();
	const nameId = useId();
	const navigate = useNavigate();
	const [phoneNumber, setPhoneNumber] = useState("");
	const [otp, setOtp] = useState("");
	const [email, setEmail] = useState("");
	const [name, setName] = useState("");
	const [step, setStep] = useState<"phone" | "otp" | "email">("phone");
	const [isLoading, setIsLoading] = useState(false);
	const [isNewUser, setIsNewUser] = useState(false);

	const handleSendOtp = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!phoneNumber.trim()) {
			toast.error("Inserisci un numero di telefono valido");
			return;
		}

		setIsLoading(true);
		try {
			await authClient.phoneNumber.sendOtp({
				phoneNumber: phoneNumber.trim(),
			});
			setStep("otp");
			toast.success(
				"Codice OTP inviato! Controlla i log del server per il codice.",
			);
		} catch (error) {
			console.error("Error sending OTP:", error);
			toast.error("Errore nell'invio del codice OTP");
		} finally {
			setIsLoading(false);
		}
	};

	const handleVerifyOtp = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!otp.trim()) {
			toast.error("Inserisci il codice OTP");
			return;
		}

		setIsLoading(true);
		try {
			const result = await authClient.phoneNumber.verify({
				phoneNumber,
				code: otp.trim(),
			});

			console.log("OTP Verification result:", result);

			if (result.data) {
				// Check if this is a new user registration
				if (result.data.user && !result.data.user.email?.includes('@family-app.com')) {
					// Existing user with real email - proceed to redirect URL or dashboard
					toast.success("Accesso effettuato con successo!");
					setTimeout(() => {
						if (redirectUrl) {
							window.location.href = redirectUrl;
						} else {
							navigate({ to: "/dashboard" });
						}
					}, 100);
				} else {
					// New user or user with temporary email - collect email
					setIsNewUser(true);
					setStep("email");
				}
			} else {
				toast.error("Codice OTP non valido");
			}
		} catch (error) {
			console.error("Error verifying OTP:", error);
			toast.error("Errore nella verifica del codice OTP");
		} finally {
			setIsLoading(false);
		}
	};

	const handleCompleteRegistration = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!email.trim() || !name.trim()) {
			toast.error("Email e nome sono richiesti");
			return;
		}

		setIsLoading(true);
		try {
			// Update user profile with real email and name
			const result = await orpcClient.user.updateProfile({
				email: email.trim(),
				name: name.trim(),
			});

			if (result.success) {
				toast.success("Registrazione completata con successo!");
				setTimeout(() => {
					if (redirectUrl) {
						window.location.href = redirectUrl;
					} else {
						navigate({ to: "/dashboard" });
					}
				}, 100);
			} else {
				toast.error("Errore durante la registrazione");
			}
		} catch (error) {
			console.error("Error completing registration:", error);
			toast.error("Errore durante la registrazione");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="flex min-h-screen items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8">
			<div className="w-full max-w-md space-y-8">
				<div>
					<h2 className="mt-6 text-center text-3xl font-bold tracking-tight">
						Accedi al tuo account
					</h2>
					<p className="mt-2 text-center text-sm text-muted-foreground">
						Usa il tuo numero di telefono per accedere
					</p>
				</div>

				{step === "phone" ? (
					<form className="mt-8 space-y-6" onSubmit={handleSendOtp}>
						<div>
							<label htmlFor={phoneId} className="sr-only">
								Numero di telefono
							</label>
							<input
								id={phoneId}
								name="phone"
								type="tel"
								required
								className="relative block w-full rounded-md border border-input bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus:z-10 focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
								placeholder="Numero di telefono (es. +39 123 456 7890)"
								value={phoneNumber}
								onChange={(e) => setPhoneNumber(e.target.value)}
							/>
						</div>

						<div>
							<button
								type="submit"
								disabled={isLoading}
								className="group relative flex w-full justify-center rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-50"
							>
								{isLoading ? "Invio in corso..." : "Invia codice OTP"}
							</button>
						</div>
					</form>
				) : step === "otp" ? (
					<form className="mt-8 space-y-6" onSubmit={handleVerifyOtp}>
						<div>
							<label htmlFor={otpId} className="sr-only">
								Codice OTP
							</label>
							<input
								id={otpId}
								name="otp"
								type="text"
								required
								className="relative block w-full rounded-md border border-input bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus:z-10 focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
								placeholder="Inserisci il codice OTP a 6 cifre"
								value={otp}
								onChange={(e) => setOtp(e.target.value)}
								maxLength={6}
							/>
						</div>

						<div className="flex space-x-4">
							<button
								type="button"
								onClick={() => setStep("phone")}
								className="flex w-full justify-center rounded-md bg-secondary px-3 py-2 text-sm font-semibold text-secondary-foreground hover:bg-secondary/80"
							>
								Indietro
							</button>
							<button
								type="submit"
								disabled={isLoading}
								className="flex w-full justify-center rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-50"
							>
								{isLoading ? "Verifica..." : "Verifica codice"}
							</button>
						</div>

						<div className="text-center">
							<p className="text-sm text-muted-foreground">
								Codice inviato a:{" "}
								<span className="font-medium">{phoneNumber}</span>
							</p>
							<button
								type="button"
								onClick={handleSendOtp}
								className="mt-2 text-sm text-primary hover:text-primary/80"
							>
								Invia nuovamente il codice
							</button>
						</div>
					</form>
				) : (
					<form className="mt-8 space-y-6" onSubmit={handleCompleteRegistration}>
						<div className="text-center mb-4">
							<h3 className="text-lg font-medium">Completa la registrazione</h3>
							<p className="text-sm text-muted-foreground">
								Inserisci la tua email e nome per completare la registrazione
							</p>
						</div>

						<div>
							<label htmlFor={emailId} className="sr-only">
								Email
							</label>
							<input
								id={emailId}
								name="email"
								type="email"
								required
								className="relative block w-full rounded-md border border-input bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus:z-10 focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
								placeholder="La tua email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
							/>
						</div>

						<div>
							<label htmlFor={nameId} className="sr-only">
								Nome
							</label>
							<input
								id={nameId}
								name="name"
								type="text"
								required
								className="relative block w-full rounded-md border border-input bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus:z-10 focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
								placeholder="Il tuo nome"
								value={name}
								onChange={(e) => setName(e.target.value)}
							/>
						</div>

						<div className="flex space-x-4">
							<button
								type="button"
								onClick={() => setStep("otp")}
								className="flex w-full justify-center rounded-md bg-secondary px-3 py-2 text-sm font-semibold text-secondary-foreground hover:bg-secondary/80"
							>
								Indietro
							</button>
							<button
								type="submit"
								disabled={isLoading}
								className="flex w-full justify-center rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-50"
							>
								{isLoading ? "Completamento..." : "Completa registrazione"}
							</button>
						</div>
					</form>
				)}

				<div className="mt-6 text-center">
					<p className="text-xs text-muted-foreground">
						Per sviluppo: Il codice OTP viene visualizzato nella console del
						server
					</p>
				</div>
			</div>
		</div>
	);
}
