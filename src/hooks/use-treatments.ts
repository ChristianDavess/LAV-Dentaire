'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { TreatmentWithDetails } from '@/types/database'

interface UseTreatmentsFilters {
  start_date?: string
  end_date?: string
  payment_status?: 'pending' | 'partial' | 'paid'
  patient_id?: string
  limit?: number
  offset?: number
}

interface UseTreatmentsOptions {
  refreshTrigger?: number
  autoFetch?: boolean
}

interface UseTreatmentsReturn {
  treatments: TreatmentWithDetails[]
  loading: boolean
  error: string | null
  refetch: () => void
  createTreatment: (treatmentData: any) => Promise<{ success: boolean; treatment?: TreatmentWithDetails; error?: string }>
  updateTreatment: (treatmentId: string, treatmentData: any) => Promise<{ success: boolean; treatment?: TreatmentWithDetails; error?: string }>
  deleteTreatment: (treatmentId: string) => Promise<{ success: boolean; error?: string }>
  totalCount: number
  hasMore: boolean
}

export function useTreatments(
  filters: UseTreatmentsFilters = {},
  options: UseTreatmentsOptions = {}
): UseTreatmentsReturn {
  const { refreshTrigger, autoFetch = true } = options
  const [treatments, setTreatments] = useState<TreatmentWithDetails[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [totalCount, setTotalCount] = useState(0)
  const [hasMore, setHasMore] = useState(false)

  const fetchTreatments = useCallback(async () => {
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

      // Set default limit if not provided
      if (!filters.limit) {
        params.append('limit', '50')
      }

      const response = await fetch(`/api/treatments?${params.toString()}`, {
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('Failed to fetch treatments')
      }

      const data = await response.json()

      if (data.success) {
        setTreatments(data.data.treatments || [])
        setTotalCount(data.data.pagination?.total || 0)
        setHasMore(data.data.pagination?.hasMore || false)
      } else {
        throw new Error(data.error || 'Failed to fetch treatments')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load treatments'
      setError(errorMessage)
      setTreatments([])
    } finally {
      setLoading(false)
    }
  }, [filters])

  // Auto-fetch on mount and when dependencies change
  useEffect(() => {
    if (autoFetch) {
      fetchTreatments()
    }
  }, [fetchTreatments, refreshTrigger, autoFetch])

  // Create treatment function
  const createTreatment = useCallback(async (treatmentData: any) => {
    try {
      const response = await fetch('/api/treatments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(treatmentData)
      })

      const data = await response.json()

      if (response.ok && data.success) {
        // Refresh treatments list
        await fetchTreatments()
        return { success: true, treatment: data.data.treatment }
      } else {
        let errorMessage = 'Failed to create treatment'
        if (data.error) {
          errorMessage = data.error
        } else if (data.details && Array.isArray(data.details)) {
          errorMessage = data.details.map((detail: any) => detail.message).join(', ')
        }
        return { success: false, error: errorMessage }
      }
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to create treatment'
      }
    }
  }, [fetchTreatments])

  // Update treatment function
  const updateTreatment = useCallback(async (treatmentId: string, treatmentData: any) => {
    try {
      const response = await fetch(`/api/treatments/${treatmentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(treatmentData)
      })

      const data = await response.json()

      if (response.ok && data.success) {
        // Refresh treatments list
        await fetchTreatments()
        return { success: true, treatment: data.data.treatment }
      } else {
        return { success: false, error: data.error || 'Failed to update treatment' }
      }
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to update treatment'
      }
    }
  }, [fetchTreatments])

  // Delete treatment function
  const deleteTreatment = useCallback(async (treatmentId: string) => {
    try {
      const response = await fetch(`/api/treatments/${treatmentId}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      const data = await response.json()

      if (response.ok && data.success) {
        // Refresh treatments list
        await fetchTreatments()
        return { success: true }
      } else {
        return { success: false, error: data.error || 'Failed to delete treatment' }
      }
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to delete treatment'
      }
    }
  }, [fetchTreatments])

  return {
    treatments,
    loading,
    error,
    refetch: fetchTreatments,
    createTreatment,
    updateTreatment,
    deleteTreatment,
    totalCount,
    hasMore
  }
}

// Specialized hook for patient treatments
export function usePatientTreatments(
  patientId: string,
  options: UseTreatmentsOptions = {}
) {
  const filters = useMemo(() => ({
    patient_id: patientId,
    limit: 20
  }), [patientId])

  return useTreatments(filters, options)
}

// Hook for single treatment by ID
export function useTreatment(treatmentId: string) {
  const [treatment, setTreatment] = useState<TreatmentWithDetails | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchTreatment = useCallback(async () => {
    if (!treatmentId) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/treatments/${treatmentId}`, {
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('Failed to fetch treatment')
      }

      const data = await response.json()

      if (data.success) {
        setTreatment(data.data.treatment)
      } else {
        throw new Error(data.error || 'Failed to fetch treatment')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load treatment'
      setError(errorMessage)
      setTreatment(null)
    } finally {
      setLoading(false)
    }
  }, [treatmentId])

  useEffect(() => {
    fetchTreatment()
  }, [fetchTreatment])

  return {
    treatment,
    loading,
    error,
    refetch: fetchTreatment
  }
}

// Hook for treatment statistics
export function useTreatmentStats(filters: UseTreatmentsFilters = {}) {
  const [stats, setStats] = useState({
    totalTreatments: 0,
    totalRevenue: 0,
    pendingPayments: 0,
    completedTreatments: 0
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString())
        }
      })

      const response = await fetch(`/api/treatments/stats?${params.toString()}`, {
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('Failed to fetch treatment statistics')
      }

      const data = await response.json()

      if (data.success) {
        setStats(data.data.stats)
      } else {
        throw new Error(data.error || 'Failed to fetch treatment statistics')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load treatment statistics'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  return {
    stats,
    loading,
    error,
    refetch: fetchStats
  }
}