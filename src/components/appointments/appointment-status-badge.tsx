'use client'

import { Badge } from '@/components/ui/badge'

interface AppointmentStatusBadgeProps {
  status: 'scheduled' | 'completed' | 'cancelled' | 'no-show'
  className?: string
}

const statusConfig = {
  scheduled: {
    label: 'Scheduled',
    variant: 'default' as const
  },
  completed: {
    label: 'Completed',
    variant: 'secondary' as const
  },
  cancelled: {
    label: 'Cancelled',
    variant: 'destructive' as const
  },
  'no-show': {
    label: 'No Show',
    variant: 'outline' as const
  }
}

export default function AppointmentStatusBadge({ status, className }: AppointmentStatusBadgeProps) {
  const config = statusConfig[status]

  return (
    <Badge
      variant={config.variant}
      className={className}
    >
      {config.label}
    </Badge>
  )
}