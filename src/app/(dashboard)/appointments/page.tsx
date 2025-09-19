'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar } from 'lucide-react'

export default function AppointmentsPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-lg font-semibold mb-2">Appointments</h1>
        <p className="text-muted-foreground">Schedule and manage patient appointments</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-6 w-6 text-primary" />
            Appointment Management
          </CardTitle>
          <CardDescription>
            Complete appointment scheduling and management system
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center p-8">
            <p className="text-lg text-muted-foreground mb-4">
              Appointment management will be implemented in Phase 4
            </p>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>• Calendar view (daily/weekly/monthly)</p>
              <p>• Appointment scheduling with conflict detection</p>
              <p>• Multiple appointment statuses</p>
              <p>• Automated email reminders</p>
              <p>• Appointment notes and reasons</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}