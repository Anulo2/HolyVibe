export type RegistrationStatus =
  | "pending"
  | "confirmed"
  | "cancelled"
  | "waitlist";
export type PaymentStatus = "pending" | "completed" | "failed" | "refunded";

export interface Registration {
  id: string;
  eventId: string;
  childId: string;
  parentId: string;
  status: RegistrationStatus;
  paymentStatus: PaymentStatus;
  registrationDate: string;
  notes?: string | null;
  photoPrivacyConsent: boolean;
  dataPrivacyConsent: boolean;
  canExitAlone: boolean;
  allowedExitLocations?: string[] | null;
  createdAt: string;
  updatedAt: string;
}

export interface RegistrationWithDetails extends Registration {
  event: {
    id: string;
    title: string;
    description: string;
    startDate: string;
    endDate?: string | null;
    locations: string | string[];
    minAge: number;
    maxAge: number;
    maxParticipants: number;
    currentParticipants: number;
    price?: string | null;
    status: "draft" | "open" | "closed" | "full" | "cancelled";
    imageUrl?: string | null;
  };
  child: {
    id: string;
    firstName: string;
    lastName: string;
    birthDate: string;
    avatarUrl?: string | null;
  };
  parent: {
    id: string;
    name: string | null;
    email: string;
    phoneNumber?: string | null;
    image?: string | null;
  };
  authorizedPersons: Array<{
    id: string;
    fullName: string;
    relationship: string;
    phone?: string | null;
    email?: string | null;
    avatarUrl?: string | null;
  }>;
  locationAuthorizations: Array<{
    id: string;
    authorizedPersonId: string;
    location: string;
    canPickup: boolean;
  }>;
}

export interface CreateRegistrationData {
  eventId: string;
  childId: string;
  authorizedPersonIds?: string[];
  notes?: string;
  photoPrivacyConsent?: boolean;
  dataPrivacyConsent?: boolean;
  canExitAlone?: boolean;
  allowedExitLocations?: string[];
  locationAuthorizations?: Array<{
    authorizedPersonId: string;
    location: string;
    canPickup: boolean;
  }>;
}

export interface UpdateRegistrationData {
  id: string;
  status?: RegistrationStatus;
  paymentStatus?: PaymentStatus;
  notes?: string;
  canExitAlone?: boolean;
  allowedExitLocations?: string[];
  authorizedPersonIds?: string[];
  locationAuthorizations?: Array<{
    authorizedPersonId: string;
    location: string;
    canPickup: boolean;
  }>;
}

export interface AdminCreateRegistrationData extends CreateRegistrationData {
  status?: RegistrationStatus;
  paymentStatus?: PaymentStatus;
}
