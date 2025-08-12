export interface AuthorizedPerson {
	id: string;
	familyId: string;
	fullName: string;
	relationship: string;
	phone?: string | null;
	email?: string | null;
	avatarUrl?: string | null;
	isActive: boolean;
	createdAt: string;
	updatedAt: string;
}

export interface AuthorizedPersonWithFamily extends AuthorizedPerson {
	family: {
		id: string;
		name: string;
	};
}

export interface LocationAuthorization {
	id: string;
	authorizedPersonId: string;
	location: string;
	canPickup: boolean;
}

export interface CreateAuthorizedPersonData {
	familyId: string;
	fullName: string;
	relationship: string;
	phone?: string;
	email?: string;
}

export interface UpdateAuthorizedPersonData {
	id: string;
	fullName?: string;
	relationship?: string;
	phone?: string;
	email?: string;
}
