'use client'

import { useState, useEffect, useCallback } from 'react'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { CalendarDays, ChevronLeft, ChevronRight, AlertCircle, Calendar as CalendarIcon } from 'lucide-react'
import { format, startOfMonth, endOfMonth, isSameDay, addDays, startOfWeek, addWeeks } from 'date-fns'

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

interface AppointmentCalendarProps {
  selectedDate?: Date
  onDateSelect?: (date: Date | undefined) => void
  onAppointmentClick?: (appointment: Appointment) => void
  refreshTrigger?: number
  className?: string
}

export default function AppointmentCalendar({
  selectedDate,
  onDateSelect,
  onAppointmentClick,
  refreshTrigger,
  className
}: AppointmentCalendarProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date())

  // Set today as default if no date is selected on first load
  useEffect(() => {
    if (!selectedDate && onDateSelect) {
      onDateSelect(new Date())
    }
  }, [])

  const fetchAppointments = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const monthStart = format(startOfMonth(currentMonth), 'yyyy-MM-dd')
      const monthEnd = format(endOfMonth(currentMonth), 'yyyy-MM-dd')

      const params = new URLSearchParams({
        start_date: monthStart,
        end_date: monthEnd,
        limit: '100'
      })

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
  }, [currentMonth])

  useEffect(() => {
    fetchAppointments()
  }, [fetchAppointments, refreshTrigger])

  const getAppointmentsForDate = (date: Date): Appointment[] => {
    const dateStr = format(date, 'yyyy-MM-dd')
    return appointments.filter(appointment => appointment.appointment_date === dateStr)
  }

  const getAppointmentCountForDate = (date: Date): number => {
    return getAppointmentsForDate(date).length
  }

  const getStatusBadgeVariant = (status: Appointment['status']) => {
    switch (status) {
      case 'scheduled':
        return 'default' as const
      case 'completed':
        return 'secondary' as const
      case 'cancelled':
        return 'destructive' as const
      case 'no-show':
        return 'outline' as const
      default:
        return 'default' as const
    }
  }


  // Default to today if no date selected
  const displayDate = selectedDate || new Date()
  const selectedDateAppointments = getAppointmentsForDate(displayDate)

  if (loading) {
    return (
      <div className={className}>
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
          {/* Calendar Panel Skeleton */}
          <div className="w-full lg:w-auto lg:flex-shrink-0">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-80 w-full" />
              </CardContent>
            </Card>
          </div>

          {/* Schedule Panel Skeleton */}
          <div className="w-full lg:flex-1 lg:min-w-0">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
              </CardContent>
            </Card>
          </div>
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

  return (
    <TooltipProvider>
      <div className={className}>
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
          {/* Left Panel - Calendar */}
          <div className="w-full lg:w-auto lg:flex-shrink-0">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  Calendar
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 flex justify-center">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={onDateSelect}
                  defaultMonth={currentMonth}
                  onMonthChange={setCurrentMonth}
                  numberOfMonths={2}
                  className="rounded-lg border shadow-sm"
                  modifiers={{
                    hasAppointments: (date) => getAppointmentCountForDate(date) > 0
                  }}
                  modifiersClassNames={{
                    hasAppointments: "relative after:absolute after:-top-1 after:-right-1 after:bg-primary after:text-primary-foreground after:text-xs after:rounded-full after:h-4 after:w-4 after:flex after:items-center after:justify-center after:font-medium after:content-['•']"
                  }}
                />
              </CardContent>
            </Card>
          </div>

          {/* Right Panel - Schedule/Appointments */}
          <div className="w-full lg:flex-1 lg:min-w-0">
            <Card>
              <CardHeader className="pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <CalendarDays className="h-5 w-5" />
                    <span className="hidden sm:inline">Schedule for {format(displayDate, 'EEEE, MMMM dd, yyyy')}</span>
                    <span className="sm:hidden">{format(displayDate, 'MMM dd, yyyy')}</span>
                  </CardTitle>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onDateSelect?.(new Date())}
                        className="text-xs"
                      >
                        Today
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onDateSelect?.(addDays(new Date(), 1))}
                        className="text-xs"
                      >
                        Tomorrow
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onDateSelect?.(addDays(new Date(), 7))}
                        className="text-xs hidden sm:inline-flex"
                      >
                        Next Week
                      </Button>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {selectedDateAppointments.length} appointments
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {selectedDateAppointments.length > 0 ? (
                  <div className="space-y-3">
                    {selectedDateAppointments
                      .sort((a, b) => a.appointment_time.localeCompare(b.appointment_time))
                      .map((appointment) => (
                        <div
                          key={appointment.id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors gap-2 sm:gap-0"
                          onClick={() => onAppointmentClick?.(appointment)}
                        >
                          <div className="space-y-1 flex-1">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                              <div className="font-medium text-sm text-primary">
                                {appointment.appointment_time}
                              </div>
                              <div className="font-medium text-sm">
                                {appointment.patients.first_name} {appointment.patients.last_name}
                              </div>
                              <Badge variant="outline" className="text-xs w-fit">
                                {appointment.patients.patient_id}
                              </Badge>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Duration: {appointment.duration_minutes} minutes
                            </div>
                            {appointment.reason && (
                              <div className="text-xs text-muted-foreground">
                                {appointment.reason}
                              </div>
                            )}
                          </div>
                          <Badge variant={getStatusBadgeVariant(appointment.status)}>
                            {appointment.status}
                          </Badge>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-8 sm:py-12">
                    <CalendarDays className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-base sm:text-lg font-medium text-muted-foreground mb-2">
                      No appointments scheduled
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {isSameDay(displayDate, new Date())
                        ? "Today is free for new appointments"
                        : `${format(displayDate, 'EEEE, MMMM dd')} is available`}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}