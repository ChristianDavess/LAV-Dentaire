'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Image from 'next/image'

export default function ProcedureChart() {
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
          Procedure Analytics
        </CardTitle>
        <CardDescription>
          Most popular procedures and usage statistics
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center p-6">
          <p className="text-muted-foreground">
            Procedure analytics chart will be implemented in Phase 7 using Chart.js pie/doughnut charts with shadcn Progress bars
          </p>
        </div>
      </CardContent>
    </Card>
  )
}