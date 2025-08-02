import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createContext, useContext, useEffect, useState } from "react";
import { orpc } from "../lib/orpc-react";
import { toast } from "./use-toast";

// Types for settings
export interface ParishSettings {
	name: string;
	address?: string;
	phone?: string;
	email?: string;
	website?: string;
	logo?: string;
	description?: string;
}

export interface Organization {
	id: string;
	name: string;
	image: string | null;
	role: string;
}

export interface EventSettings {
	defaultMinAge: number;
	defaultMaxAge: number;
	defaultMaxParticipants: number;
	requirePayment: boolean;
	allowWaitlist: boolean;
	autoConfirmRegistrations: boolean;
	registrationDeadlineDays: number;
}

export interface NotificationSettings {
	emailEnabled: boolean;
	smsEnabled: boolean;
	emailTemplates?: {
		welcome?: string;
		eventRegistration?: string;
		eventReminder?: string;
		eventCancellation?: string;
	};
	smsTemplates?: {
		eventRegistration?: string;
		eventReminder?: string;
		eventCancellation?: string;
	};
}

export interface SystemInfo {
	version: string;
	environment: string;
	database: {
		type: string;
		size: string;
		tables: number;
	};
	uptime: string;
	lastBackup?: string;
}

export interface BackupInfo {
	backupId: string;
	filename: string;
	size: number;
	createdAt: string;
}

export interface OrganizationInfo {
	id: string;
	name: string;
	address?: string;
	phone?: string;
	email?: string;
	website?: string;
	logo?: string;
	description?: string;
	userRole: string;
}

// Hook for organizations list
export const useOrganizationsQuery = () => {
	return useQuery({
		queryKey: ["organizations"],
		queryFn: async () => {
			const res = await orpc.settings.listOrganizations();
			return res.data;
		},
	});
};

// Hook for organization info (for regular users)
export const useOrganizationInfoQuery = (organizationId?: string) => {
	return useQuery({
		queryKey: ["organization-info", organizationId],
		queryFn: async () => {
			const res = await orpc.settings.getOrganizationInfo(
				organizationId ? { organizationId } : undefined,
			);
			return res.data;
		},
	});
};

// Hook for organization statistics
export const useOrganizationStatsQuery = (organizationId?: string) => {
	return useQuery({
		queryKey: ["organization-stats", organizationId],
		queryFn: async () => {
			const res = await orpc.settings.getOrganizationStats(
				organizationId ? { organizationId } : undefined,
			);
			return res.data;
		},
		enabled: !!organizationId,
	});
};

// Hook for organization events
export const useOrganizationEventsQuery = (
	organizationId?: string,
	options?: { limit?: number; upcoming?: boolean },
) => {
	return useQuery({
		queryKey: ["organization-events", organizationId, options],
		queryFn: async () => {
			const res = await orpc.settings.getOrganizationEvents({
				organizationId,
				limit: options?.limit || 10,
				upcoming: options?.upcoming !== false,
			});
			return res.data;
		},
		enabled: !!organizationId,
	});
};

// Hook for parish settings
export const useParishSettingsQuery = (organizationId?: string) => {
	return useQuery({
		queryKey: ["parish-settings", organizationId],
		queryFn: async () => {
			const res = await orpc.settings.getParishSettings(
				organizationId ? { organizationId } : undefined,
			);
			return res.data;
		},
	});
};

export const useUpdateParishSettingsMutation = (organizationId?: string) => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (settings: ParishSettings) => {
			const res = await orpc.settings.updateParishSettings({
				...settings,
				organizationId,
			});
			return res.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["parish-settings"] });
			toast({
				title: "Impostazioni salvate",
				description:
					"Le impostazioni della parrocchia sono state aggiornate con successo.",
			});
		},
		onError: () => {
			toast({
				title: "Errore",
				description: "Impossibile salvare le impostazioni. Riprova più tardi.",
				variant: "destructive",
			});
		},
	});
};

// Hook for event settings
export const useEventSettingsQuery = () => {
	return useQuery({
		queryKey: ["event-settings"],
		queryFn: async () => {
			const res = await orpc.settings.getEventSettings();
			return res.data;
		},
	});
};

export const useUpdateEventSettingsMutation = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (settings: EventSettings) => {
			const res = await orpc.settings.updateEventSettings(settings);
			return res.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["event-settings"] });
			toast({
				title: "Impostazioni salvate",
				description:
					"Le impostazioni degli eventi sono state aggiornate con successo.",
			});
		},
		onError: () => {
			toast({
				title: "Errore",
				description: "Impossibile salvare le impostazioni. Riprova più tardi.",
				variant: "destructive",
			});
		},
	});
};

// Hook for notification settings
export const useNotificationSettingsQuery = () => {
	return useQuery({
		queryKey: ["notification-settings"],
		queryFn: async () => {
			const res = await orpc.settings.getNotificationSettings();
			return res.data;
		},
	});
};

export const useUpdateNotificationSettingsMutation = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (settings: NotificationSettings) => {
			const res = await orpc.settings.updateNotificationSettings(settings);
			return res.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["notification-settings"] });
			toast({
				title: "Impostazioni salvate",
				description:
					"Le impostazioni delle notifiche sono state aggiornate con successo.",
			});
		},
		onError: () => {
			toast({
				title: "Errore",
				description: "Impossibile salvare le impostazioni. Riprova più tardi.",
				variant: "destructive",
			});
		},
	});
};

// Hook for system info
export const useSystemInfoQuery = () => {
	return useQuery({
		queryKey: ["system-info"],
		queryFn: async () => {
			const res = await orpc.settings.getSystemInfo();
			return res.data;
		},
		refetchInterval: 60000, // Refresh every minute
	});
};

// Hook for backups
export const useBackupsQuery = () => {
	return useQuery({
		queryKey: ["backups"],
		queryFn: async () => {
			const res = await orpc.settings.listBackups();
			return res.data;
		},
	});
};

export const useCreateBackupMutation = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async () => {
			const res = await orpc.settings.createBackup();
			return res.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["backups"] });
			toast({
				title: "Backup creato",
				description: "Il backup del sistema è stato creato con successo.",
			});
		},
		onError: () => {
			toast({
				title: "Errore",
				description: "Impossibile creare il backup. Riprova più tardi.",
				variant: "destructive",
			});
		},
	});
};

export const useRestoreBackupMutation = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (backupId: string) => {
			const res = await orpc.settings.restoreBackup({ backupId });
			return res.data;
		},
		onSuccess: () => {
			// Invalidate all queries since data might have changed
			queryClient.invalidateQueries();
			toast({
				title: "Backup ripristinato",
				description: "Il backup è stato ripristinato con successo.",
			});
		},
		onError: () => {
			toast({
				title: "Errore",
				description: "Impossibile ripristinare il backup. Riprova più tardi.",
				variant: "destructive",
			});
		},
	});
};

// Utility hook for all settings
export const useAllSettings = (organizationId?: string) => {
	const parishSettings = useParishSettingsQuery(organizationId);
	const eventSettings = useEventSettingsQuery();
	const notificationSettings = useNotificationSettingsQuery();
	const systemInfo = useSystemInfoQuery();

	return {
		parishSettings: parishSettings.data,
		eventSettings: eventSettings.data,
		notificationSettings: notificationSettings.data,
		systemInfo: systemInfo.data,
		isLoading:
			parishSettings.isLoading ||
			eventSettings.isLoading ||
			notificationSettings.isLoading ||
			systemInfo.isLoading,
		error:
			parishSettings.error ||
			eventSettings.error ||
			notificationSettings.error ||
			systemInfo.error,
		refetch: () => {
			parishSettings.refetch();
			eventSettings.refetch();
			notificationSettings.refetch();
			systemInfo.refetch();
		},
	};
};

// Organization context for managing active organization
interface OrganizationContextType {
	activeOrganizationId: string | null;
	setActiveOrganizationId: (id: string | null) => void;
	organizations: Organization[];
	isLoadingOrganizations: boolean;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(
	undefined,
);

export const useOrganizationContext = () => {
	const context = useContext(OrganizationContext);
	if (!context) {
		throw new Error(
			"useOrganizationContext must be used within OrganizationProvider",
		);
	}
	return context;
};

// Hook for managing active organization with localStorage persistence
export const useActiveOrganization = () => {
	const [activeOrganizationId, setActiveOrganizationIdState] = useState<
		string | null
	>(null);
	const organizationsQuery = useOrganizationsQuery();

	// Load from localStorage on mount
	useEffect(() => {
		const saved = localStorage.getItem("activeOrganizationId");
		if (saved) {
			setActiveOrganizationIdState(saved);
		}
	}, []);

	// Auto-select first organization if none selected and organizations are loaded
	useEffect(() => {
		if (
			!activeOrganizationId &&
			organizationsQuery.data &&
			organizationsQuery.data.length > 0
		) {
			const firstOrg = organizationsQuery.data[0];
			setActiveOrganizationIdState(firstOrg.id);
			localStorage.setItem("activeOrganizationId", firstOrg.id);
		}
	}, [activeOrganizationId, organizationsQuery.data]);

	const setActiveOrganizationId = (id: string | null) => {
		setActiveOrganizationIdState(id);
		if (id) {
			localStorage.setItem("activeOrganizationId", id);
		} else {
			localStorage.removeItem("activeOrganizationId");
		}
	};

	return {
		activeOrganizationId,
		setActiveOrganizationId,
		organizations: organizationsQuery.data || [],
		isLoadingOrganizations: organizationsQuery.isLoading,
	};
};
