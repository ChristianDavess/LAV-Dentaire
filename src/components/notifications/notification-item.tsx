'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Bell } from 'lucide-react'

interface NotificationItemProps {
  title: string
  message: string
  type: string
  isRead: boolean
  createdAt: string
}

export default function NotificationItem({
  title,
  message,
  type,
  isRead,
  createdAt
}: NotificationItemProps) {
  return (
    <Card className="mb-2">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <Bell className="h-4 w-4 text-primary mt-1" />
            <div className="flex-1">
              <h4 className="text-sm font-medium">{title}</h4>
              <p className="text-sm text-muted-foreground">{message}</p>
              <p className="text-xs text-muted-foreground mt-1">{createdAt}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={isRead ? "secondary" : "default"}>
              {type}
            </Badge>
            {!isRead && (
              <div className="h-2 w-2 bg-primary rounded-full" />
            )}
          </div>
        </div>
        <div className="mt-2 text-xs text-muted-foreground">
          Individual notification items will be implemented in Phase 9
        </div>
      </CardContent>
    </Card>
  )
}