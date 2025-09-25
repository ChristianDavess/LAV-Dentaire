'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
  User,
  Clock,
  Phone,
  Mail,
  CheckCircle,
  XCircle,
  UserX,
  AlertCircle,
  Edit,
  MoreHorizontal
} from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { Patient, Appointment } from '@/types'

interface AppointmentWithPatient extends Appointment {
  patients: Patient
}

interface AppointmentCardProps {
  appointment: AppointmentWithPatient
  size?: 'sm' | 'md' | 'lg'
  showActions?: boolean
  onClick?: (appointment: AppointmentWithPatient) => void
  onEdit?: (appointment: AppointmentWithPatient) => void
  onStatusChange?: (appointmentId: string, status: Appointment['status']) => void
  className?: string
}

const getStatusConfig = (status: Appointment['status']) => {
  switch (status) {
    case 'scheduled':
      return {
        variant: 'default' as const,
        icon: Clock,
        color: 'text-primary',
        bgColor: 'bg-primary/10 border-primary/20',
        label: 'Scheduled'
      }
    case 'completed':
      return {
        variant: 'secondary' as const,
        icon: CheckCircle,
        color: 'text-primary',
        bgColor: 'bg-primary/10 border-primary/20',
        label: 'Completed'
      }
    case 'cancelled':
      return {
        variant: 'destructive' as const,
        icon: XCircle,
        color: 'text-destructive',
        bgColor: 'bg-destructive/10 border-destructive/20',
        label: 'Cancelled'
      }
    case 'no-show':
      return {
        variant: 'outline' as const,
        icon: UserX,
        color: 'text-muted-foreground',
        bgColor: 'bg-muted/50 border-muted',
        label: 'No Show'
      }
    default:
      return {
        variant: 'outline' as const,
        icon: AlertCircle,
        color: 'text-muted-foreground',
        bgColor: 'bg-muted/50 border-muted',
        label: status
      }
  }
}

export default function AppointmentCard({
  appointment,
  size = 'md',
  showActions = true,
  onClick,
  onEdit,
  onStatusChange,
  className = ''
}: AppointmentCardProps) {
  const statusConfig = getStatusConfig(appointment.status)
  const StatusIcon = statusConfig.icon

  const sizeClasses = {
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6'
  }

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  }

  const handleCardClick = () => {
    if (onClick) {
      onClick(appointment)
    }
  }

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onEdit) {
      onEdit(appointment)
    }
  }

  const handleStatusChange = (e: React.MouseEvent, newStatus: Appointment['status']) => {
    e.stopPropagation()
    if (onStatusChange) {
      onStatusChange(appointment.id, newStatus)
    }
  }

  return (
    <TooltipProvider>
      <Card
        className={`
          ${statusConfig.bgColor}
          ${className}
          transition-all duration-200
          hover:shadow-md
          hover:scale-[1.02]
          ${onClick ? 'cursor-pointer' : ''}
          border-l-4
        `}
        onClick={handleCardClick}
      >
        <CardContent className={sizeClasses[size]}>
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              {/* Patient Info */}
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <User className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-sm truncate">
                    {appointment.patients.first_name} {appointment.patients.last_name}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    ID: {appointment.patients.patient_id}
                  </div>
                </div>
              </div>

              {/* Time Info */}
              <div className="flex items-center gap-4 mb-2">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  <span className={`${textSizeClasses[size]} text-muted-foreground`}>
                    {format(parseISO(`2000-01-01T${appointment.appointment_time}`), 'HH:mm')}
                  </span>
                </div>
                <div className={`${textSizeClasses[size]} text-muted-foreground`}>
                  {appointment.duration_minutes}min
                </div>
              </div>

              {/* Reason */}
              {appointment.reason && (
                <div className={`${textSizeClasses[size]} text-muted-foreground mb-2 truncate`}>
                  {appointment.reason}
                </div>
              )}

              {/* Contact Info (for larger cards) */}
              {size === 'lg' && (
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  {appointment.patients.phone && (
                    <div className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      <span>{appointment.patients.phone}</span>
                    </div>
                  )}
                  {appointment.patients.email && (
                    <div className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      <span className="truncate">{appointment.patients.email}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Status and Actions */}
            <div className="flex flex-col items-end gap-2 ml-3">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge
                    variant={statusConfig.variant}
                    className="flex items-center gap-1 cursor-default"
                  >
                    <StatusIcon className="h-3 w-3" />
                    <span className="text-xs">{statusConfig.label}</span>
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Status: {statusConfig.label}</p>
                </TooltipContent>
              </Tooltip>

              {/* Quick Actions */}
              {showActions && (
                <div className="flex items-center gap-1">
                  {onEdit && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={handleEdit}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Edit appointment</p>
                      </TooltipContent>
                    </Tooltip>
                  )}

                  {onStatusChange && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreHorizontal className="h-3 w-3" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="space-y-1">
                          <p className="text-xs font-medium">Change Status:</p>
                          <div className="flex flex-col gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 justify-start text-xs"
                              onClick={(e) => handleStatusChange(e, 'completed')}
                            >
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Complete
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 justify-start text-xs"
                              onClick={(e) => handleStatusChange(e, 'cancelled')}
                            >
                              <XCircle className="h-3 w-3 mr-1" />
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 justify-start text-xs"
                              onClick={(e) => handleStatusChange(e, 'no-show')}
                            >
                              <UserX className="h-3 w-3 mr-1" />
                              No Show
                            </Button>
                          </div>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  )
}