'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Procedure } from '@/types'

interface UseProceduresFilters {
  search?: string
  is_active?: boolean
  limit?: number
  offset?: number
  sort_by?: 'name' | 'default_cost' | 'created_at'
  sort_order?: 'asc' | 'desc'
}

interface UseProceduresOptions {
  refreshTrigger?: number
  autoFetch?: boolean
}

interface UseProceduresReturn {
  procedures: Procedure[]
  loading: boolean
  error: string | null
  refetch: () => void
  searchProcedures: (searchTerm: string) => Procedure[]
  createProcedure: (procedureData: any) => Promise<{ success: boolean; procedure?: Procedure; error?: string }>
  updateProcedure: (procedureId: string, procedureData: any) => Promise<{ success: boolean; procedure?: Procedure; error?: string }>
  deleteProcedure: (procedureId: string) => Promise<{ success: boolean; error?: string }>
  totalCount: number
  hasMore: boolean
}

export function useProcedures(
  filters: UseProceduresFilters = {},
  options: UseProceduresOptions = {}
): UseProceduresReturn {
  const { refreshTrigger, autoFetch = true } = options
  const [procedures, setProcedures] = useState<Procedure[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [totalCount, setTotalCount] = useState(0)
  const [hasMore, setHasMore] = useState(false)

  const fetchProcedures = useCallback(async () => {
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
        params.append('limit', '50')
      }
      if (!filters.sort_by) {
        params.append('sort_by', 'name')
      }
      if (!filters.sort_order) {
        params.append('sort_order', 'asc')
      }

      const response = await fetch(`/api/procedures?${params.toString()}`, {
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('Failed to fetch procedures')
      }

      const data = await response.json()

      if (data.success) {
        setProcedures(data.data.procedures || [])
        setTotalCount(data.data.pagination?.total || 0)
        setHasMore(data.data.pagination?.hasMore || false)
      } else {
        throw new Error(data.error || 'Failed to fetch procedures')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load procedures'
      setError(errorMessage)
      setProcedures([])
    } finally {
      setLoading(false)
    }
  }, [filters])

  // Auto-fetch on mount and when dependencies change
  useEffect(() => {
    if (autoFetch) {
      fetchProcedures()
    }
  }, [fetchProcedures, refreshTrigger, autoFetch])

  // Search function for client-side filtering
  const searchProcedures = useCallback((searchTerm: string) => {
    if (!searchTerm.trim()) {
      return procedures
    }

    const searchLower = searchTerm.toLowerCase()
    return procedures.filter(procedure => {
      const name = procedure.name.toLowerCase()
      const description = procedure.description?.toLowerCase() || ''

      return (
        name.includes(searchLower) ||
        description.includes(searchLower)
      )
    })
  }, [procedures])

  // Create procedure function
  const createProcedure = useCallback(async (procedureData: any) => {
    try {
      const response = await fetch('/api/procedures', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(procedureData)
      })

      const data = await response.json()

      if (response.ok && data.success) {
        // Refresh procedures list
        await fetchProcedures()
        return { success: true, procedure: data.data.procedure }
      } else {
        return { success: false, error: data.error || 'Failed to create procedure' }
      }
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to create procedure'
      }
    }
  }, [fetchProcedures])

  // Update procedure function
  const updateProcedure = useCallback(async (procedureId: string, procedureData: any) => {
    try {
      const response = await fetch(`/api/procedures/${procedureId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(procedureData)
      })

      const data = await response.json()

      if (response.ok && data.success) {
        // Refresh procedures list
        await fetchProcedures()
        return { success: true, procedure: data.data.procedure }
      } else {
        return { success: false, error: data.error || 'Failed to update procedure' }
      }
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to update procedure'
      }
    }
  }, [fetchProcedures])

  // Delete procedure function
  const deleteProcedure = useCallback(async (procedureId: string) => {
    try {
      const response = await fetch(`/api/procedures/${procedureId}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      const data = await response.json()

      if (response.ok && data.success) {
        // Refresh procedures list
        await fetchProcedures()
        return { success: true }
      } else {
        return { success: false, error: data.error || 'Failed to delete procedure' }
      }
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to delete procedure'
      }
    }
  }, [fetchProcedures])

  return {
    procedures,
    loading,
    error,
    refetch: fetchProcedures,
    searchProcedures,
    createProcedure,
    updateProcedure,
    deleteProcedure,
    totalCount,
    hasMore
  }
}

// Specialized hook for procedure selection in treatment forms
export function useProceduresForSelection(options: UseProceduresOptions = {}) {
  const filters = useMemo(() => ({
    is_active: true, // Only active procedures for selection
    limit: 100, // Get more procedures for selection
    sort_by: 'name' as const,
    sort_order: 'asc' as const
  }), [])

  const result = useProcedures(filters, options)

  // Format procedures for selection components
  const proceduresForSelect = useMemo(() =>
    result.procedures.map(procedure => ({
      value: procedure.id,
      label: `${procedure.name} - ${procedure.default_cost ? `$${procedure.default_cost}` : 'No price set'}`,
      procedure
    })),
    [result.procedures]
  )

  return {
    ...result,
    proceduresForSelect
  }
}

// Hook for single procedure by ID
export function useProcedure(procedureId: string) {
  const [procedure, setProcedure] = useState<Procedure | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchProcedure = useCallback(async () => {
    if (!procedureId) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/procedures/${procedureId}`, {
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('Failed to fetch procedure')
      }

      const data = await response.json()

      if (data.success) {
        setProcedure(data.data.procedure)
      } else {
        throw new Error(data.error || 'Failed to fetch procedure')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load procedure'
      setError(errorMessage)
      setProcedure(null)
    } finally {
      setLoading(false)
    }
  }, [procedureId])

  useEffect(() => {
    fetchProcedure()
  }, [fetchProcedure])

  return {
    procedure,
    loading,
    error,
    refetch: fetchProcedure
  }
}

// Hook for popular procedures (most used in treatments)
export function usePopularProcedures(limit: number = 10) {
  const [popularProcedures, setPopularProcedures] = useState<Array<Procedure & { usage_count: number }>>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchPopularProcedures = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/procedures/popular?limit=${limit}`, {
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('Failed to fetch popular procedures')
      }

      const data = await response.json()

      if (data.success) {
        setPopularProcedures(data.data.procedures || [])
      } else {
        throw new Error(data.error || 'Failed to fetch popular procedures')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load popular procedures'
      setError(errorMessage)
      setPopularProcedures([])
    } finally {
      setLoading(false)
    }
  }, [limit])

  useEffect(() => {
    fetchPopularProcedures()
  }, [fetchPopularProcedures])

  return {
    popularProcedures,
    loading,
    error,
    refetch: fetchPopularProcedures
  }
}