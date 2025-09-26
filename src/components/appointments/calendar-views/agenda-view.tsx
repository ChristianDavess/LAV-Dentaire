'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { CalendarDays, Clock, Users, TrendingUp } from 'lucide-react'
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isToday,
  isSameDay,
  parseISO
} from 'date-fns'
import { Patient, Appointment } from '@/types'
import AppointmentCard from '../appointment-card-v2'

interface AppointmentWithPatient extends Appointment {
  patients: Patient
}

interface AgendaViewProps {
  currentDate: Date
  appointments: AppointmentWithPatient[]
  onAppointmentClick?: (appointment: AppointmentWithPatient) => void
  onAppointmentEdit?: (appointment: AppointmentWithPatient) => void
  onAppointmentStatusChange?: (appointmentId: string, status: Appointment['status']) => void
  className?: string
}

export default function AgendaView({
  currentDate,
  appointments,
  onAppointmentClick,
  onAppointmentEdit,
  onAppointmentStatusChange,
  className = ''
}: AgendaViewProps) {
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)

  // Group appointments by date
  const groupedAppointments = appointments.reduce((groups, appointment) => {
    const date = appointment.appointment_date
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(appointment)
    return groups
  }, {} as Record<string, AppointmentWithPatient[]>)

  // Sort appointments within each day by time
  Object.keys(groupedAppointments).forEach(date => {
    groupedAppointments[date].sort((a, b) =>
      a.appointment_time.localeCompare(b.appointment_time)
    )
  })

  // Get all dates in the month that have appointments
  const datesWithAppointments = Object.keys(groupedAppointments)
    .map(date => parseISO(date))
    .filter(date => date >= monthStart && date <= monthEnd)
    .sort((a, b) => a.getTime() - b.getTime())

  // Calculate statistics
  const totalAppointments = appointments.length
  const completedAppointments = appointments.filter(a => a.status === 'completed').length
  const scheduledAppointments = appointments.filter(a => a.status === 'scheduled').length
  const cancelledAppointments = appointments.filter(a => a.status === 'cancelled').length
  const totalPatients = new Set(appointments.map(a => a.patient_id)).size

  const renderDateSection = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    const dayAppointments = groupedAppointments[dateStr] || []
    const isDateToday = isToday(date)

    if (dayAppointments.length === 0) return null

    return (
      <div key={dateStr} className="space-y-3">
        {/* Date Header */}
        <div className="flex items-center justify-between sticky top-0 bg-background/95 backdrop-blur-sm z-10 py-2">
          <div className="flex items-center gap-3">
            <CalendarDays className="h-4 w-4 text-primary" />
            <div>
              <h3 className={`text-lg font-semibold ${isDateToday ? 'text-primary' : ''}`}>
                {format(date, 'EEEE, MMMM dd')}
                {isDateToday && (
                  <Badge variant="secondary" className="ml-2 text-xs">
                    Today
                  </Badge>
                )}
              </h3>
              <p className="text-sm text-muted-foreground">
                {dayAppointments.length} appointment{dayAppointments.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          {/* Day Summary */}
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {dayAppointments.filter(a => a.status === 'scheduled').length} scheduled
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {dayAppointments.filter(a => a.status === 'completed').length} completed
            </Badge>
          </div>
        </div>

        {/* Appointments List */}
        <div className="space-y-2 pl-8">
          {dayAppointments.map((appointment, index) => (
            <AppointmentCard
              key={appointment.id}
              appointment={appointment}
              size="md"
              showActions={true}
              onClick={onAppointmentClick}
              onEdit={onAppointmentEdit}
              onStatusChange={onAppointmentStatusChange}
              className="hover:scale-[1.01]"
            />
          ))}
        </div>

        <Separator className="my-6" />
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Month Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <CalendarDays className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{totalAppointments}</p>
                <p className="text-sm text-muted-foreground">Total Appointments</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-secondary/20 flex items-center justify-center">
                <Clock className="h-4 w-4 text-secondary-foreground" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{scheduledAppointments}</p>
                <p className="text-sm text-muted-foreground">Scheduled</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{completedAppointments}</p>
                <p className="text-sm text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
                <Users className="h-4 w-4 text-accent-foreground" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{totalPatients}</p>
                <p className="text-sm text-muted-foreground">Unique Patients</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Appointments List */}
      <Card className="flex-1">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">
            {format(currentDate, 'MMMM yyyy')} Schedule
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[600px]">
            <div className="p-6">
              {datesWithAppointments.length > 0 ? (
                <div className="space-y-6">
                  {datesWithAppointments.map(date => renderDateSection(date))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                    <CalendarDays className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold text-muted-foreground mb-2">
                    No appointments scheduled
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-sm">
                    There are no appointments scheduled for {format(currentDate, 'MMMM yyyy')}.
                    Create a new appointment to get started.
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}