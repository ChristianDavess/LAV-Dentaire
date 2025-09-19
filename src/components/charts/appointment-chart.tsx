'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar } from 'lucide-react'

export default function AppointmentChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          Appointment Analytics
        </CardTitle>
        <CardDescription>
          Daily, weekly, and monthly appointment statistics
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center p-6">
          <p className="text-muted-foreground">
            Appointment analytics chart will be implemented in Phase 7 using Chart.js with shadcn Tabs for time periods
          </p>
        </div>
      </CardContent>
    </Card>
  )
}