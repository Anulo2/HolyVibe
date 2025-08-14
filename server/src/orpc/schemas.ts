import { z } from "zod";

// Schema definitions
export const Family = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  createdBy: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const Child = z.object({
  id: z.string(),
  familyId: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  birthDate: z.string(),
  birthPlace: z.string().nullable(),
  fiscalCode: z.string(),
  gender: z.enum(["M", "F"]).nullable(),
  allergies: z.string().nullable(),
  medicalNotes: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const AuthorizedPerson = z.object({
  id: z.string(),
  familyId: z.string(),
  fullName: z.string(),
  relationship: z.string(),
  phone: z.string().nullable(),
  email: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const Event = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  startDate: z.string(),
  endDate: z.string().nullable(),
  locations: z.string().nullable(), // JSON array of locations
  minAge: z.number().nullable(),
  maxAge: z.number().nullable(),
  maxParticipants: z.number().nullable(),
  currentParticipants: z.number(),
  price: z.string().nullable(),
  status: z.enum(["draft", "open", "closed", "full", "cancelled"]),
  imageUrl: z.string().nullable(),
  // Extended information fields (visible only in details)
  detailedDescription: z.string().nullable(),
  program: z.string().nullable(),
  requirements: z.string().nullable(),
  whatToBring: z.string().nullable(),
  parentNotes: z.string().nullable(),
  emergencyContacts: z.string().nullable(),
  meetingPoint: z.string().nullable(),
  dropOffTime: z.string().nullable(),
  pickUpTime: z.string().nullable(),
  includesLunch: z.boolean().nullable(),
  includesSnack: z.boolean().nullable(),
  transportProvided: z.boolean().nullable(),
  weatherDependent: z.boolean().nullable(),
  specialNotes: z.string().nullable(),
  cancellationPolicy: z.string().nullable(),
  photographyConsent: z.boolean().nullable(),
  willTakePhotos: z.boolean(),
  photosForSocialMedia: z.boolean(),
  additionalImages: z.string().nullable(),
  createdBy: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  organizationId: z.string().nullable(),
  organization: z
    .object({
      id: z.string(),
      name: z.string(),
      photoVideoMinorsDeclaration: z.string().nullable(),
    })
    .nullable()
    .optional(),
});

export const User = z.object({
  id: z.string(),
  name: z.string().nullable(),
  email: z.string(),
  phoneNumber: z.string().nullable(),
  birthDate: z.string().nullable(),
  image: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const Registration = z.object({
  id: z.string(),
  eventId: z.string(),
  childId: z.string(),
  parentId: z.string(),
  status: z.enum(["pending", "confirmed", "cancelled", "waitlist"]),
  paymentStatus: z.enum(["pending", "completed", "failed", "refunded"]),
  registrationDate: z.string(),
  notes: z.string().nullable(),
  photoPrivacyConsent: z.boolean(),
  dataPrivacyConsent: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const RegistrationWithDetails = z.object({
  id: z.string(),
  eventId: z.string(),
  status: z.enum(["pending", "confirmed", "cancelled", "waitlist"]),
  paymentStatus: z.enum(["pending", "completed", "failed", "refunded"]),
  registrationDate: z.string(),
  notes: z.string().nullable(),
  photoPrivacyConsent: z.boolean(),
  dataPrivacyConsent: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
  child: z.object({
    id: z.string(),
    firstName: z.string(),
    lastName: z.string(),
    birthDate: z.string(),
    allergies: z.string().nullable(),
    medicalNotes: z.string().nullable(),
  }),
  parent: z.object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
    phoneNumber: z.string().nullable(),
  }),
  parents: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      email: z.string(),
      phoneNumber: z.string().nullable(),
    }),
  ),
  event: z.object({
    id: z.string(),
    title: z.string(),
    startDate: z.string(),
    endDate: z.string().nullable(),
    price: z.string().nullable(),
    locations: z.string(),
    status: z.enum(["draft", "open", "closed", "full", "cancelled"]),
  }),
  family: z.object({
    id: z.string(),
    name: z.string(),
  }),
  authorizedPersons: z.array(
    z.object({
      id: z.string(),
      fullName: z.string(),
      relationship: z.string(),
      phone: z.string().nullable(),
      email: z.string().nullable(),
    }),
  ),
});

export const UserWithRole = z.object({
  id: z.string(),
  name: z.string().nullable(),
  email: z.string(),
  phoneNumber: z.string().nullable(),
  birthDate: z.string().nullable(),
  image: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  role: z.string().nullable(),
  organizationId: z.string().nullable(),
  joinedAt: z.string().nullable(),
});

export const Invitation = z.object({
  id: z.string(),
  familyId: z.string(),
  email: z.string().nullable(),
  phoneNumber: z.string().nullable(),
  invitedBy: z.string(),
  message: z.string().nullable(),
  status: z.enum(["pending", "accepted", "rejected", "expired"]),
  token: z.string(),
  expiresAt: z.string(),
  acceptedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
