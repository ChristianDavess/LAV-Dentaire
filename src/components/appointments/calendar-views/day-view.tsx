'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Plus, Clock, CalendarDays, Users } from 'lucide-react'
import {
  format,
  isToday,
  parseISO,
  setHours,
  setMinutes
} from 'date-fns'
import { Patient, Appointment } from '@/types'
import AppointmentCard from '../appointment-card-v2'

interface AppointmentWithPatient extends Appointment {
  patients: Patient
}

interface DayViewProps {
  currentDate: Date
  appointments: AppointmentWithPatient[]
  onTimeSlotClick?: (date: Date, time: string) => void
  onAppointmentClick?: (appointment: AppointmentWithPatient) => void
  onAppointmentEdit?: (appointment: AppointmentWithPatient) => void
  onAppointmentStatusChange?: (appointmentId: string, status: Appointment['status']) => void
  className?: string
}

export default function DayView({
  currentDate,
  appointments,
  onTimeSlotClick,
  onAppointmentClick,
  onAppointmentEdit,
  onAppointmentStatusChange,
  className = ''
}: DayViewProps) {
  const isDateToday = isToday(currentDate)
  const dateStr = format(currentDate, 'yyyy-MM-dd')
  const dayAppointments = appointments.filter(
    appointment => appointment.appointment_date === dateStr
  )

  // Generate 30-minute time slots from 8 AM to 6 PM
  const timeSlots = Array.from({ length: 20 }, (_, i) => {
    const hour = 8 + Math.floor(i / 2)
    const minute = (i % 2) * 30
    return format(setHours(setMinutes(new Date(), minute), hour), 'HH:mm')
  })

  const getAppointmentsForTimeSlot = (timeSlot: string): AppointmentWithPatient[] => {
    const slotHour = parseInt(timeSlot.split(':')[0])
    const slotMinute = parseInt(timeSlot.split(':')[1])
    const slotTime = slotHour * 60 + slotMinute

    return dayAppointments.filter(appointment => {
      const appointmentHour = parseInt(appointment.appointment_time.split(':')[0])
      const appointmentMinute = parseInt(appointment.appointment_time.split(':')[1])
      const appointmentTime = appointmentHour * 60 + appointmentMinute

      // Check if appointment starts within this 30-minute slot
      return appointmentTime >= slotTime && appointmentTime < slotTime + 30
    })
  }

  const handleTimeSlotClick = (timeSlot: string) => {
    if (onTimeSlotClick) {
      onTimeSlotClick(currentDate, timeSlot)
    }
  }

  const getStatusCounts = () => {
    const scheduled = dayAppointments.filter(a => a.status === 'scheduled').length
    const completed = dayAppointments.filter(a => a.status === 'completed').length
    const cancelled = dayAppointments.filter(a => a.status === 'cancelled').length
    const noShow = dayAppointments.filter(a => a.status === 'no-show').length

    return { scheduled, completed, cancelled, noShow }
  }

  const statusCounts = getStatusCounts()
  const uniquePatients = new Set(dayAppointments.map(a => a.patient_id)).size

  const renderTimeSlot = (timeSlot: string) => {
    const slotAppointments = getAppointmentsForTimeSlot(timeSlot)
    const hasAppointments = slotAppointments.length > 0

    return (
      <div
        key={timeSlot}
        className={`
          flex border-b border-muted/50 min-h-[100px]
          ${hasAppointments ? 'bg-primary/5' : 'hover:bg-muted/20'}
          transition-colors duration-200
        `}
      >
        {/* Time Label */}
        <div className="w-20 p-3 border-r border-muted/50 bg-muted/30 flex flex-col items-center justify-start">
          <span className="text-sm font-medium text-muted-foreground">
            {format(parseISO(`2000-01-01T${timeSlot}`), 'h:mm')}
          </span>
          <span className="text-xs text-muted-foreground">
            {format(parseISO(`2000-01-01T${timeSlot}`), 'a')}
          </span>
        </div>

        {/* Appointment Slot */}
        <div
          className="flex-1 p-3 cursor-pointer"
          onClick={() => handleTimeSlotClick(timeSlot)}
        >
          {hasAppointments ? (
            <div className="space-y-2">
              {slotAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  onClick={(e) => e.stopPropagation()}
                >
                  <AppointmentCard
                    appointment={appointment}
                    size="lg"
                    showActions={true}
                    onClick={onAppointmentClick}
                    onEdit={onAppointmentEdit}
                    onStatusChange={onAppointmentStatusChange}
                    className="hover:scale-[1.01] shadow-sm"
                  />
                </div>
              ))}
            </div>
          ) : (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    className="w-full h-16 opacity-0 hover:opacity-100 transition-opacity border border-dashed border-muted-foreground/30"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleTimeSlotClick(timeSlot)
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    <span className="text-sm">Schedule appointment at {format(parseISO(`2000-01-01T${timeSlot}`), 'h:mm a')}</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>New appointment at {format(parseISO(`2000-01-01T${timeSlot}`), 'h:mm a')}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className={`space-y-6 ${className}`}>
        {/* Day Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-3">
                  <CalendarDays className="h-5 w-5" />
                  {format(currentDate, 'EEEE, MMMM dd, yyyy')}
                  {isDateToday && (
                    <Badge variant="secondary" className="text-xs">
                      Today
                    </Badge>
                  )}
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {dayAppointments.length} appointment{dayAppointments.length !== 1 ? 's' : ''} scheduled
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3 text-sm">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-primary"></div>
                    <span className="text-muted-foreground">{statusCounts.scheduled} Scheduled</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-secondary"></div>
                    <span className="text-muted-foreground">{statusCounts.completed} Completed</span>
                  </div>
                  {statusCounts.cancelled > 0 && (
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-destructive"></div>
                      <span className="text-muted-foreground">{statusCounts.cancelled} Cancelled</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Day Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Clock className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-semibold">{dayAppointments.length}</p>
                  <p className="text-sm text-muted-foreground">Total Appointments</p>
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
                  <p className="text-2xl font-semibold">{uniquePatients}</p>
                  <p className="text-sm text-muted-foreground">Unique Patients</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-secondary/20 flex items-center justify-center">
                  <CalendarDays className="h-4 w-4 text-secondary-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-semibold">
                    {Math.round((dayAppointments.reduce((sum, a) => sum + a.duration_minutes, 0) / 60) * 10) / 10}h
                  </p>
                  <p className="text-sm text-muted-foreground">Total Duration</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Schedule Grid */}
        <Card>
          <CardContent className="p-0">
            <ScrollArea className="h-[600px]">
              {dayAppointments.length > 0 ? (
                <div>
                  {timeSlots.map(timeSlot => renderTimeSlot(timeSlot))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                    <CalendarDays className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold text-muted-foreground mb-2">
                    No appointments today
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-sm mb-4">
                    {isDateToday
                      ? "Today's schedule is clear. Perfect time to catch up or plan ahead!"
                      : `${format(currentDate, 'EEEE, MMMM dd')} is available for new appointments.`
                    }
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => handleTimeSlotClick('09:00')}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Schedule New Appointment
                  </Button>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  )
}