'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Search, Filter, Calendar, Users, AlertCircle, RefreshCw } from 'lucide-react'
import AppointmentCard from './appointment-card'
import { format, subDays, addDays } from 'date-fns'

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
  patient_id: string
  appointment_date: string
  appointment_time: string
  duration_minutes: number
  status: 'scheduled' | 'completed' | 'cancelled' | 'no-show'
  reason?: string
  notes?: string
  patients: Patient
}

interface AppointmentListProps {
  onEdit?: (appointment: Appointment) => void
  onStatusChange?: (appointmentId: string, status: Appointment['status']) => void
  onCancel?: (appointmentId: string) => void
  refreshTrigger?: number
  className?: string
}

export default function AppointmentList({
  onEdit,
  onStatusChange,
  onCancel,
  refreshTrigger,
  className
}: AppointmentListProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [dateRange, setDateRange] = useState<string>('week')

  const fetchAppointments = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const today = new Date()
      let startDate: string | undefined
      let endDate: string | undefined

      switch (dateRange) {
        case 'today':
          startDate = format(today, 'yyyy-MM-dd')
          endDate = format(today, 'yyyy-MM-dd')
          break
        case 'week':
          startDate = format(today, 'yyyy-MM-dd')
          endDate = format(addDays(today, 7), 'yyyy-MM-dd')
          break
        case 'month':
          startDate = format(today, 'yyyy-MM-dd')
          endDate = format(addDays(today, 30), 'yyyy-MM-dd')
          break
        case 'past':
          startDate = format(subDays(today, 30), 'yyyy-MM-dd')
          endDate = format(today, 'yyyy-MM-dd')
          break
      }

      const params = new URLSearchParams()
      if (startDate) params.append('start_date', startDate)
      if (endDate) params.append('end_date', endDate)
      if (statusFilter !== 'all') params.append('status', statusFilter)
      params.append('limit', '100')

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
  }, [statusFilter, dateRange])

  useEffect(() => {
    fetchAppointments()
  }, [statusFilter, dateRange, refreshTrigger, fetchAppointments])

  const filteredAppointments = appointments.filter(appointment => {
    if (!searchTerm) return true

    const searchLower = searchTerm.toLowerCase()
    const patientName = `${appointment.patients.first_name} ${appointment.patients.last_name}`.toLowerCase()
    const patientId = appointment.patients.patient_id.toLowerCase()
    const reason = appointment.reason?.toLowerCase() || ''

    return (
      patientName.includes(searchLower) ||
      patientId.includes(searchLower) ||
      reason.includes(searchLower)
    )
  })

  const handleStatusChange = async (appointmentId: string, status: Appointment['status']) => {
    if (onStatusChange) {
      await onStatusChange(appointmentId, status)
      fetchAppointments() // Refresh list
    }
  }

  const handleCancel = async (appointmentId: string) => {
    if (onCancel) {
      await onCancel(appointmentId)
      fetchAppointments() // Refresh list
    }
  }

  const getDateRangeLabel = () => {
    switch (dateRange) {
      case 'today': return 'Today'
      case 'week': return 'Next 7 days'
      case 'month': return 'Next 30 days'
      case 'past': return 'Past 30 days'
      default: return 'All'
    }
  }

  const getStatusCounts = () => {
    return appointments.reduce((acc, appointment) => {
      acc[appointment.status] = (acc[appointment.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  }

  const statusCounts = getStatusCounts()

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Appointments
            </CardTitle>
            <CardDescription>
              {getDateRangeLabel()} • {filteredAppointments.length} appointments
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchAppointments}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 pt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search patients, ID, or reason..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
              <SelectItem value="no-show">No Show</SelectItem>
            </SelectContent>
          </Select>

          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-full sm:w-[160px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">Next 7 days</SelectItem>
              <SelectItem value="month">Next 30 days</SelectItem>
              <SelectItem value="past">Past 30 days</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {appointments.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2">
            <Badge variant="secondary">
              <Users className="h-3 w-3 mr-1" />
              {statusCounts.scheduled || 0} Scheduled
            </Badge>
            <Badge variant="secondary">
              {statusCounts.completed || 0} Completed
            </Badge>
            <Badge variant="outline">
              {statusCounts.cancelled || 0} Cancelled
            </Badge>
            <Badge variant="outline">
              {statusCounts['no-show'] || 0} No Show
            </Badge>
          </div>
        )}
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-3 p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-6 w-20" />
                </div>
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-40" />
              </div>
            ))}
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : filteredAppointments.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No appointments found</h3>
            <p className="text-muted-foreground">
              {searchTerm || statusFilter !== 'all'
                ? 'Try adjusting your search or filters.'
                : 'No appointments scheduled for the selected time period.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAppointments.map((appointment) => (
              <AppointmentCard
                key={appointment.id}
                appointment={appointment}
                onEdit={onEdit}
                onStatusChange={handleStatusChange}
                onCancel={handleCancel}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}