'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Patient } from '@/types'

interface UsePatientsFilters {
  search?: string
  limit?: number
  offset?: number
  sort_by?: 'created_at' | 'first_name' | 'last_name'
  sort_order?: 'asc' | 'desc'
}

interface UsePatientsOptions {
  refreshTrigger?: number
  autoFetch?: boolean
}

interface UsePatientsReturn {
  patients: Patient[]
  loading: boolean
  error: string | null
  refetch: () => void
  searchPatients: (searchTerm: string) => Patient[]
  totalCount: number
  hasMore: boolean
  createPatient: (patientData: any) => Promise<{ success: boolean; patient?: Patient; error?: string }>
}

export function usePatients(
  filters: UsePatientsFilters = {},
  options: UsePatientsOptions = {}
): UsePatientsReturn {
  const { refreshTrigger, autoFetch = true } = options
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [totalCount, setTotalCount] = useState(0)
  const [hasMore, setHasMore] = useState(false)

  const fetchPatients = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()

      // Add filters to params
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString())
        }
      })

      // Set defaults
      if (!filters.limit) {
        params.append('limit', '20')
      }
      if (!filters.sort_by) {
        params.append('sort_by', 'created_at')
      }
      if (!filters.sort_order) {
        params.append('sort_order', 'desc')
      }

      const response = await fetch(`/api/patients?${params.toString()}`, {
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('Failed to fetch patients')
      }

      const data = await response.json()

      if (data.success) {
        setPatients(data.data.patients || [])
        setTotalCount(data.data.pagination?.total || 0)
        setHasMore(data.data.pagination?.hasMore || false)
      } else {
        throw new Error(data.error || 'Failed to fetch patients')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load patients'
      setError(errorMessage)
      setPatients([])
    } finally {
      setLoading(false)
    }
  }, [filters])

  // Auto-fetch on mount and when dependencies change
  useEffect(() => {
    if (autoFetch) {
      fetchPatients()
    }
  }, [fetchPatients, refreshTrigger, autoFetch])

  // Search function for client-side filtering
  const searchPatients = useCallback((searchTerm: string) => {
    if (!searchTerm.trim()) {
      return patients
    }

    const searchLower = searchTerm.toLowerCase()
    return patients.filter(patient => {
      const fullName = `${patient.first_name} ${patient.last_name}`.toLowerCase()
      const patientId = patient.patient_id.toLowerCase()
      const phone = patient.phone?.toLowerCase() || ''
      const email = patient.email?.toLowerCase() || ''

      return (
        fullName.includes(searchLower) ||
        patientId.includes(searchLower) ||
        phone.includes(searchLower) ||
        email.includes(searchLower)
      )
    })
  }, [patients])

  // Create patient function
  const createPatient = useCallback(async (patientData: any) => {
    try {
      const response = await fetch('/api/patients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(patientData)
      })

      const data = await response.json()

      if (response.ok && data.success) {
        // Refresh patients list
        await fetchPatients()
        return { success: true, patient: data.data.patient }
      } else {
        return { success: false, error: data.error || 'Failed to create patient' }
      }
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to create patient'
      }
    }
  }, [fetchPatients])

  return {
    patients,
    loading,
    error,
    refetch: fetchPatients,
    searchPatients,
    totalCount,
    hasMore,
    createPatient
  }
}

// Specialized hook for patient selection in forms
export function usePatientsForSelection(options: UsePatientsOptions = {}) {
  const filters = useMemo(() => ({
    limit: 100, // Get more patients for selection
    sort_by: 'first_name' as const,
    sort_order: 'asc' as const
  }), [])

  const result = usePatients(filters, options)

  // Format patients for selection components
  const patientsForSelect = useMemo(() =>
    result.patients.map(patient => ({
      value: patient.id,
      label: `${patient.first_name} ${patient.last_name} (${patient.patient_id})`,
      patient
    })),
    [result.patients]
  )

  return {
    ...result,
    patientsForSelect
  }
}

// Hook for single patient by ID
export function usePatient(patientId: string) {
  const [patient, setPatient] = useState<Patient | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchPatient = useCallback(async () => {
    if (!patientId) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/patients/${patientId}`, {
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('Failed to fetch patient')
      }

      const data = await response.json()

      if (data.success) {
        setPatient(data.data.patient)
      } else {
        throw new Error(data.error || 'Failed to fetch patient')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load patient'
      setError(errorMessage)
      setPatient(null)
    } finally {
      setLoading(false)
    }
  }, [patientId])

  useEffect(() => {
    fetchPatient()
  }, [fetchPatient])

  return {
    patient,
    loading,
    error,
    refetch: fetchPatient
  }
}