'use client'

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Plus, Clock } from 'lucide-react'
import {
  format,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isToday,
  isSameDay,
  parseISO,
  addHours,
  setHours,
  setMinutes
} from 'date-fns'
import { Patient, Appointment } from '@/types'
import AppointmentCard from '../appointment-card-v2'

interface AppointmentWithPatient extends Appointment {
  patients: Patient
}

interface WeekViewProps {
  currentDate: Date
  appointments: AppointmentWithPatient[]
  onTimeSlotClick?: (date: Date, time: string) => void
  onAppointmentClick?: (appointment: AppointmentWithPatient) => void
  onAppointmentEdit?: (appointment: AppointmentWithPatient) => void
  onAppointmentStatusChange?: (appointmentId: string, status: Appointment['status']) => void
  className?: string
}

export default function WeekView({
  currentDate,
  appointments,
  onTimeSlotClick,
  onAppointmentClick,
  onAppointmentEdit,
  onAppointmentStatusChange,
  className = ''
}: WeekViewProps) {
  const weekStart = startOfWeek(currentDate)
  const weekEnd = endOfWeek(currentDate)
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd })

  // Generate time slots from 8 AM to 6 PM
  const timeSlots = Array.from({ length: 11 }, (_, i) => {
    const hour = 8 + i
    return format(setHours(setMinutes(new Date(), 0), hour), 'HH:mm')
  })

  const getAppointmentsForDateTime = (date: Date, timeSlot: string): AppointmentWithPatient[] => {
    const dateStr = format(date, 'yyyy-MM-dd')
    const slotHour = parseInt(timeSlot.split(':')[0])

    return appointments.filter(appointment => {
      if (appointment.appointment_date !== dateStr) return false

      const appointmentHour = parseInt(appointment.appointment_time.split(':')[0])
      const appointmentMinute = parseInt(appointment.appointment_time.split(':')[1])
      const slotTime = slotHour * 60
      const appointmentTime = appointmentHour * 60 + appointmentMinute

      // Check if appointment falls within this hour slot
      return appointmentTime >= slotTime && appointmentTime < slotTime + 60
    })
  }

  const handleTimeSlotClick = (date: Date, timeSlot: string) => {
    if (onTimeSlotClick) {
      onTimeSlotClick(date, timeSlot)
    }
  }

  const renderTimeSlot = (date: Date, timeSlot: string) => {
    const slotAppointments = getAppointmentsForDateTime(date, timeSlot)
    const hasAppointments = slotAppointments.length > 0
    const isDateToday = isToday(date)

    return (
      <div
        key={`${format(date, 'yyyy-MM-dd')}-${timeSlot}`}
        className={`
          min-h-[80px] p-2 border-b border-r border-muted/50
          transition-colors duration-200 hover:bg-muted/30
          ${isDateToday ? 'bg-primary/5' : ''}
          ${hasAppointments ? 'bg-blue-50/50' : ''}
          cursor-pointer
        `}
        onClick={() => handleTimeSlotClick(date, timeSlot)}
      >
        <div className="space-y-1">
          {slotAppointments.length > 0 ? (
            slotAppointments.map((appointment) => (
              <div
                key={appointment.id}
                onClick={(e) => e.stopPropagation()}
              >
                <AppointmentCard
                  appointment={appointment}
                  size="sm"
                  showActions={false}
                  onClick={onAppointmentClick}
                  onEdit={onAppointmentEdit}
                  onStatusChange={onAppointmentStatusChange}
                  className="border-0 shadow-none hover:shadow-sm"
                />
              </div>
            ))
          ) : (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full h-8 opacity-0 hover:opacity-100 transition-opacity border border-dashed border-muted-foreground/30"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleTimeSlotClick(date, timeSlot)
                    }}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>New appointment at {timeSlot} on {format(date, 'MMM dd')}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>
    )
  }

  const renderDayHeader = (date: Date) => {
    const isDateToday = isToday(date)
    const dayAppointments = appointments.filter(
      appointment => appointment.appointment_date === format(date, 'yyyy-MM-dd')
    )

    return (
      <div
        key={format(date, 'yyyy-MM-dd')}
        className={`
          h-16 p-3 border-b border-r border-muted/50 flex flex-col items-center justify-center
          ${isDateToday ? 'bg-primary/10' : 'bg-muted/30'}
        `}
      >
        <div className={`text-sm font-medium ${isDateToday ? 'text-primary' : 'text-foreground'}`}>
          {format(date, 'EEE')}
        </div>
        <div className={`text-lg font-semibold ${isDateToday ? 'text-primary' : 'text-foreground'}`}>
          {format(date, 'd')}
        </div>
        {dayAppointments.length > 0 && (
          <Badge variant={isDateToday ? 'default' : 'secondary'} className="mt-1 text-xs h-4">
            {dayAppointments.length}
          </Badge>
        )}
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className={`space-y-4 ${className}`}>
        {/* Week Header */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold">
                  {format(weekStart, 'MMM dd')} - {format(weekEnd, 'MMM dd, yyyy')}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {appointments.length} appointment{appointments.length !== 1 ? 's' : ''} this week
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  <span className="text-sm text-muted-foreground">
                    {appointments.filter(a => a.status === 'scheduled').length} Scheduled
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span className="text-sm text-muted-foreground">
                    {appointments.filter(a => a.status === 'completed').length} Completed
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Week Grid */}
        <Card>
          <CardContent className="p-0">
            <ScrollArea className="h-[600px]">
              <div className="grid grid-cols-8 min-w-[800px]">
                {/* Time Column Header */}
                <div className="h-16 p-3 border-b border-r border-muted/50 bg-muted/30 flex items-center justify-center">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </div>

                {/* Day Headers */}
                {weekDays.map(date => renderDayHeader(date))}

                {/* Time Slots */}
                {timeSlots.map((timeSlot) => (
                  <React.Fragment key={timeSlot}>
                    {/* Time Label */}
                    <div className="h-20 p-2 border-b border-r border-muted/50 bg-muted/30 flex items-center justify-center">
                      <span className="text-sm font-medium text-muted-foreground">
                        {format(parseISO(`2000-01-01T${timeSlot}`), 'h:mm a')}
                      </span>
                    </div>

                    {/* Day Columns */}
                    {weekDays.map(date => renderTimeSlot(date, timeSlot))}
                  </React.Fragment>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  )
}