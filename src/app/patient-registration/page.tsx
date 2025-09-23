'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MobilePatientRegistrationForm } from '@/components/forms/mobile-patient-registration-form'
import Image from 'next/image'
import {
  CheckCircle,
  Users,
  Heart,
  Shield
} from 'lucide-react'

export default function GenericPatientRegistrationPage() {
  const [registrationComplete, setRegistrationComplete] = useState(false)

  const handleRegistrationSuccess = (patient: any) => {
    setRegistrationComplete(true)
  }

  if (registrationComplete) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          <Card className="border-0 shadow-2xl">
            <CardHeader className="text-center space-y-4 pb-6">
              <div className="flex justify-center">
                <div className="bg-primary/10 p-4 rounded-2xl border border-primary/20 relative shadow-lg">
                  <Image
                    src="/lav-dentaire-logo.svg"
                    alt="LAV Dentaire Logo"
                    width={40}
                    height={40}
                    className="h-10 w-10"
                  />
                  <div className="absolute -top-1 -right-1 bg-green-500 h-3 w-3 rounded-full border-2 border-background animate-pulse" title="Registration Complete" />
                </div>
              </div>
              <div className="space-y-1">
                <CardTitle className="text-lg font-semibold">Registration Complete!</CardTitle>
                <CardDescription className="text-sm">
                  LAV Dentaire - New Patient Information
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center p-8 space-y-6">
                <div className="flex justify-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">Welcome to LAV Dentaire!</h3>
                  <p className="text-muted-foreground">
                    Your patient information has been successfully submitted to our system.
                  </p>
                </div>
                <div className="bg-muted/30 p-4 rounded-lg text-left">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Shield className="h-4 w-4 text-green-600" />
                    What happens next?
                  </h4>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    <li>• Our team will review your information within 24 hours</li>
                    <li>• We&apos;ll contact you to schedule your first appointment</li>
                    <li>• Please bring a valid ID and insurance card to your visit</li>
                    <li>• Arrive 15 minutes early for your appointment</li>
                  </ul>
                </div>
                <p className="text-sm text-muted-foreground">
                  If you have any questions, feel free to call our office directly.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <Card className="border-0 shadow-2xl">
          <CardHeader className="text-center space-y-4 pb-6">
            <div className="flex justify-center">
              <div className="bg-primary/10 p-4 rounded-2xl border border-primary/20 relative shadow-lg">
                <Image
                  src="/lav-dentaire-logo.svg"
                  alt="LAV Dentaire Logo"
                  width={40}
                  height={40}
                  className="h-10 w-10"
                />
                <div className="absolute -top-1 -right-1 bg-primary h-3 w-3 rounded-full border-2 border-background animate-pulse" title="System Online" />
              </div>
            </div>
            <div className="space-y-1">
              <CardTitle className="text-lg font-semibold">New Patient Registration</CardTitle>
              <CardDescription className="text-sm">
                LAV Dentaire - Welcome to our dental family
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center space-y-4 mb-6">
              <Badge variant="outline" className="gap-2 text-primary border-primary/20">
                <Users className="h-3 w-3" />
                Open Registration
              </Badge>
              <p className="text-sm text-muted-foreground">
                Complete your patient registration to join LAV Dentaire
              </p>
            </div>

            <MobilePatientRegistrationForm
              qrToken={null} // No token for generic registration
              onSuccess={handleRegistrationSuccess}
              registrationSource="qr-generic"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}