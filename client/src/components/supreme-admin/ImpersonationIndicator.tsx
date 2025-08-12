import { AlertTriangle, User, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { authClient } from "@/lib/auth-client";

export function ImpersonationIndicator() {
	const { data: session } = authClient.useSession();

	// Check if currently impersonating (better-auth adds impersonatedBy field when impersonating)
	const isImpersonating = !!(session?.session as any)?.impersonatedBy;
	const impersonatedUser = isImpersonating ? session?.user : null;

	const handleStopImpersonation = async () => {
		try {
			await authClient.admin.stopImpersonating();
			// Refresh page to reload with Supreme Admin session
			window.location.reload();
			toast.success("Impersonazione terminata");
		} catch (error: any) {
			toast.error(error.message || "Errore nel terminare l'impersonazione");
		}
	};

	if (!isImpersonating) {
		return null;
	}

	return (
		<Card className="fixed top-4 right-4 z-50 bg-orange-50 border-orange-200 shadow-lg">
			<CardContent className="p-4">
				<div className="flex items-center gap-3">
					<div className="flex items-center gap-2 text-orange-700">
						<AlertTriangle className="h-5 w-5" />
						<span className="font-medium">Modalità Impersonazione</span>
					</div>

					<div className="flex items-center gap-2 text-gray-600">
						<User className="h-4 w-4" />
						<span className="text-sm">
							{impersonatedUser?.name ||
								impersonatedUser?.email ||
								impersonatedUser?.phoneNumber}
						</span>
					</div>

					<Button
						size="sm"
						variant="outline"
						onClick={handleStopImpersonation}
						className="ml-2 border-orange-300 text-orange-700 hover:bg-orange-100"
					>
						<X className="h-4 w-4 mr-1" />
						Termina
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}
