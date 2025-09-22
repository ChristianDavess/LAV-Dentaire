'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Patient, Appointment } from '@/types'

interface AppointmentWithPatient extends Appointment {
  patients: Patient
}

interface UseAppointmentsFilters {
  start_date?: string
  end_date?: string
  status?: 'scheduled' | 'completed' | 'cancelled' | 'no-show'
  patient_id?: string
  limit?: number
  offset?: number
}

interface UseAppointmentsOptions {
  refreshTrigger?: number
  autoFetch?: boolean
}

interface UseAppointmentsReturn {
  appointments: AppointmentWithPatient[]
  loading: boolean
  error: string | null
  refetch: () => void
  filteredAppointments: (searchTerm: string) => AppointmentWithPatient[]
  totalCount: number
  hasMore: boolean
}

export function useAppointments(
  filters: UseAppointmentsFilters = {},
  options: UseAppointmentsOptions = {}
): UseAppointmentsReturn {
  const { refreshTrigger, autoFetch = true } = options
  const [appointments, setAppointments] = useState<AppointmentWithPatient[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [totalCount, setTotalCount] = useState(0)
  const [hasMore, setHasMore] = useState(false)

  const fetchAppointments = useCallback(async () => {
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

      const response = await fetch(`/api/appointments?${params.toString()}`, {
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('Failed to fetch appointments')
      }

      const data = await response.json()

      if (data.success) {
        setAppointments(data.data.appointments || [])
        setTotalCount(data.data.pagination?.total || 0)
        setHasMore(data.data.pagination?.hasMore || false)
      } else {
        throw new Error(data.error || 'Failed to fetch appointments')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load appointments'
      setError(errorMessage)
      setAppointments([])
    } finally {
      setLoading(false)
    }
  }, [filters])

  // Auto-fetch on mount and when dependencies change
  useEffect(() => {
    if (autoFetch) {
      fetchAppointments()
    }
  }, [fetchAppointments, refreshTrigger, autoFetch])

  // Search/filter function
  const filteredAppointments = useCallback((searchTerm: string) => {
    if (!searchTerm.trim()) {
      return appointments
    }

    const searchLower = searchTerm.toLowerCase()
    return appointments.filter(appointment => {
      const patientName = `${appointment.patients.first_name} ${appointment.patients.last_name}`.toLowerCase()
      const patientId = appointment.patients.patient_id.toLowerCase()
      const reason = appointment.reason?.toLowerCase() || ''
      const notes = appointment.notes?.toLowerCase() || ''

      return (
        patientName.includes(searchLower) ||
        patientId.includes(searchLower) ||
        reason.includes(searchLower) ||
        notes.includes(searchLower)
      )
    })
  }, [appointments])

  return {
    appointments,
    loading,
    error,
    refetch: fetchAppointments,
    filteredAppointments,
    totalCount,
    hasMore
  }
}

// Specialized hook for appointments by date range
export function useAppointmentsByDateRange(
  startDate: Date,
  endDate: Date,
  options: UseAppointmentsOptions = {}
) {
  const filters = useMemo(() => ({
    start_date: startDate.toISOString().split('T')[0],
    end_date: endDate.toISOString().split('T')[0],
    limit: 100
  }), [startDate, endDate])

  return useAppointments(filters, options)
}

// Specialized hook for patient appointments
export function usePatientAppointments(
  patientId: string,
  options: UseAppointmentsOptions = {}
) {
  const filters = useMemo(() => ({
    patient_id: patientId,
    limit: 20
  }), [patientId])

  return useAppointments(filters, options)
}