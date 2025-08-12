"use client";

import { AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";

interface CancelRegistrationDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onConfirm: () => void;
	childName: string;
	eventName: string;
	isLoading?: boolean;
}

export function CancelRegistrationDialog({
	open,
	onOpenChange,
	onConfirm,
	childName,
	eventName,
	isLoading = false,
}: CancelRegistrationDialogProps) {
	const handleConfirm = () => {
		onConfirm();
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2 text-red-600">
						<AlertTriangle className="h-5 w-5" />
						Conferma Annullamento
					</DialogTitle>
					<DialogDescription className="text-left">
						Sei sicuro di voler annullare l'iscrizione di{" "}
						<span className="font-semibold">{childName}</span> all'evento{" "}
						<span className="font-semibold">{eventName}</span>?
					</DialogDescription>
				</DialogHeader>

				<div className="rounded-md bg-amber-50 p-4 border border-amber-200">
					<div className="flex">
						<AlertTriangle className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
						<div className="ml-3">
							<h3 className="text-sm font-medium text-amber-800">Attenzione</h3>
							<div className="mt-2 text-sm text-amber-700">
								<ul className="list-disc list-inside space-y-1">
									<li>Questa azione non può essere annullata</li>
									<li>Dovrai rifare l'iscrizione se cambi idea</li>
									<li>Il posto potrebbe non essere più disponibile</li>
								</ul>
							</div>
						</div>
					</div>
				</div>

				<DialogFooter className="gap-2">
					<Button
						variant="outline"
						onClick={() => onOpenChange(false)}
						disabled={isLoading}
					>
						<X className="h-4 w-4 mr-2" />
						Annulla
					</Button>
					<Button
						variant="destructive"
						onClick={handleConfirm}
						disabled={isLoading}
					>
						{isLoading ? (
							<>
								<div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
								Annullando...
							</>
						) : (
							<>
								<AlertTriangle className="h-4 w-4 mr-2" />
								Conferma Annullamento
							</>
						)}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
