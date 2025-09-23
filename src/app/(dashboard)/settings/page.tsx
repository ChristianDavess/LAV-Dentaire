'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Settings, Mail, Database, Shield, QrCode } from 'lucide-react'
import ReminderSettings from '@/components/settings/reminder-settings'
import { QRTokenList } from '@/components/qr'

export default function SettingsPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-lg font-semibold mb-2">Settings</h1>
        <p className="text-muted-foreground">Configure system settings and preferences</p>
      </div>

      <Tabs defaultValue="reminders" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="reminders" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Reminders
          </TabsTrigger>
          <TabsTrigger value="qr-management" className="flex items-center gap-2">
            <QrCode className="h-4 w-4" />
            QR Codes
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            System
          </TabsTrigger>
          <TabsTrigger value="database" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Database
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Security
          </TabsTrigger>
        </TabsList>

        <TabsContent value="reminders" className="space-y-6">
          <ReminderSettings />
        </TabsContent>

        <TabsContent value="qr-management" className="space-y-6">
          <QRTokenList showHeader={false} />
        </TabsContent>

        <TabsContent value="system" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                System Settings
              </CardTitle>
              <CardDescription>
                Configure general system settings and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center p-8">
                <p className="text-lg text-muted-foreground mb-4">
                  System settings will be implemented in Phase 8
                </p>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>• Clinic information settings</p>
                  <p>• Business hours configuration</p>
                  <p>• Time zone settings</p>
                  <p>• Default appointment duration</p>
                  <p>• Currency and localization</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="database" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Database Management
              </CardTitle>
              <CardDescription>
                Manage database settings and maintenance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center p-8">
                <p className="text-lg text-muted-foreground mb-4">
                  Database management will be implemented in Phase 8
                </p>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>• Database backup and restore</p>
                  <p>• Data export functionality</p>
                  <p>• Medical history fields management</p>
                  <p>• Custom field configuration</p>
                  <p>• Data retention policies</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security Settings
              </CardTitle>
              <CardDescription>
                Configure security and access control settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center p-8">
                <p className="text-lg text-muted-foreground mb-4">
                  Security settings will be implemented in Phase 8
                </p>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>• User roles and permissions</p>
                  <p>• Password policies</p>
                  <p>• Two-factor authentication</p>
                  <p>• Audit logs and monitoring</p>
                  <p>• Session management</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}