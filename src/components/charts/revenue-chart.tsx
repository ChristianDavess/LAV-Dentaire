'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp } from 'lucide-react'

export default function RevenueChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Revenue Chart
        </CardTitle>
        <CardDescription>
          Monthly revenue tracking and trends
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center p-6">
          <p className="text-muted-foreground">
            Revenue chart will be implemented in Phase 7 using Chart.js line/bar charts with peso currency formatting
          </p>
        </div>
      </CardContent>
    </Card>
  )
}