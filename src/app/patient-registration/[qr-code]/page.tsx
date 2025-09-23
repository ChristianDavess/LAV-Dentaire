'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useQRTokens } from '@/hooks/use-qr-tokens'
import { MobilePatientRegistrationForm } from '@/components/forms/mobile-patient-registration-form'
import Image from 'next/image'
import {
  CheckCircle,
  AlertTriangle,
  Clock,
  XCircle,
  Home,
  Loader2
} from 'lucide-react'

interface PatientRegistrationPageProps {
  params: Promise<{
    'qr-code': string
  }>
}

type ValidationState = 'loading' | 'valid' | 'invalid' | 'expired' | 'used'

export default function PatientRegistrationPage({ params }: PatientRegistrationPageProps) {
  const [qrCode, setQrCode] = useState<string>('')
  const [validationState, setValidationState] = useState<ValidationState>('loading')
  const [tokenInfo, setTokenInfo] = useState<any>(null)
  const [registrationComplete, setRegistrationComplete] = useState(false)

  const { validateToken, registerPatient, isLoading, error } = useQRTokens()

  // Resolve params and validate token
  useEffect(() => {
    const init = async () => {
      try {
        const resolvedParams = await params
        const token = resolvedParams['qr-code']
        setQrCode(token)

        // Validate token
        const response = await fetch('/api/qr-tokens/validate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        })

        if (!response.ok) {
          setValidationState('invalid')
          return
        }

        const data = await response.json()
        if (!data.data.valid) {
          setValidationState(data.data.reason === 'Token has expired' ? 'expired' : 'used')
        } else {
          setValidationState('valid')
          setTokenInfo(data.data.token)
        }
      } catch (err) {
        console.error('Token validation error:', err)
        setValidationState('invalid')
      }
    }

    init()
  }, [params])

  const handleRegistrationSuccess = (patient: any) => {
    setRegistrationComplete(true)
  }

  const getValidationContent = () => {
    switch (validationState) {
      case 'loading':
        return (
          <div className="text-center p-8 space-y-4">
            <div className="flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-48 mx-auto" />
              <Skeleton className="h-3 w-32 mx-auto" />
            </div>
            <p className="text-sm text-muted-foreground">
              Validating registration link...
            </p>
          </div>
        )

      case 'valid':
        if (registrationComplete) {
          return (
            <div className="text-center p-8 space-y-6">
              <div className="flex justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Registration Complete!</h3>
                <p className="text-muted-foreground">
                  Your patient information has been successfully submitted to LAV Dentaire.
                </p>
              </div>
              <Alert className="text-left">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription>
                  <strong>What&apos;s Next?</strong>
                  <br />
                  Our team will review your information and contact you within 24 hours to schedule your first appointment.
                </AlertDescription>
              </Alert>
              <Button onClick={() => window.close()} className="mt-6">
                <Home className="mr-2 h-4 w-4" />
                Close Window
              </Button>
            </div>
          )
        }

        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <div className="flex justify-center">
                <Badge variant="outline" className="gap-2 text-green-600 border-green-200">
                  <CheckCircle className="h-3 w-3" />
                  Valid Registration Link
                </Badge>
              </div>
              {tokenInfo && (
                <p className="text-xs text-muted-foreground">
                  Expires: {new Date(tokenInfo.expires_at).toLocaleDateString()} at{' '}
                  {new Date(tokenInfo.expires_at).toLocaleTimeString()}
                </p>
              )}
            </div>

            <MobilePatientRegistrationForm
              qrToken={qrCode}
              onSuccess={handleRegistrationSuccess}
            />
          </div>
        )

      case 'expired':
        return (
          <div className="text-center p-8 space-y-6">
            <div className="flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-orange-500/10">
                <Clock className="h-8 w-8 text-orange-600" />
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Registration Link Expired</h3>
              <p className="text-muted-foreground">
                This QR code has expired and can no longer be used for registration.
              </p>
            </div>
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Please contact LAV Dentaire directly at our office to schedule your appointment,
                or ask them to generate a new registration link.
              </AlertDescription>
            </Alert>
          </div>
        )

      case 'used':
        return (
          <div className="text-center p-8 space-y-6">
            <div className="flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-500/10">
                <CheckCircle className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Already Registered</h3>
              <p className="text-muted-foreground">
                This registration link has already been used to register a patient.
              </p>
            </div>
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                If you&apos;re trying to register again, please contact LAV Dentaire directly
                at our office for assistance.
              </AlertDescription>
            </Alert>
          </div>
        )

      case 'invalid':
      default:
        return (
          <div className="text-center p-8 space-y-6">
            <div className="flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Invalid Registration Link</h3>
              <p className="text-muted-foreground">
                This QR code is not valid or may have been corrupted.
              </p>
            </div>
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Please contact LAV Dentaire directly at our office to get a valid
                registration link, or ask them to generate a new QR code.
              </AlertDescription>
            </Alert>
            <div className="text-xs text-muted-foreground pt-4 border-t">
              <p>Token ID: <code className="bg-muted px-1 py-0.5 rounded text-xs">{qrCode}</code></p>
            </div>
          </div>
        )
    }
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
              <CardTitle className="text-lg font-semibold">Patient Registration</CardTitle>
              <CardDescription className="text-sm">
                LAV Dentaire - New Patient Information
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {getValidationContent()}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}