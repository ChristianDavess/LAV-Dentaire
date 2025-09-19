'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp } from 'lucide-react'

export default function PatientStatsChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Patient Statistics
        </CardTitle>
        <CardDescription>
          Age distribution and demographics
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center p-6">
          <p className="text-muted-foreground">
            Patient statistics chart will be implemented in Phase 7 using Chart.js with react-chartjs-2
          </p>
        </div>
      </CardContent>
    </Card>
  )
}