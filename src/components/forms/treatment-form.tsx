'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Image from 'next/image'

export default function TreatmentForm() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Image
            src="/lav-dentaire-logo.svg"
            alt="LAV Dentaire Logo"
            width={20}
            height={20}
            className="h-5 w-5 text-primary"
          />
          Treatment Record Form
        </CardTitle>
        <CardDescription>
          Record new treatment and procedures
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center p-6">
          <p className="text-muted-foreground">
            Treatment form will be implemented in Phase 5 using shadcn Form, Checkbox for procedures, and Input components
          </p>
        </div>
      </CardContent>
    </Card>
  )
}