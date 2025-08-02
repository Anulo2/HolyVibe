"use client";

import { toast as sonnerToast } from "sonner";

type ToastProps = {
	title?: string;
	description?: string;
	variant?: "default" | "destructive";
	action?: {
		label: string;
		onClick: () => void;
	};
};

export function toast({
	title,
	description,
	variant = "default",
	action,
}: ToastProps) {
	if (variant === "destructive") {
		return sonnerToast.error(title || "Error", {
			description,
			action: action
				? {
						label: action.label,
						onClick: action.onClick,
					}
				: undefined,
		});
	}

	return sonnerToast(title || "Notification", {
		description,
		action: action
			? {
					label: action.label,
					onClick: action.onClick,
				}
			: undefined,
	});
}

export function useToast() {
	return {
		toast,
		dismiss: sonnerToast.dismiss,
	};
}
