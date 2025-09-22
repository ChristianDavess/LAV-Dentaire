'use client'

import { useState, useEffect, useCallback } from 'react'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Calendar as CalendarIcon,
  Clock,
  User,
  CheckCircle,
  XCircle,
  UserX,
  AlertCircle,
  CalendarDays
} from 'lucide-react'
import { format, startOfMonth, endOfMonth, isToday, parseISO, addDays } from 'date-fns'

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

      const response = await fetch(`/api/appointments?${params.toString()}`, {
        credentials: 'include'
      })

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

  const getDensityClass = (count: number) => {
    if (count === 0) return ''
    if (count <= 2) return 'bg-secondary text-secondary-foreground'
    if (count <= 4) return 'bg-primary/10 text-primary'
    return 'bg-destructive/10 text-destructive'
  }

  const getDensityIndicator = (count: number) => {
    if (count === 0) return null
    return (
      <div className={`absolute -top-0.5 -right-0.5 min-w-[12px] h-3 rounded-full text-[10px] font-medium flex items-center justify-center ${getDensityClass(count)}`}>
        {count > 9 ? '9+' : count}
      </div>
    )
  }

  // Default to today if no date selected
  const displayDate = selectedDate || new Date()
  const selectedDateAppointments = getAppointmentsForDate(displayDate)

  if (loading) {
    return (
      <div className={`${className} h-full`}>
        <div className="flex flex-col lg:flex-row gap-6 h-full">
          <div className="w-full lg:w-auto lg:flex-shrink-0 lg:h-full">
            <Card className="h-full flex flex-col">
              <CardHeader>
                <Skeleton className="h-6 w-24" />
              </CardHeader>
              <CardContent className="p-6 flex-1 flex flex-col">
                <Skeleton className="h-80 w-full mb-6 flex-1" />
                <Skeleton className="h-4 w-16 mb-4" />
                <div className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="w-full lg:flex-1 lg:min-w-0 h-full">
            <Card className="h-full flex flex-col">
              <CardHeader>
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-32" />
              </CardHeader>
              <CardContent className="p-0 flex-1">
                <div className="p-6 space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
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
      <div className={`${className} h-full`}>
        <div className="flex flex-col lg:flex-row gap-6 h-full">
          {/* Calendar Panel */}
          <div className="w-full lg:w-auto lg:flex-shrink-0 lg:h-full">
            <Card className="h-full flex flex-col">
              <CardHeader>
                <CardTitle className="text-base font-semibold flex items-center gap-3">
                  <CalendarIcon className="h-4 w-4" />
                  Calendar
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 flex-1 flex flex-col justify-center">
                <div className="flex justify-center mb-8">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={onDateSelect}
                    defaultMonth={currentMonth}
                    onMonthChange={setCurrentMonth}
                    className="rounded-md border-0 scale-110"
                    modifiers={{
                      hasAppointments: (date) => getAppointmentCountForDate(date) > 0,
                      lightLoad: (date) => {
                        const count = getAppointmentCountForDate(date)
                        return count > 0 && count <= 2
                      },
                      busyLoad: (date) => {
                        const count = getAppointmentCountForDate(date)
                        return count >= 3 && count <= 4
                      },
                      fullLoad: (date) => {
                        const count = getAppointmentCountForDate(date)
                        return count >= 5
                      },
                      today: (date) => isToday(date)
                    }}
                    modifiersClassNames={{
                      hasAppointments: "relative",
                      lightLoad: "bg-secondary text-secondary-foreground",
                      busyLoad: "bg-primary/10 text-primary",
                      fullLoad: "bg-destructive/10 text-destructive",
                      today: "ring-2 ring-primary ring-offset-1 font-semibold"
                    }}
                    components={{
                      DayContent: ({ date }) => {
                        const appointmentCount = getAppointmentCountForDate(date)
                        return (
                          <div className="relative w-full h-full flex items-center justify-center">
                            <span>{format(date, 'd')}</span>
                            {getDensityIndicator(appointmentCount)}
                          </div>
                        )
                      }
                    }}
                  />
                </div>
                <div className="mt-auto">
                  <Separator className="mb-6" />
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">Legend</h4>
                    <div className="grid grid-cols-1 gap-3 text-xs">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-secondary"></div>
                        <span className="text-muted-foreground">Light (1-2 appointments)</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-primary/10"></div>
                        <span className="text-muted-foreground">Busy (3-4 appointments)</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-destructive/10"></div>
                        <span className="text-muted-foreground">Full (5+ appointments)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Schedule Panel */}
          <div className="w-full lg:flex-1 lg:min-w-0 h-full">
            <Card className="h-full flex flex-col">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-base font-semibold flex items-center gap-3">
                      <CalendarDays className="h-4 w-4" />
                      {format(displayDate, 'EEEE, MMMM dd, yyyy')}
                      {isToday(displayDate) && (
                        <Badge variant="secondary" className="text-xs">
                          Today
                        </Badge>
                      )}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedDateAppointments.length} appointments scheduled
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant={isToday(displayDate) ? "default" : "outline"}
                          size="sm"
                          onClick={() => onDateSelect?.(new Date())}
                          className="text-xs"
                        >
                          Today
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Go to today's schedule</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0 flex-1 min-h-0">
                <ScrollArea className="h-full">
                  {selectedDateAppointments.length > 0 ? (
                    <div className="p-6 space-y-4">
                      {selectedDateAppointments
                        .sort((a, b) => a.appointment_time.localeCompare(b.appointment_time))
                        .map((appointment, index) => (
                          <div key={appointment.id}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div
                                  className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                                  onClick={() => onAppointmentClick?.(appointment)}
                                >
                                  <div className="flex-shrink-0 text-center">
                                    <div className="text-sm font-semibold">
                                      {format(parseISO(`2000-01-01T${appointment.appointment_time}`), 'HH:mm')}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      {appointment.duration_minutes}min
                                    </div>
                                  </div>

                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                      <span className="font-medium text-sm truncate">
                                        {appointment.patients.first_name} {appointment.patients.last_name}
                                      </span>
                                      <Badge variant="outline" className="text-xs flex-shrink-0">
                                        {appointment.patients.patient_id}
                                      </Badge>
                                    </div>
                                    {appointment.reason && (
                                      <p className="text-xs text-muted-foreground truncate">
                                        {appointment.reason}
                                      </p>
                                    )}
                                  </div>

                                  <div className="flex-shrink-0">
                                    <Badge
                                      variant={
                                        appointment.status === 'scheduled' ? 'default' :
                                        appointment.status === 'completed' ? 'secondary' :
                                        appointment.status === 'cancelled' ? 'destructive' : 'outline'
                                      }
                                      className="flex items-center gap-2"
                                    >
                                      {appointment.status === 'scheduled' && <Clock className="h-4 w-4" />}
                                      {appointment.status === 'completed' && <CheckCircle className="h-4 w-4" />}
                                      {appointment.status === 'cancelled' && <XCircle className="h-4 w-4" />}
                                      {appointment.status === 'no-show' && <UserX className="h-4 w-4" />}
                                      <span className="capitalize">{appointment.status}</span>
                                    </Badge>
                                  </div>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent side="left" className="max-w-xs">
                                <div className="space-y-2">
                                  <p className="font-medium">{appointment.patients.first_name} {appointment.patients.last_name}</p>
                                  <p className="text-xs">Time: {appointment.appointment_time}</p>
                                  <p className="text-xs">Duration: {appointment.duration_minutes} minutes</p>
                                  <p className="text-xs">Status: {appointment.status}</p>
                                  {appointment.reason && <p className="text-xs">Reason: {appointment.reason}</p>}
                                  {appointment.notes && <p className="text-xs">Notes: {appointment.notes}</p>}
                                </div>
                              </TooltipContent>
                            </Tooltip>
                            {index < selectedDateAppointments.length - 1 && (
                              <Separator className="mt-4" />
                            )}
                          </div>
                        ))}

                      {/* Summary Footer */}
                      <div className="mt-6 p-4 bg-muted/30 rounded-lg border">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-secondary-foreground" />
                              <span className="text-muted-foreground">
                                {selectedDateAppointments.filter(a => a.status === 'completed').length} completed
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span className="text-muted-foreground">
                                {selectedDateAppointments.filter(a => a.status === 'scheduled').length} scheduled
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <XCircle className="h-4 w-4 text-destructive" />
                              <span className="text-muted-foreground">
                                {selectedDateAppointments.filter(a => a.status === 'cancelled').length} cancelled
                              </span>
                            </div>
                          </div>
                          <div className="text-muted-foreground">
                            Total: {selectedDateAppointments.reduce((sum, a) => sum + a.duration_minutes, 0)} minutes
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center py-12 px-6">
                      <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                        <CalendarDays className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <h3 className="text-base font-semibold text-muted-foreground mb-2">
                        No appointments scheduled
                      </h3>
                      <p className="text-sm text-muted-foreground max-w-sm">
                        {isToday(displayDate)
                          ? "Today's schedule is clear. Perfect time to catch up or plan ahead!"
                          : `${format(displayDate, 'EEEE, MMMM dd')} is available for new appointments.`}
                      </p>
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}