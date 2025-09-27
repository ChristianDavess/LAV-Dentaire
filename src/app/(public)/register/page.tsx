'use client';

import { useState } from 'react';
import { PatientRegistrationForm } from '@/components/forms/patient-registration-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function RegisterPage() {
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Registration Submitted!</CardTitle>
            <CardDescription className="mt-2">
              Thank you for registering with LAV Dentaire
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-sm text-muted-foreground">
              Your registration has been submitted successfully. Our admin will review your information and you will receive an email notification once your account is approved.
            </p>
            <p className="text-center text-sm text-muted-foreground">
              This usually takes 1-2 business days.
            </p>
            <Button 
              className="w-full" 
              variant="outline"
              onClick={() => setSubmitted(false)}
            >
              Register Another Patient
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900">LAV Dentaire</h1>
          <p className="mt-2 text-gray-600">Patient Registration Portal</p>
        </div>
        <PatientRegistrationForm onSuccess={() => setSubmitted(true)} />
      </div>
    </div>
  );
}