export interface Family {
	id: string;
	name: string;
	description?: string | null;
	createdBy: string;
	createdAt: string;
	updatedAt: string;
}

export interface FamilyMember {
	id: string;
	familyId: string;
	userId: string;
	role: "parent" | "guardian";
	isAdmin: boolean;
	joinedAt: string;
	createdAt: string;
	updatedAt: string;
}

export interface FamilyWithMembers extends Family {
	members: Array<{
		id: string;
		userId: string;
		role: "parent" | "guardian";
		isAdmin: boolean;
		user: {
			id: string;
			name: string | null;
			email: string;
			phoneNumber?: string | null;
		};
	}>;
}

export interface CreateFamilyData {
	name: string;
	description?: string;
}

export interface UpdateFamilyData {
	id: string;
	name?: string;
	description?: string;
}

export interface Child {
	id: string;
	familyId: string;
	firstName: string;
	lastName: string;
	birthDate: string;
	birthPlace?: string | null;
	fiscalCode: string;
	gender: "M" | "F";
	allergies?: string | null;
	medicalNotes?: string | null;
	avatarUrl?: string | null;
	createdAt: string;
	updatedAt: string;
}

export interface CreateChildData {
	familyId: string;
	firstName: string;
	lastName: string;
	birthDate: string;
	birthPlace?: string;
	fiscalCode: string;
	gender: "M" | "F";
	allergies?: string;
	medicalNotes?: string;
}

export interface UpdateChildData {
	id: string;
	firstName?: string;
	lastName?: string;
	birthDate?: string;
	birthPlace?: string;
	fiscalCode?: string;
	gender?: "M" | "F";
	allergies?: string;
	medicalNotes?: string;
}
