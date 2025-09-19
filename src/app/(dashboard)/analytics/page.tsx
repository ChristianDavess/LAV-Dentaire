'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp } from 'lucide-react'

export default function AnalyticsPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-lg font-semibold mb-2">Analytics</h1>
        <p className="text-muted-foreground">View clinic performance and statistics</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-primary" />
            Analytics Dashboard
          </CardTitle>
          <CardDescription>
            Comprehensive analytics and reporting system
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center p-8">
            <p className="text-lg text-muted-foreground mb-4">
              Analytics dashboard will be implemented in Phase 7
            </p>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>• Patient statistics and demographics</p>
              <p>• Appointment analytics (daily/weekly/monthly)</p>
              <p>• Revenue tracking and charts</p>
              <p>• Procedure popularity analytics</p>
              <p>• Export functionality for reports</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}