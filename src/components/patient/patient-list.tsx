'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table } from '@/components/ui/table'
import { Users } from 'lucide-react'

export default function PatientList() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Patient List
        </CardTitle>
        <CardDescription>
          Comprehensive patient listing with search and filters
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center p-6">
          <p className="text-muted-foreground">
            Patient list will be implemented in Phase 3 using shadcn Table, Input (search), and Select (filters) components
          </p>
        </div>
      </CardContent>
    </Card>
  )
}