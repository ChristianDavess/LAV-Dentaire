'use client'

import { useState, useEffect, useCallback } from 'react'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { CalendarDays, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react'
import { format, startOfMonth, endOfMonth, isSameDay } from 'date-fns'

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


  const selectedDateAppointments = selectedDate ? getAppointmentsForDate(selectedDate) : []

  if (loading) {
    return (
      <div className={className}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              Appointment Calendar
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-6 w-32" />
              <div className="flex gap-2">
                <Skeleton className="h-8 w-8" />
                <Skeleton className="h-8 w-8" />
              </div>
            </div>
            <Skeleton className="h-80 w-full" />
          </CardContent>
        </Card>
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
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              Appointment Calendar
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                {format(currentMonth, 'MMMM yyyy')}
              </h3>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                  className="h-8 w-8"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                  className="h-8 w-8"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={onDateSelect}
              month={currentMonth}
              onMonthChange={setCurrentMonth}
              className="w-full"
            />
          </CardContent>
        </Card>

        {selectedDate && selectedDateAppointments.length > 0 && (
          <Card className="mt-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <CalendarDays className="h-4 w-4" />
                Appointments for {format(selectedDate, 'MMMM dd, yyyy')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {selectedDateAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => onAppointmentClick?.(appointment)}
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <div className="font-medium text-sm">
                        {appointment.patients.first_name} {appointment.patients.last_name}
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {appointment.patients.patient_id}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {appointment.appointment_time} • {appointment.duration_minutes}min
                    </div>
                    {appointment.reason && (
                      <div className="text-xs text-muted-foreground truncate max-w-xs">
                        {appointment.reason}
                      </div>
                    )}
                  </div>
                  <Badge variant={getStatusBadgeVariant(appointment.status)}>
                    {appointment.status}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </TooltipProvider>
  )
}