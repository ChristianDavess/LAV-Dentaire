'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Settings } from 'lucide-react'

export default function SettingsPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-lg font-semibold mb-2">Settings</h1>
        <p className="text-muted-foreground">Configure system settings and preferences</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-6 w-6 text-primary" />
            System Settings
          </CardTitle>
          <CardDescription>
            Configure system-wide settings and preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center p-8">
            <p className="text-lg text-muted-foreground mb-4">
              Settings management will be implemented in Phase 8
            </p>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>• System settings configuration</p>
              <p>• Medical history fields management</p>
              <p>• Clinic information settings</p>
              <p>• Email and notification preferences</p>
              <p>• Backup/export functionality</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}