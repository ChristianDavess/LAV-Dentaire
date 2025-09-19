'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { User } from 'lucide-react'

export default function ProfilePage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-lg font-semibold mb-2">Profile</h1>
        <p className="text-muted-foreground">Manage your admin profile and account settings</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-6 w-6 text-primary" />
            Admin Profile
          </CardTitle>
          <CardDescription>
            Manage your account information and preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center p-8">
            <p className="text-lg text-muted-foreground mb-4">
              Profile management will be implemented in Phase 8
            </p>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>• Admin profile management</p>
              <p>• Username/password change functionality</p>
              <p>• Account security settings</p>
              <p>• Profile information updates</p>
              <p>• Account preferences</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}