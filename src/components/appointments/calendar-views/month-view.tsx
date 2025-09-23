'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Plus, MoreHorizontal } from 'lucide-react'
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  getDay
} from 'date-fns'
import { Patient, Appointment } from '@/types'
import AppointmentCard from '../appointment-card-v2'

interface AppointmentWithPatient extends Appointment {
  patients: Patient
}

interface MonthViewProps {
  currentDate: Date
  appointments: AppointmentWithPatient[]
  onDateClick?: (date: Date) => void
  onAppointmentClick?: (appointment: AppointmentWithPatient) => void
  onAppointmentEdit?: (appointment: AppointmentWithPatient) => void
  onAppointmentStatusChange?: (appointmentId: string, status: Appointment['status']) => void
  onNewAppointment?: (date: Date) => void
  className?: string
}

export default function MonthView({
  currentDate,
  appointments,
  onDateClick,
  onAppointmentClick,
  onAppointmentEdit,
  onAppointmentStatusChange,
  onNewAppointment,
  className = ''
}: MonthViewProps) {
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const calendarStart = startOfWeek(monthStart)
  const calendarEnd = endOfWeek(monthEnd)

  const calendarDays = eachDayOfInterval({
    start: calendarStart,
    end: calendarEnd
  })

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  const getAppointmentsForDate = (date: Date): AppointmentWithPatient[] => {
    const dateStr = format(date, 'yyyy-MM-dd')
    return appointments.filter(appointment => appointment.appointment_date === dateStr)
  }

  const handleDateClick = (date: Date) => {
    if (onDateClick) {
      onDateClick(date)
    }
  }

  const handleNewAppointment = (date: Date, e: React.MouseEvent) => {
    e.stopPropagation()
    if (onNewAppointment) {
      onNewAppointment(date)
    }
  }

  const renderDayCell = (date: Date) => {
    const dayAppointments = getAppointmentsForDate(date)
    const isCurrentMonth = isSameMonth(date, currentDate)
    const isDateToday = isToday(date)
    const hasAppointments = dayAppointments.length > 0

    return (
      <Card
        key={date.toISOString()}
        className={`
          h-32 cursor-pointer transition-all duration-200 hover:shadow-md
          ${isCurrentMonth ? 'bg-background' : 'bg-muted/30'}
          ${isDateToday ? 'ring-2 ring-primary ring-offset-1' : ''}
          ${hasAppointments ? 'border-primary/20' : ''}
        `}
        onClick={() => handleDateClick(date)}
      >
        <CardContent className="p-2 h-full flex flex-col">
          {/* Day Header */}
          <div className="flex items-center justify-between mb-2">
            <span
              className={`
                text-sm font-medium
                ${isCurrentMonth ? 'text-foreground' : 'text-muted-foreground'}
                ${isDateToday ? 'text-primary font-semibold' : ''}
              `}
            >
              {format(date, 'd')}
            </span>

            {/* Quick Add Button */}
            {isCurrentMonth && onNewAppointment && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => handleNewAppointment(date, e)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>New appointment on {format(date, 'MMM dd')}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>

          {/* Appointments */}
          <div className="flex-1 space-y-1 overflow-hidden">
            {dayAppointments.slice(0, 2).map((appointment) => (
              <div
                key={appointment.id}
                className="group"
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
            ))}

            {/* Show More Indicator */}
            {dayAppointments.length > 2 && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-full justify-start p-1 text-xs text-muted-foreground hover:text-foreground"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDateClick(date)
                      }}
                    >
                      <MoreHorizontal className="h-3 w-3 mr-1" />
                      +{dayAppointments.length - 2} more
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="space-y-1">
                      <p className="font-medium">
                        {dayAppointments.length} appointment{dayAppointments.length !== 1 ? 's' : ''} on {format(date, 'MMM dd')}
                      </p>
                      {dayAppointments.slice(2).map((appointment) => (
                        <p key={appointment.id} className="text-xs">
                          {format(new Date(`2000-01-01T${appointment.appointment_time}`), 'HH:mm')} - {appointment.patients.first_name} {appointment.patients.last_name}
                        </p>
                      ))}
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>

          {/* Appointment Count Badge */}
          {hasAppointments && (
            <div className="mt-1 flex justify-end">
              <Badge
                variant="secondary"
                className="h-4 px-1 text-xs"
              >
                {dayAppointments.length}
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <TooltipProvider>
      <div className={`space-y-4 ${className}`}>
        {/* Month Header */}
        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((day) => (
            <div
              key={day}
              className="h-8 flex items-center justify-center font-medium text-sm text-muted-foreground"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2 group">
          {calendarDays.map((date) => renderDayCell(date))}
        </div>

        {/* Month Summary */}
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-base font-semibold">
                {format(currentDate, 'MMMM yyyy')} Summary
              </h3>
              <p className="text-sm text-muted-foreground">
                {appointments.length} total appointment{appointments.length !== 1 ? 's' : ''} this month
              </p>
            </div>
            <div className="flex items-center gap-4">
              {/* Status Summary */}
              <div className="flex items-center gap-3 text-sm">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  <span className="text-muted-foreground">
                    {appointments.filter(a => a.status === 'scheduled').length} Scheduled
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span className="text-muted-foreground">
                    {appointments.filter(a => a.status === 'completed').length} Completed
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-red-500"></div>
                  <span className="text-muted-foreground">
                    {appointments.filter(a => a.status === 'cancelled').length} Cancelled
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </TooltipProvider>
  )
}