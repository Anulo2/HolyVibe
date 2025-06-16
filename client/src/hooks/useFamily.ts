import { useState, useEffect } from 'react'
import { api, type Family, type Child, type AuthorizedPerson, type ApiResponse } from '../lib/api-client'

// Hook for fetching user's families
export const useFamilies = () => {
  const [families, setFamilies] = useState<Family[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchFamilies = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Using Eden Treaty for type-safe API call
      const { data, error: apiError } = await api.family.get({
        $headers: {
          'user-id': 'mock-user-1'
        }
      })

      if (apiError) {
        setError('Failed to fetch families')
        return
      }

      if (data?.success) {
        // Transform the response data to extract families
        const familyData = data.data?.map((item: any) => item.family).filter(Boolean) || []
        setFamilies(familyData)
      } else {
        setError(data?.error || 'Unknown error')
      }
    } catch (err) {
      setError('Failed to fetch families')
      console.error('Error fetching families:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFamilies()
  }, [])

  const createFamily = async (familyData: { name: string; description?: string }) => {
    try {
      const { data, error: apiError } = await api.family.post({
        ...familyData
      }, {
        $headers: {
          'user-id': 'mock-user-1'
        }
      })

      if (apiError) {
        throw new Error('Failed to create family')
      }

      if (data?.success) {
        await fetchFamilies() // Refresh the list
        return data.data
      } else {
        throw new Error(data?.error || 'Unknown error')
      }
    } catch (err) {
      console.error('Error creating family:', err)
      throw err
    }
  }

  return {
    families,
    loading,
    error,
    createFamily,
    refetch: fetchFamilies
  }
}

// Hook for managing children in a family
export const useChildren = (familyId?: string) => {
  const [children, setChildren] = useState<Child[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchChildren = async () => {
    if (!familyId) return

    try {
      setLoading(true)
      setError(null)

      // Using Eden Treaty for type-safe API call
      const { data, error: apiError } = await api.family({ familyId }).children.get({
        $headers: {
          'user-id': 'mock-user-1'
        }
      })

      if (apiError) {
        setError('Failed to fetch children')
        return
      }

      if (data?.success) {
        setChildren(data.data || [])
      } else {
        setError(data?.error || 'Unknown error')
      }
    } catch (err) {
      setError('Failed to fetch children')
      console.error('Error fetching children:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchChildren()
  }, [familyId])

  const addChild = async (childData: {
    firstName: string
    lastName: string
    birthDate: string
    birthPlace?: string
    fiscalCode?: string
    gender?: 'M' | 'F' | 'O'
    allergies?: string
    medicalNotes?: string
  }) => {
    if (!familyId) throw new Error('Family ID is required')

    try {
      const { data, error: apiError } = await api.family({ familyId }).children.post({
        ...childData
      }, {
        $headers: {
          'user-id': 'mock-user-1'
        }
      })

      if (apiError) {
        throw new Error('Failed to add child')
      }

      if (data?.success) {
        await fetchChildren() // Refresh the list
        return data.data
      } else {
        throw new Error(data?.error || 'Unknown error')
      }
    } catch (err) {
      console.error('Error adding child:', err)
      throw err
    }
  }

  return {
    children,
    loading,
    error,
    addChild,
    refetch: fetchChildren
  }
}

// Hook for managing authorized persons in a family
export const useAuthorizedPersons = (familyId?: string) => {
  const [persons, setPersons] = useState<AuthorizedPerson[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchPersons = async () => {
    if (!familyId) return

    try {
      setLoading(true)
      setError(null)

      // Using Eden Treaty for type-safe API call
      const { data, error: apiError } = await api.family({ familyId })['authorized-persons'].get({
        $headers: {
          'user-id': 'mock-user-1'
        }
      })

      if (apiError) {
        setError('Failed to fetch authorized persons')
        return
      }

      if (data?.success) {
        setPersons(data.data || [])
      } else {
        setError(data?.error || 'Unknown error')
      }
    } catch (err) {
      setError('Failed to fetch authorized persons')
      console.error('Error fetching authorized persons:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPersons()
  }, [familyId])

  const addPerson = async (personData: {
    fullName: string
    relationship: string
    phone?: string
    email?: string
    documentType?: string
    documentNumber?: string
    documentExpiry?: string
  }) => {
    if (!familyId) throw new Error('Family ID is required')

    try {
      const { data, error: apiError } = await api.family({ familyId })['authorized-persons'].post({
        ...personData
      }, {
        $headers: {
          'user-id': 'mock-user-1'
        }
      })

      if (apiError) {
        throw new Error('Failed to add authorized person')
      }

      if (data?.success) {
        await fetchPersons() // Refresh the list
        return data.data
      } else {
        throw new Error(data?.error || 'Unknown error')
      }
    } catch (err) {
      console.error('Error adding authorized person:', err)
      throw err
    }
  }

  return {
    persons,
    loading,
    error,
    addPerson,
    refetch: fetchPersons
  }
} 