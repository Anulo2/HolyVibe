import { Link, useNavigate } from "@tanstack/react-router";
import { Loader2, LogOut } from "lucide-react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";

interface HeaderProps {
	currentUser?: {
		name?: string | null;
		phoneNumber?: string | null;
	};
	isLoading?: boolean;
}

export function Header({ currentUser, isLoading = false }: HeaderProps) {
	const navigate = useNavigate();

	const handleSignOut = async () => {
		try {
			await authClient.signOut();
			toast.success("Disconnesso con successo");
			navigate({ to: "/login" });
		} catch (error) {
			toast.error("Errore durante la disconnessione");
		}
	};

	return (
		<header className="border-b bg-card">
			<div className="container mx-auto flex h-16 items-center justify-between px-4">
				<div className="flex items-center space-x-4">
					<Link to="/dashboard" className="text-xl font-bold hover:text-primary">
						Family Management
					</Link>
					{isLoading && (
						<Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
					)}
				</div>

				<div className="flex items-center space-x-4">
					<span className="text-sm text-muted-foreground">
						Ciao, {currentUser?.name || currentUser?.phoneNumber}
					</span>
					<button
						type="button"
						onClick={handleSignOut}
						className="flex items-center space-x-2 rounded-md px-3 py-2 text-sm hover:bg-accent"
					>
						<LogOut size={16} />
						<span>Esci</span>
					</button>
				</div>
			</div>
		</header>
	);
} 