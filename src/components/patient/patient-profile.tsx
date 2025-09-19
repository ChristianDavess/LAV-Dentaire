'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { User, FileText, Calendar } from 'lucide-react'
import Image from 'next/image'

export default function PatientProfile() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <User className="h-5 w-5" />
            </Avatar>
            <div>
              <CardTitle className="text-xl font-semibold">Patient Profile</CardTitle>
              <CardDescription>
                Comprehensive patient information and history
              </CardDescription>
              <Badge variant="secondary" className="mt-2">P001</Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="info" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="info">Information</TabsTrigger>
          <TabsTrigger value="medical">Medical History</TabsTrigger>
          <TabsTrigger value="appointments">Appointments</TabsTrigger>
          <TabsTrigger value="treatments">Treatments</TabsTrigger>
        </TabsList>

        <TabsContent value="info">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Patient information tab will be implemented in Phase 3
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="medical">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Medical History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Medical history with dynamic checkboxes will be implemented in Phase 3
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appointments">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Appointment History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Appointment history will be implemented in Phase 4
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="treatments">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Image
                  src="/lav-dentaire-logo.svg"
                  alt="LAV Dentaire Logo"
                  width={20}
                  height={20}
                  className="h-5 w-5"
                />
                Treatment History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Treatment history will be implemented in Phase 5
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}