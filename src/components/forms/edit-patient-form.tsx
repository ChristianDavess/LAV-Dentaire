'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { PatientSchema, patientSchema } from '@/lib/validations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { MedicalHistorySection } from './medical-history-section'
import {
  Edit,
  User,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Users,
  Heart,
  AlertTriangle,
  Loader2,
  CheckCircle,
  FileText,
  Activity
} from 'lucide-react'

interface EditPatientFormProps {
  patient: {
    id: string
    patient_id: string
    first_name: string
    last_name: string
    middle_name: string | null
    date_of_birth: string | null
    gender: string | null
    phone: string | null
    email: string | null
    address: string | null
    emergency_contact_name: string | null
    emergency_contact_phone: string | null
    medical_history: Record<string, any>
    notes: string | null
    created_at: string
    updated_at: string
  }
  trigger?: React.ReactNode
  onSuccess?: (patient: any) => void
}

export function EditPatientForm({ patient, trigger, onSuccess }: EditPatientFormProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [currentStep, setCurrentStep] = useState(1)
  const [medicalHistory, setMedicalHistory] = useState<Record<string, any>>(patient.medical_history || {})


  const form = useForm<any>({
    resolver: zodResolver(patientSchema) as any,
    defaultValues: {
      first_name: patient.first_name || '',
      last_name: patient.last_name || '',
      middle_name: patient.middle_name || '',
      date_of_birth: patient.date_of_birth || '',
      gender: patient.gender || '',
      phone: patient.phone || '',
      email: patient.email || '',
      address: patient.address || '',
      emergency_contact_name: patient.emergency_contact_name || '',
      emergency_contact_phone: patient.emergency_contact_phone || '',
      medical_history: patient.medical_history || {},
      notes: patient.notes || '',
    },
  })

  const totalSteps = 3
  const progress = (currentStep / totalSteps) * 100

  // Helper function to normalize phone numbers for form compatibility
  const normalizePhoneNumber = (phone: string | null | undefined): string => {
    if (!phone) return ''

    let normalized = phone.toString().trim()
    // Remove spaces and dashes
    normalized = normalized.replace(/[\s-]/g, '')

    // Convert international format (+63-9xx-xxx-xxxx) to domestic (09xxxxxxxxx)
    if (normalized.startsWith('+63')) {
      normalized = '0' + normalized.substring(3)
    } else if (normalized.startsWith('63') && normalized.length === 12) {
      normalized = '0' + normalized.substring(2)
    }

    // Ensure it matches expected format, otherwise return empty string
    if (normalized.match(/^09\d{9}$/)) {
      return normalized
    }

    return ''
  }

  // Reset medical history and form when dialog opens
  useEffect(() => {
    if (isOpen) {
      setMedicalHistory(patient.medical_history || {})
      setCurrentStep(1)
      setError('')
      // Clear any form errors
      form.clearErrors()
      // Reset form with current patient data, normalize phone numbers for compatibility
      form.reset({
        first_name: patient.first_name || '',
        last_name: patient.last_name || '',
        middle_name: patient.middle_name || '',
        date_of_birth: patient.date_of_birth || '',
        gender: patient.gender || '',
        phone: normalizePhoneNumber(patient.phone),
        email: patient.email || '',
        address: patient.address || '',
        emergency_contact_name: patient.emergency_contact_name || '',
        emergency_contact_phone: normalizePhoneNumber(patient.emergency_contact_phone),
        medical_history: patient.medical_history || {},
        notes: patient.notes || '',
      })
    }
  }, [isOpen, patient, form])

  const onSubmit = async (data: any) => {
    console.log('onSubmit called with currentStep:', currentStep, 'totalSteps:', totalSteps)

    // Guard: Only process submission on final step
    if (currentStep < totalSteps) {
      console.log('🛑 PREVENTED form submission on step', currentStep, '- calling nextStep()')
      nextStep()
      return
    }

    console.log('✅ PROCEEDING with form submission on final step', currentStep)
    // This function only runs when on final step (step 3)
    setIsLoading(true)
    setError('')

    try {
      const patientData = {
        ...data,
        medical_history: medicalHistory
      }

      console.log('Updating patient with data:', patientData)

      const response = await fetch(`/api/patients/${patient.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(patientData),
      })

      if (!response.ok) {
        let errorMessage = 'Failed to update patient'

        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
        } catch (parseError) {
          // Server returned HTML error page instead of JSON
          errorMessage = `Server error (${response.status}). Please try again.`
        }

        throw new Error(errorMessage)
      }

      const responseData = await response.json()
      const updatedPatient = responseData.patient
      console.log('Patient updated successfully:', updatedPatient)

      // Success handling
      setIsOpen(false)
      setCurrentStep(1)
      // Don't clear medical history - keep the updated state

      if (onSuccess) {
        console.log('🔄 Calling onSuccess callback for patient edit')
        onSuccess(updatedPatient)
        console.log('✅ onSuccess callback completed')
      } else {
        console.log('⚠️ No onSuccess callback provided')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleMedicalHistoryChange = (fieldId: string, value: any) => {
    setMedicalHistory(prev => ({
      ...prev,
      [fieldId]: value
    }))
  }

  const nextStep = async () => {
    // Clear all form errors before validation
    form.clearErrors()

    // Validate current step before proceeding
    if (currentStep === 1) {
      // Validate required fields for step 1
      const isValid = await form.trigger(['first_name', 'last_name', 'date_of_birth'])
      if (!isValid) return

      // Additional date validation
      const dateOfBirth = form.getValues('date_of_birth')
      if (dateOfBirth) {
        const birthDate = new Date(dateOfBirth)
        const today = new Date()

        if (birthDate > today) {
          form.setError('date_of_birth', {
            type: 'manual',
            message: 'Birth date cannot be in the future'
          })
          return
        }

        // Check if it's a valid date
        if (isNaN(birthDate.getTime())) {
          form.setError('date_of_birth', {
            type: 'manual',
            message: 'Please enter a valid date'
          })
          return
        }
      }
    } else if (currentStep === 2) {
      // Validate contact fields for step 2
      const isValid = await form.trigger(['phone', 'email', 'emergency_contact_phone'])
      if (!isValid) return

      // Additional phone format validation
      const phoneValue = form.getValues('phone')
      const emergencyPhoneValue = form.getValues('emergency_contact_phone')

      if (phoneValue && !phoneValue.match(/^09\d{9}$/)) {
        form.setError('phone', {
          type: 'manual',
          message: 'Phone must be exactly 11 digits starting with 09'
        })
        return
      }

      if (emergencyPhoneValue && !emergencyPhoneValue.match(/^09\d{9}$/)) {
        form.setError('emergency_contact_phone', {
          type: 'manual',
          message: 'Phone must be exactly 11 digits starting with 09'
        })
        return
      }
    }

    setCurrentStep(prev => {
      const newStep = Math.min(prev + 1, totalSteps)
      console.log('🔄 nextStep: transitioning from step', prev, 'to step', newStep)
      return newStep
    })
  }

  const prevStep = () => {
    // Clear form errors when going back
    form.clearErrors()
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }

  const defaultTrigger = (
    <Button variant="outline" size="sm">
      <Edit className="mr-2 h-4 w-4" />
      Edit Patient
    </Button>
  )

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Edit className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-xl font-semibold">Edit Patient</DialogTitle>
              <DialogDescription className="text-base">
                Update patient information and medical history for {patient.first_name} {patient.last_name}
              </DialogDescription>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="font-medium">Step {currentStep} of {totalSteps}</span>
              <span className="text-muted-foreground">{Math.round(progress)}% complete</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </DialogHeader>

        <Form {...form}>
          <div
            className="space-y-6"
            onKeyDown={(e) => {
              // Prevent Enter key from submitting form unless on final step
              if (e.key === 'Enter' && currentStep < totalSteps) {
                e.preventDefault()
                nextStep()
              }
            }}
          >
            {/* Step 1: Basic Information */}
            {currentStep === 1 && (
              <Card className="border-0 shadow-none">
                <CardHeader className="px-0 pb-4">
                  <CardTitle className="flex items-center gap-3 text-lg font-semibold">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <User className="h-4 w-4" />
                    </div>
                    Personal Information
                  </CardTitle>
                  <CardDescription>
                    Basic patient details and identification
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-0 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="first_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter first name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="last_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter last name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <FormField
                      control={form.control}
                      name="middle_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Middle Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter middle name (optional)" {...field} value={field.value || ''} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="date_of_birth"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date of Birth</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} value={field.value || ''} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="gender"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Gender</FormLabel>
                          <Select value={field.value || ''} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select gender" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="male">Male</SelectItem>
                              <SelectItem value="female">Female</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                              <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 2: Contact Information */}
            {currentStep === 2 && (
              <Card className="border-0 shadow-none">
                <CardHeader className="px-0 pb-4">
                  <CardTitle className="flex items-center gap-3 text-lg font-semibold">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Phone className="h-4 w-4" />
                    </div>
                    Contact Information
                  </CardTitle>
                  <CardDescription>
                    Communication details and emergency contact
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-0 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl>
                            <Input
                              type="tel"
                              placeholder="09XXXXXXXXX"
                              maxLength={11}
                              {...field}
                              value={field.value || ''}
                              onChange={(e) => {
                                let value = e.target.value.replace(/\D/g, '') // Remove non-digits
                                if (value.startsWith('9') && value.length <= 10) {
                                  value = '09' + value.slice(1)
                                } else if (!value.startsWith('09') && value.length > 0 && value.length <= 9) {
                                  value = '09' + value
                                }
                                if (value.length > 11) {
                                  value = value.slice(0, 11)
                                }
                                field.onChange(value)
                              }}
                            />
                          </FormControl>
                          <div className="text-xs text-muted-foreground mt-1">
                            Format: 09XXXXXXXXX (11 digits)
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="patient@example.com" {...field} value={field.value || ''} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Complete address including barangay, city, and postal code"
                            className="resize-none"
                            {...field}
                            value={field.value || ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Separator className="my-6" />

                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-primary" />
                      <h4 className="text-base font-semibold">Emergency Contact</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="emergency_contact_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Contact Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Emergency contact full name" {...field} value={field.value || ''} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="emergency_contact_phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Contact Phone</FormLabel>
                            <FormControl>
                              <Input
                                type="tel"
                                placeholder="09XXXXXXXXX"
                                maxLength={11}
                                {...field}
                                value={field.value || ''}
                                onChange={(e) => {
                                  let value = e.target.value.replace(/\D/g, '') // Remove non-digits
                                  if (value.startsWith('9') && value.length <= 10) {
                                    value = '09' + value.slice(1)
                                  } else if (!value.startsWith('09') && value.length > 0 && value.length <= 9) {
                                    value = '09' + value
                                  }
                                  if (value.length > 11) {
                                    value = value.slice(0, 11)
                                  }
                                  field.onChange(value)
                                }}
                              />
                            </FormControl>
                            <div className="text-xs text-muted-foreground mt-1">
                              Format: 09XXXXXXXXX (11 digits)
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 3: Medical History */}
            {currentStep === 3 && (
              <Card className="border-0 shadow-none">
                <CardContent className="px-0 space-y-6">
                  <MedicalHistorySection
                    medicalHistory={medicalHistory}
                    onMedicalHistoryChange={handleMedicalHistoryChange}
                  />

                  <Separator className="my-6" />

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Additional Notes
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Any additional medical information, special instructions, or notes about the patient..."
                            className="resize-none min-h-[120px]"
                            {...field}
                            value={field.value || ''}
                          />
                        </FormControl>
                        <FormDescription>
                          Include any relevant medical history, current medications, or special considerations
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            )}

            {/* Error Display */}
            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-6 border-t">
              <div className="flex gap-2">
                {currentStep > 1 && (
                  <Button type="button" variant="outline" onClick={prevStep} disabled={isLoading}>
                    Previous
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                {currentStep < totalSteps ? (
                  <Button type="button" onClick={nextStep} disabled={isLoading}>
                    Next Step
                  </Button>
                ) : (
                  <Button
                    type="button"
                    disabled={isLoading}
                    onClick={async () => {
                      console.log('🔥 Manual submit button clicked on step', currentStep)

                      // Validate all form fields before submission
                      const isValid = await form.trigger()
                      if (!isValid) {
                        console.log('❌ Form validation failed, not submitting')
                        return
                      }

                      const formData = form.getValues()
                      await onSubmit(formData)
                    }}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Update Patient
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Form>
      </DialogContent>
    </Dialog>
  )
}