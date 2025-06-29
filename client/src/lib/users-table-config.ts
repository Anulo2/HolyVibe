import {
	Calendar,
	Mail,
	Phone,
	Shield,
	User,
	UserCheck,
	UserPlus,
	Users,
} from "lucide-react";
import type {
	ColumnConfig,
	ColumnOption,
} from "@/components/data-table-filter";
import type { UserWithRole } from "@/hooks/useUsersQuery";

// Role options for user roles
export const roleOptions: ColumnOption[] = [
	{
		label: "Amministratore",
		value: "amministratore",
		icon: Shield,
	},
	{
		label: "Editor",
		value: "editor",
		icon: UserCheck,
	},
	{
		label: "Animatore",
		value: "animatore",
		icon: UserPlus,
	},
	{
		label: "Genitore",
		value: "genitore",
		icon: User,
	},
];

// Status options for organization membership
export const membershipStatusOptions: ColumnOption[] = [
	{
		label: "Membro",
		value: "member",
		icon: UserCheck,
	},
	{
		label: "Non membro",
		value: "non_member",
		icon: User,
	},
];

// Column configurations for the data table filters
export const usersColumnsConfig: ColumnConfig<UserWithRole>[] = [
	// User name filter (text)
	{
		id: "name",
		accessor: (row) => row.name || "",
		displayName: "Nome",
		icon: User,
		type: "text",
	},

	// User email filter (text)
	{
		id: "email",
		accessor: (row) => row.email,
		displayName: "Email",
		icon: Mail,
		type: "text",
	},

	// Phone number filter (text)
	{
		id: "phoneNumber",
		accessor: (row) => row.phoneNumber || "",
		displayName: "Telefono",
		icon: Phone,
		type: "text",
	},

	// Role filter (option)
	{
		id: "role",
		accessor: (row) => row.role || "genitore",
		displayName: "Ruolo",
		icon: Shield,
		type: "option",
		options: roleOptions,
	},

	// Membership status filter (option)
	{
		id: "membershipStatus",
		accessor: (row) => (row.role ? "member" : "non_member"),
		displayName: "Stato Membro",
		icon: Users,
		type: "option",
		options: membershipStatusOptions,
	},

	// Registration date filter (date)
	{
		id: "createdAt",
		accessor: (row) => new Date(row.createdAt),
		displayName: "Data Registrazione",
		icon: Calendar,
		type: "date",
	},

	// Organization join date filter (date)
	{
		id: "joinedAt",
		accessor: (row) => (row.joinedAt ? new Date(row.joinedAt) : null),
		displayName: "Data Ingresso",
		icon: Calendar,
		type: "date",
	},
];

// Helper function to get role label
export const getRoleLabel = (role: string | null) => {
	const roleOption = roleOptions.find((option) => option.value === role);
	return roleOption ? roleOption.label : "Genitore";
};

// Helper function to get role color
export const getRoleColor = (role: string | null) => {
	switch (role) {
		case "amministratore":
			return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
		case "editor":
			return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
		case "animatore":
			return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
		case "genitore":
		default:
			return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
	}
};
