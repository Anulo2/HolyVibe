import {
	AlertCircle,
	Calendar,
	CheckCircle,
	Clock,
	CreditCard,
	User,
	Users,
	X,
} from "lucide-react";
import type {
	ColumnConfig,
	ColumnOption,
} from "@/components/data-table-filter";
import type { RegistrationWithDetails } from "@/hooks/useRegistrationsQuery";

// Status options for registration status
export const statusOptions: ColumnOption[] = [
	{
		label: "In attesa",
		value: "pending",
		icon: Clock,
	},
	{
		label: "Confermata",
		value: "confirmed",
		icon: CheckCircle,
	},
	{
		label: "Cancellata",
		value: "cancelled",
		icon: X,
	},
	{
		label: "Lista d'attesa",
		value: "waitlist",
		icon: AlertCircle,
	},
];

// Payment status options
export const paymentStatusOptions: ColumnOption[] = [
	{
		label: "In attesa",
		value: "pending",
		icon: Clock,
	},
	{
		label: "Pagato",
		value: "completed",
		icon: CheckCircle,
	},
	{
		label: "Fallito",
		value: "failed",
		icon: X,
	},
	{
		label: "Rimborsato",
		value: "refunded",
		icon: CreditCard,
	},
];

// Column configurations for the data table filters
export const registrationsColumnsConfig: ColumnConfig<RegistrationWithDetails>[] =
	[
		// Child name filter (text)
		{
			id: "childName",
			accessor: (row) => `${row.child.firstName} ${row.child.lastName}`,
			displayName: "Nome Bambino",
			icon: User,
			type: "text",
		},

		// Parent name filter (text)
		{
			id: "parentName",
			accessor: (row) => row.parent.name,
			displayName: "Nome Genitore",
			icon: User,
			type: "text",
		},

		// Event title filter (option)
		{
			id: "eventTitle",
			accessor: (row) => row.event.title,
			displayName: "Evento",
			icon: Calendar,
			type: "option",
			// Options will be dynamically provided
		},

		// Family name filter (text)
		{
			id: "familyName",
			accessor: (row) => row.family.name,
			displayName: "Famiglia",
			icon: Users,
			type: "text",
		},

		// Registration status filter (option)
		{
			id: "status",
			accessor: (row) => row.status,
			displayName: "Stato Iscrizione",
			icon: CheckCircle,
			type: "option",
			options: statusOptions,
		},

		// Payment status filter (option)
		{
			id: "paymentStatus",
			accessor: (row) => row.paymentStatus,
			displayName: "Stato Pagamento",
			icon: CreditCard,
			type: "option",
			options: paymentStatusOptions,
		},

		// Registration date filter (date)
		{
			id: "registrationDate",
			accessor: (row) => new Date(row.registrationDate),
			displayName: "Data Iscrizione",
			icon: Calendar,
			type: "date",
		},

		// Event start date filter (date)
		{
			id: "eventStartDate",
			accessor: (row) => new Date(row.event.startDate),
			displayName: "Data Evento",
			icon: Calendar,
			type: "date",
		},
	];

// Helper function to create event options dynamically
export const createEventOptions = (
	events: Array<{ id: string; title: string }> = [],
): ColumnOption[] => {
	return events.map((event) => ({
		label: event.title,
		value: event.title, // Use title as value to match the eventTitle accessor
		icon: Calendar,
	}));
};
