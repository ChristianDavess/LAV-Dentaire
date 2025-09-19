'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { User } from 'lucide-react'

interface PatientCardProps {
  patientId: string
  firstName: string
  lastName: string
  dateOfBirth?: string
  phone?: string
  email?: string
}

export default function PatientCard({
  patientId,
  firstName,
  lastName,
  dateOfBirth,
  phone,
  email
}: PatientCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <User className="h-5 w-5" />
          </Avatar>
          <div>
            <CardTitle className="text-lg">{firstName} {lastName}</CardTitle>
            <CardDescription>
              <Badge variant="secondary">{patientId}</Badge>
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm">
          {dateOfBirth && <p><span className="font-medium">DOB:</span> {dateOfBirth}</p>}
          {phone && <p><span className="font-medium">Phone:</span> {phone}</p>}
          {email && <p><span className="font-medium">Email:</span> {email}</p>}
        </div>
        <div className="mt-4 text-xs text-muted-foreground">
          Patient cards will be enhanced in Phase 3 with more details and actions
        </div>
      </CardContent>
    </Card>
  )
}