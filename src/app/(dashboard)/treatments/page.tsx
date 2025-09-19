'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Image from 'next/image'

export default function TreatmentsPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-lg font-semibold mb-2">Treatments</h1>
        <p className="text-muted-foreground">Manage treatments and procedures</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Image
              src="/lav-dentaire-logo.svg"
              alt="LAV Dentaire Logo"
              width={24}
              height={24}
              className="h-6 w-6"
            />
            Treatment & Procedures
          </CardTitle>
          <CardDescription>
            Comprehensive treatment and procedure management
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center p-8">
            <p className="text-lg text-muted-foreground mb-4">
              Treatment management will be implemented in Phase 5
            </p>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>• Multiple procedure selection per treatment</p>
              <p>• Cost calculation with PHP currency</p>
              <p>• Payment tracking (pending/partial/paid)</p>
              <p>• Treatment notes and documentation</p>
              <p>• Invoice generation</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}