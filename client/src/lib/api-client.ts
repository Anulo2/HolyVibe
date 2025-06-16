import { treaty } from '@elysiajs/eden'
import type { App } from '../../../server/src/exports'

// Create the type-safe API client using Eden Treaty
export const api = treaty<App>('localhost:3000')

// Export types for use in components
export type ApiResponse<T> = {
  success: boolean
  data?: T
  error?: string
}

export type Family = {
  id: string
  name: string
  description?: string
  createdBy: string
  createdAt: string
  updatedAt: string
}

export type Child = {
  id: string
  familyId: string
  firstName: string
  lastName: string
  birthDate: string
  birthPlace?: string
  fiscalCode?: string
  gender?: 'M' | 'F' | 'O'
  allergies?: string
  medicalNotes?: string
  avatarUrl?: string
  createdAt: string
  updatedAt: string
}

export type AuthorizedPerson = {
  id: string
  familyId: string
  fullName: string
  relationship: string
  phone?: string
  email?: string
  avatarUrl?: string
  documentType?: string
  documentNumber?: string
  documentExpiry?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export type FamilyMember = {
  id: string
  familyId: string
  userId: string
  role: 'parent' | 'guardian'
  isAdmin: boolean
  joinedAt: string
  createdAt: string
  updatedAt: string
}

// Helper function to get user ID from session
// In a real app, this would come from the auth context
export const getCurrentUserId = () => {
  // For now, we'll use a mock user ID
  // Later this would come from Better Auth session
  return "mock-user-1"
}

// Helper function to create headers with user ID
export const createHeaders = () => ({
  "user-id": getCurrentUserId(),
  "Content-Type": "application/json"
}) 