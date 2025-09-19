'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar } from 'lucide-react'

export default function AppointmentForm() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          Appointment Booking Form
        </CardTitle>
        <CardDescription>
          Schedule new appointment
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center p-6">
          <p className="text-muted-foreground">
            Appointment form will be implemented in Phase 4 using shadcn Form, Date Picker, and Select components
          </p>
        </div>
      </CardContent>
    </Card>
  )
}