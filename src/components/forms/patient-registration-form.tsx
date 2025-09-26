'use client'

import { useState } from 'react'
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { MedicalHistorySection } from './medical-history-section'
import { Calendar22 } from '@/components/ui/calendar-22'
import {
  UserPlus,
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

interface PatientRegistrationFormProps {
  trigger?: React.ReactNode
  onSuccess?: (patient: PatientSchema) => void
}

export function PatientRegistrationForm({ trigger, onSuccess }: PatientRegistrationFormProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [currentStep, setCurrentStep] = useState(1)
  const [medicalHistory, setMedicalHistory] = useState<Record<string, any>>({})


  const form = useForm<any>({
    resolver: zodResolver(patientSchema) as any,
    defaultValues: {
      first_name: '',
      last_name: '',
      middle_name: '',
      date_of_birth: '',
      gender: '',
      phone: '',
      email: '',
      address: '',
      emergency_contact_name: '',
      emergency_contact_phone: '',
      medical_history: {},
      notes: '',
    },
  })

  const totalSteps = 3
  const progress = (currentStep / totalSteps) * 100

  const onSubmit = async (data: any) => {
    setIsLoading(true)
    setError('')

    try {
      // Include medical history data
      const patientData = {
        ...data,
        medical_history: medicalHistory
      }

      // TODO: Replace with actual API call
      const response = await fetch('/api/patients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(patientData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to register patient')
      }

      const responseData = await response.json()
      const newPatient = responseData.patient

      // Success handling
      form.reset()
      form.clearErrors()
      setMedicalHistory({})
      setCurrentStep(1)
      setIsOpen(false)
      onSuccess?.(newPatient)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed')
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

  const nextStep = async (e?: React.MouseEvent) => {
    e?.preventDefault()

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

    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    // Clear form errors when going back
    form.clearErrors()
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const defaultTrigger = (
    <Button>
      <UserPlus className="mr-2 h-4 w-4" />
      Add Patient
    </Button>
  )

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <UserPlus className="h-6 w-6" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold">Patient Registration</DialogTitle>
              <DialogDescription className="text-base">
                Register a new patient to the LAV Dentaire system
              </DialogDescription>
            </div>
          </div>

          {/* Progress indicator */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Registration Progress</span>
              <span className="text-muted-foreground">Step {currentStep} of {totalSteps}</span>
            </div>
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span className={currentStep >= 1 ? 'text-primary font-medium' : ''}>Personal Info</span>
              <span className={currentStep >= 2 ? 'text-primary font-medium' : ''}>Contact Details</span>
              <span className={currentStep >= 3 ? 'text-primary font-medium' : ''}>Medical History</span>
            </div>
          </div>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (currentStep === totalSteps) {
                form.handleSubmit(onSubmit)(e)
              }
            }}
            className="space-y-6"
          >

            {/* Step 1: Personal Information */}
            {currentStep === 1 && (
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <User className="h-4 w-4" />
                    </div>
                    Personal Information
                  </CardTitle>
                  <CardDescription>
                    Basic patient information and identification details
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="first_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-semibold">First Name *</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Enter first name" />
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
                          <FormLabel className="text-sm font-semibold">Last Name *</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Enter last name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="middle_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-semibold">Middle Name</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value || ''} placeholder="Enter middle name (optional)" />
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
                          <FormControl>
                            <Calendar22
                              id="date_of_birth"
                              label="Date of Birth"
                              value={field.value ? new Date(field.value) : undefined}
                              onChange={(date) => {
                                field.onChange(date ? date.toISOString().split('T')[0] : '')
                              }}
                              placeholder="Select date of birth"
                              className="w-full"
                            />
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
                          <FormLabel className="text-sm font-semibold">Gender</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value || ''}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select gender" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Male">Male</SelectItem>
                              <SelectItem value="Female">Female</SelectItem>
                              <SelectItem value="Other">Other</SelectItem>
                              <SelectItem value="Prefer not to say">Prefer not to say</SelectItem>
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
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Phone className="h-4 w-4" />
                    </div>
                    Contact Information
                  </CardTitle>
                  <CardDescription>
                    Contact details and emergency contact information
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-semibold">Phone Number</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                type="tel"
                                {...field}
                                value={field.value || ''}
                                placeholder="09XXXXXXXXX"
                                maxLength={11}
                                className="pl-10"
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
                            </div>
                          </FormControl>
                          <div className="text-xs text-muted-foreground mt-1 ml-10">
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
                          <FormLabel className="text-sm font-semibold">Email Address</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input {...field} value={field.value || ''} type="email" placeholder="patient@email.com" className="pl-10" />
                            </div>
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
                        <FormLabel className="text-sm font-semibold">Address</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Textarea {...field} value={field.value || ''} placeholder="Enter full address" className="pl-10 min-h-[80px]" />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Separator className="my-6" />

                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-primary" />
                      <h4 className="text-lg font-semibold">Emergency Contact</h4>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="emergency_contact_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-semibold">Emergency Contact Name</FormLabel>
                            <FormControl>
                              <Input {...field} value={field.value || ''} placeholder="Contact person name" />
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
                            <FormLabel className="text-sm font-semibold">Emergency Contact Phone</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                  type="tel"
                                  {...field}
                                  value={field.value || ''}
                                  placeholder="09XXXXXXXXX"
                                  maxLength={11}
                                  className="pl-10"
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
                              </div>
                            </FormControl>
                            <div className="text-xs text-muted-foreground mt-1 ml-10">
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
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Heart className="h-4 w-4" />
                    </div>
                    Medical History
                  </CardTitle>
                  <CardDescription>
                    Please provide medical history information for better treatment planning
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
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
                        <FormLabel className="text-sm font-medium flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Additional Notes
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            value={field.value || ''}
                            placeholder="Any additional notes or special considerations..."
                            rows={3}
                            className="resize-none text-sm"
                          />
                        </FormControl>
                        <FormDescription>
                          Any other relevant information that might be helpful for treatment planning
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-6 border-t">
              {currentStep > 1 ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={prevStep}
                >
                  Previous
                </Button>
              ) : (
                <div></div>
              )}

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsOpen(false)}
                >
                  Cancel
                </Button>

                {currentStep < totalSteps ? (
                  <Button
                    type="button"
                    onClick={(e) => nextStep(e)}
                    disabled={isLoading}
                  >
                    Next Step
                    <CheckCircle className="ml-2 h-4 w-4" />
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
                        Registering Patient...
                      </>
                    ) : (
                      <>
                        <UserPlus className="mr-2 h-4 w-4" />
                        Register Patient
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}