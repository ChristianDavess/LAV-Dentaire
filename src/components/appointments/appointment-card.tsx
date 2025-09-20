'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Calendar, Clock, User, Phone, Mail, MoreVertical, Edit, Trash2, CheckCircle, XCircle } from 'lucide-react'
import AppointmentStatusBadge from './appointment-status-badge'
import { format, parseISO } from 'date-fns'

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

interface AppointmentCardProps {
  appointment: Appointment
  onEdit?: (appointment: Appointment) => void
  onStatusChange?: (appointmentId: string, status: Appointment['status']) => void
  onCancel?: (appointmentId: string) => void
  className?: string
}

export default function AppointmentCard({
  appointment,
  onEdit,
  onStatusChange,
  onCancel,
  className
}: AppointmentCardProps) {
  const formatTime = (time: string) => {
    return format(parseISO(`2000-01-01T${time}`), 'h:mm a')
  }

  const formatDate = (date: string) => {
    return format(parseISO(date), 'MMM dd, yyyy')
  }

  const getEndTime = (startTime: string, duration: number) => {
    const start = parseISO(`2000-01-01T${startTime}`)
    const end = new Date(start.getTime() + duration * 60000)
    return format(end, 'h:mm a')
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base font-semibold">
              {appointment.patients.first_name} {appointment.patients.last_name}
            </CardTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="h-4 w-4" />
              {appointment.patients.patient_id}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <AppointmentStatusBadge status={appointment.status} />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onEdit && (
                  <DropdownMenuItem onClick={() => onEdit(appointment)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                )}
                {onStatusChange && appointment.status !== 'completed' && (
                  <DropdownMenuItem onClick={() => onStatusChange(appointment.id, 'completed')}>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Mark Complete
                  </DropdownMenuItem>
                )}
                {onStatusChange && appointment.status !== 'no-show' && (
                  <DropdownMenuItem onClick={() => onStatusChange(appointment.id, 'no-show')}>
                    <XCircle className="h-4 w-4 mr-2" />
                    Mark No Show
                  </DropdownMenuItem>
                )}
                {onCancel && appointment.status === 'scheduled' && (
                  <DropdownMenuItem
                    onClick={() => onCancel(appointment.id)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Cancel
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span>{formatDate(appointment.appointment_date)}</span>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span>
            {formatTime(appointment.appointment_time)} - {getEndTime(appointment.appointment_time, appointment.duration_minutes)}
          </span>
          <Badge variant="outline" className="ml-2">
            {appointment.duration_minutes}m
          </Badge>
        </div>

        {appointment.patients.phone && (
          <div className="flex items-center gap-2 text-sm">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <span>{appointment.patients.phone}</span>
          </div>
        )}

        {appointment.patients.email && (
          <div className="flex items-center gap-2 text-sm">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span className="truncate">{appointment.patients.email}</span>
          </div>
        )}

        {appointment.reason && (
          <div className="pt-2 border-t">
            <p className="text-sm">
              <span className="font-medium">Reason: </span>
              {appointment.reason}
            </p>
          </div>
        )}

        {appointment.notes && (
          <div className={appointment.reason ? '' : 'pt-2 border-t'}>
            <p className="text-sm text-muted-foreground">
              <span className="font-medium">Notes: </span>
              {appointment.notes}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}