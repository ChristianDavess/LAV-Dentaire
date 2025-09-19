'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Bell } from 'lucide-react'

export default function NotificationList() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          Notifications
        </CardTitle>
        <CardDescription>
          System notifications and alerts
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center p-6">
          <p className="text-muted-foreground">
            Notification list will be implemented in Phase 9 using shadcn Dropdown Menu and Scroll Area components
          </p>
        </div>
      </CardContent>
    </Card>
  )
}