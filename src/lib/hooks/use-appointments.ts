import { useState, useEffect, useCallback } from 'react'
import { format, addDays, subDays } from 'date-fns'

interface Patient {
  id: string
  patient_id: string
  first_name: string
  last_name: string
  phone?: string
  email?: string
}

interface Appointment {
  id: string
  appointment_date: string
  appointment_time: string
  duration_minutes: number
  status: 'scheduled' | 'completed' | 'cancelled' | 'no-show'
  reason?: string
  notes?: string
  patients: Patient
}

interface UseAppointmentsOptions {
  startDate?: string
  endDate?: string
  status?: string
  patientId?: string
  limit?: number
  autoRefresh?: boolean
  refreshInterval?: number
}

interface UseAppointmentsReturn {
  appointments: Appointment[]
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  createAppointment: (data: any) => Promise<Appointment>
  updateAppointment: (id: string, data: any) => Promise<Appointment>
  deleteAppointment: (id: string) => Promise<void>
  updateStatus: (id: string, status: Appointment['status']) => Promise<void>
  stats: {
    total: number
    scheduled: number
    completed: number
    cancelled: number
    noShow: number
  }
}

export function useAppointments(options: UseAppointmentsOptions = {}): UseAppointmentsReturn {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const {
    startDate,
    endDate,
    status,
    patientId,
    limit = 100,
    autoRefresh = false,
    refreshInterval = 30000 // 30 seconds
  } = options

  const fetchAppointments = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()

      if (startDate) params.append('start_date', startDate)
      if (endDate) params.append('end_date', endDate)
      if (status) params.append('status', status)
      if (patientId) params.append('patient_id', patientId)
      params.append('limit', limit.toString())

      const response = await fetch(`/api/appointments?${params.toString()}`)

      if (!response.ok) {
        throw new Error('Failed to fetch appointments')
      }

      const data = await response.json()
      setAppointments(data.appointments || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load appointments')
    } finally {
      setLoading(false)
    }
  }, [startDate, endDate, status, patientId, limit])

  const createAppointment = useCallback(async (appointmentData: any): Promise<Appointment> => {
    const response = await fetch('/api/appointments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(appointmentData),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Failed to create appointment')
    }

    // Refresh appointments after creation
    await fetchAppointments()

    return data.appointment
  }, [fetchAppointments])

  const updateAppointment = useCallback(async (id: string, appointmentData: any): Promise<Appointment> => {
    const response = await fetch(`/api/appointments/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(appointmentData),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Failed to update appointment')
    }

    // Update local state optimistically
    setAppointments(prev =>
      prev.map(apt => apt.id === id ? { ...apt, ...appointmentData } : apt)
    )

    return data.appointment
  }, [])

  const deleteAppointment = useCallback(async (id: string): Promise<void> => {
    const response = await fetch(`/api/appointments/${id}`, {
      method: 'DELETE',
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Failed to cancel appointment')
    }

    // Update local state optimistically
    setAppointments(prev =>
      prev.map(apt => apt.id === id ? { ...apt, status: 'cancelled' as const } : apt)
    )
  }, [])

  const updateStatus = useCallback(async (id: string, newStatus: Appointment['status']): Promise<void> => {
    const response = await fetch(`/api/appointments/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status: newStatus }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Failed to update appointment status')
    }

    // Update local state optimistically
    setAppointments(prev =>
      prev.map(apt => apt.id === id ? { ...apt, status: newStatus } : apt)
    )
  }, [])

  // Calculate stats
  const stats = {
    total: appointments.length,
    scheduled: appointments.filter(apt => apt.status === 'scheduled').length,
    completed: appointments.filter(apt => apt.status === 'completed').length,
    cancelled: appointments.filter(apt => apt.status === 'cancelled').length,
    noShow: appointments.filter(apt => apt.status === 'no-show').length,
  }

  // Initial fetch
  useEffect(() => {
    fetchAppointments()
  }, [fetchAppointments])

  // Auto refresh
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(fetchAppointments, refreshInterval)
    return () => clearInterval(interval)
  }, [autoRefresh, refreshInterval, fetchAppointments])

  return {
    appointments,
    loading,
    error,
    refresh: fetchAppointments,
    createAppointment,
    updateAppointment,
    deleteAppointment,
    updateStatus,
    stats
  }
}

// Helper hook for getting appointments for today
export function useTodayAppointments() {
  const today = format(new Date(), 'yyyy-MM-dd')

  return useAppointments({
    startDate: today,
    endDate: today,
    autoRefresh: true,
    refreshInterval: 60000 // 1 minute
  })
}

// Helper hook for getting upcoming appointments
export function useUpcomingAppointments(days: number = 7) {
  const today = format(new Date(), 'yyyy-MM-dd')
  const endDate = format(addDays(new Date(), days), 'yyyy-MM-dd')

  return useAppointments({
    startDate: today,
    endDate: endDate,
    status: 'scheduled'
  })
}

// Helper hook for getting appointments by patient
export function usePatientAppointments(patientId: string) {
  return useAppointments({
    patientId,
    limit: 50
  })
}

// Helper hook for getting appointment statistics
export function useAppointmentStats(days: number = 30) {
  const startDate = format(subDays(new Date(), days), 'yyyy-MM-dd')
  const endDate = format(new Date(), 'yyyy-MM-dd')

  const { appointments, loading, error } = useAppointments({
    startDate,
    endDate
  })

  const stats = {
    total: appointments.length,
    scheduled: appointments.filter(apt => apt.status === 'scheduled').length,
    completed: appointments.filter(apt => apt.status === 'completed').length,
    cancelled: appointments.filter(apt => apt.status === 'cancelled').length,
    noShow: appointments.filter(apt => apt.status === 'no-show').length,
    completionRate: appointments.length > 0
      ? Math.round((appointments.filter(apt => apt.status === 'completed').length / appointments.length) * 100)
      : 0,
    noShowRate: appointments.length > 0
      ? Math.round((appointments.filter(apt => apt.status === 'no-show').length / appointments.length) * 100)
      : 0
  }

  return { stats, loading, error }
}