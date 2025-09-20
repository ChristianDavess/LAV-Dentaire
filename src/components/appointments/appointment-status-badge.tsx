'use client'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface AppointmentStatusBadgeProps {
  status: 'scheduled' | 'completed' | 'cancelled' | 'no-show'
  className?: string
}

const statusConfig = {
  scheduled: {
    label: 'Scheduled',
    variant: 'default' as const,
    className: 'bg-blue-100 text-blue-800 hover:bg-blue-200'
  },
  completed: {
    label: 'Completed',
    variant: 'default' as const,
    className: 'bg-green-100 text-green-800 hover:bg-green-200'
  },
  cancelled: {
    label: 'Cancelled',
    variant: 'destructive' as const,
    className: 'bg-red-100 text-red-800 hover:bg-red-200'
  },
  'no-show': {
    label: 'No Show',
    variant: 'secondary' as const,
    className: 'bg-gray-100 text-gray-800 hover:bg-gray-200'
  }
}

export default function AppointmentStatusBadge({ status, className }: AppointmentStatusBadgeProps) {
  const config = statusConfig[status]

  return (
    <Badge
      variant={config.variant}
      className={cn(config.className, className)}
    >
      {config.label}
    </Badge>
  )
}