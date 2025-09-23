'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertCircle } from 'lucide-react'
import { format, startOfMonth, endOfMonth } from 'date-fns'
import { Patient, Appointment } from '@/types'
import CalendarToolbar, { CalendarView } from './calendar-toolbar'
import MonthView from './calendar-views/month-view'
import WeekView from './calendar-views/week-view'
import DayView from './calendar-views/day-view'
import AgendaView from './calendar-views/agenda-view'

interface AppointmentWithPatient extends Appointment {
  patients: Patient
}

interface AppointmentCalendarV2Props {
  selectedDate?: Date
  onDateSelect?: (date: Date | undefined) => void
  onAppointmentClick?: (appointment: AppointmentWithPatient) => void
  onAppointmentEdit?: (appointment: AppointmentWithPatient) => void
  onAppointmentStatusChange?: (appointmentId: string, status: Appointment['status']) => void
  onNewAppointment?: (date?: Date, time?: string) => void
  refreshTrigger?: number
  className?: string
}

export default function AppointmentCalendarV2({
  selectedDate,
  onDateSelect,
  onAppointmentClick,
  onAppointmentEdit,
  onAppointmentStatusChange,
  onNewAppointment,
  refreshTrigger,
  className
}: AppointmentCalendarV2Props) {
  const [appointments, setAppointments] = useState<AppointmentWithPatient[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentDate, setCurrentDate] = useState<Date>(selectedDate || new Date())

  const [currentView, setCurrentView] = useState<CalendarView>('month')

  const fetchAppointments = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      let startDate: string
      let endDate: string

      // Use appropriate date ranges based on current view
      const today = new Date()

      switch (currentView) {
        case 'month':
          // Fetch current month with buffer for edge cases
          const monthStart = startOfMonth(currentDate)
          const monthEnd = endOfMonth(currentDate)
          monthStart.setDate(monthStart.getDate() - 7)
          monthEnd.setDate(monthEnd.getDate() + 7)
          startDate = format(monthStart, 'yyyy-MM-dd')
          endDate = format(monthEnd, 'yyyy-MM-dd')
          break
        case 'week':
          // For week view, get wider range for week boundaries
          const weekStart = new Date(currentDate)
          weekStart.setDate(currentDate.getDate() - 14)
          const weekEnd = new Date(currentDate)
          weekEnd.setDate(currentDate.getDate() + 14)
          startDate = format(weekStart, 'yyyy-MM-dd')
          endDate = format(weekEnd, 'yyyy-MM-dd')
          break
        case 'day':
          // For day view, get broader range around current date
          const dayStart = new Date(currentDate)
          dayStart.setDate(currentDate.getDate() - 7)
          const dayEnd = new Date(currentDate)
          dayEnd.setDate(currentDate.getDate() + 7)
          startDate = format(dayStart, 'yyyy-MM-dd')
          endDate = format(dayEnd, 'yyyy-MM-dd')
          break
        case 'agenda':
          // For agenda, fetch comprehensive range
          const agendaStart = new Date(today)
          agendaStart.setDate(today.getDate() - 30)
          const agendaEnd = new Date(today)
          agendaEnd.setDate(today.getDate() + 90)
          startDate = format(agendaStart, 'yyyy-MM-dd')
          endDate = format(agendaEnd, 'yyyy-MM-dd')
          break
        default:
          startDate = format(startOfMonth(currentDate), 'yyyy-MM-dd')
          endDate = format(endOfMonth(currentDate), 'yyyy-MM-dd')
      }

      const params = new URLSearchParams({
        start_date: startDate,
        end_date: endDate,
        limit: '100'
      })

      const response = await fetch(`/api/appointments?${params.toString()}`, {
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('Failed to fetch appointments')
      }

      const data = await response.json()
      // Handle both nested (data.data.appointments) and direct (data.appointments) structures
      setAppointments(data.data?.appointments || data.appointments || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load appointments')
    } finally {
      setLoading(false)
    }
  }, [currentDate, currentView])

  useEffect(() => {
    fetchAppointments()
  }, [fetchAppointments, refreshTrigger])


  useEffect(() => {
    if (selectedDate) {
      setCurrentDate(selectedDate)
    }
  }, [selectedDate])

  const handleDateChange = (date: Date) => {
    setCurrentDate(date)
    if (onDateSelect) {
      onDateSelect(date)
    }
  }

  const handleViewChange = (view: CalendarView) => {
    setCurrentView(view)
  }

  const handleTodayClick = () => {
    const today = new Date()
    setCurrentDate(today)
    if (onDateSelect) {
      onDateSelect(today)
    }
  }

  const handleDateClick = (date: Date) => {
    setCurrentDate(date)
    setCurrentView('day') // Switch to day view when clicking on a date
    if (onDateSelect) {
      onDateSelect(date)
    }
  }

  const handleTimeSlotClick = (date: Date, time: string) => {
    if (onNewAppointment) {
      onNewAppointment(date, time)
    }
  }

  const handleNewAppointmentFromDate = (date: Date) => {
    if (onNewAppointment) {
      onNewAppointment(date)
    }
  }

  // Each view component handles its own appointment filtering based on dates

  if (loading) {
    return (
      <div className={`${className} h-full`}>
        <div className="space-y-6">
          {/* Toolbar Skeleton */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-8" />
              <Skeleton className="h-8 w-8" />
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-8 w-32" />
            </div>
            <Skeleton className="h-8 w-24" />
          </div>

          {/* Content Skeleton */}
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="grid grid-cols-7 gap-2">
                  {Array.from({ length: 7 }).map((_, i) => (
                    <Skeleton key={i} className="h-6 w-full" />
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-2">
                  {Array.from({ length: 35 }).map((_, i) => (
                    <Skeleton key={i} className="h-32 w-full" />
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={className}>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  const renderCurrentView = () => {
    // Use all appointments for all views - let each view handle its own filtering
    const commonProps = {
      currentDate,
      appointments: appointments,
      onAppointmentClick,
      onAppointmentEdit,
      onAppointmentStatusChange
    }

    switch (currentView) {
      case 'month':
        return (
          <MonthView
            {...commonProps}
            onDateClick={handleDateClick}
            onNewAppointment={handleNewAppointmentFromDate}
          />
        )
      case 'week':
        return (
          <WeekView
            {...commonProps}
            onTimeSlotClick={handleTimeSlotClick}
          />
        )
      case 'day':
        return (
          <DayView
            {...commonProps}
            onTimeSlotClick={handleTimeSlotClick}
          />
        )
      case 'agenda':
        return (
          <AgendaView
            {...commonProps}
          />
        )
      default:
        return (
          <MonthView
            {...commonProps}
            onDateClick={handleDateClick}
            onNewAppointment={handleNewAppointmentFromDate}
          />
        )
    }
  }

  return (
    <div className={`${className} h-full space-y-6`}>
      {/* Calendar Toolbar */}
      <CalendarToolbar
        currentDate={currentDate}
        onDateChange={handleDateChange}
        currentView={currentView}
        onViewChange={handleViewChange}
        appointmentCount={appointments.length}
        onTodayClick={handleTodayClick}
      />

      {/* Calendar View */}
      <div className="flex-1 min-h-0">
        {renderCurrentView()}
      </div>
    </div>
  )
}