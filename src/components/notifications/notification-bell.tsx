'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Bell } from 'lucide-react'

export default function NotificationBell() {
  return (
    <div className="relative">
      <Button variant="ghost" size="icon" className="relative">
        <Bell className="h-4 w-4" />
        <Badge
          variant="destructive"
          className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
        >
          0
        </Badge>
      </Button>
      <div className="sr-only">0 unread notifications</div>
      <div className="absolute top-full right-0 mt-2 w-80 bg-popover border border-border rounded-md shadow-lg p-4 hidden">
        <p className="text-sm text-muted-foreground text-center">
          Notification system will be implemented in Phase 9
        </p>
      </div>
    </div>
  )
}