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
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { MedicalHistorySection } from './medical-history-section'
import { Calendar22 } from '@/components/ui/calendar-22'
import { useQRTokens } from '@/hooks/use-qr-tokens'
import { useToast } from '@/hooks/use-toast'
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
  ArrowRight,
  ArrowLeft,
  Save
} from 'lucide-react'

interface MobilePatientRegistrationFormProps {
  qrToken: string | null
  onSuccess?: (patient: PatientSchema) => void
  registrationSource?: string
}

export function MobilePatientRegistrationForm({ qrToken, onSuccess, registrationSource = 'qr-token' }: MobilePatientRegistrationFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [currentStep, setCurrentStep] = useState(1)
  const [medicalHistory, setMedicalHistory] = useState<Record<string, any>>({})
  const [draftSaved, setDraftSaved] = useState(false)

  const { registerPatient } = useQRTokens()
  const { toast } = useToast()

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

  // Auto-save draft to localStorage
  useEffect(() => {
    const saveDraft = () => {
      const formData = form.getValues()
      const storageKey = qrToken ? `qr-registration-${qrToken}` : `generic-registration-${registrationSource}`
      localStorage.setItem(storageKey, JSON.stringify({
        formData,
        medicalHistory,
        currentStep,
        timestamp: Date.now()
      }))
      setDraftSaved(true)
      setTimeout(() => setDraftSaved(false), 2000)
    }

    const timer = setTimeout(saveDraft, 2000)
    return () => clearTimeout(timer)
  }, [medicalHistory, currentStep, qrToken, registrationSource, form])

  // Load draft on component mount
  useEffect(() => {
    const storageKey = qrToken ? `qr-registration-${qrToken}` : `generic-registration-${registrationSource}`
    const draft = localStorage.getItem(storageKey)
    if (draft) {
      try {
        const parsed = JSON.parse(draft)
        const hoursSinceDraft = (Date.now() - parsed.timestamp) / (1000 * 60 * 60)

        // Only load draft if it's less than 24 hours old
        if (hoursSinceDraft < 24) {
          form.reset(parsed.formData)
          setMedicalHistory(parsed.medicalHistory || {})
          setCurrentStep(parsed.currentStep || 1)

          toast({
            title: "Draft Loaded",
            description: "Your previous registration progress has been restored."
          })
        }
      } catch (err) {
        console.error('Error loading draft:', err)
      }
    }
  }, [qrToken, registrationSource, form, toast])

  const onSubmit = async (data: any) => {
    setIsLoading(true)
    setError('')

    try {
      const patientData = {
        ...data,
        medical_history: medicalHistory
      }

      let result
      if (qrToken) {
        // Token-based registration
        result = await registerPatient(qrToken, patientData)
      } else {
        // Generic registration (no token)
        const response = await fetch('/api/patients', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            ...patientData,
            registration_source: registrationSource
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to register patient')
        }

        const data = await response.json()
        result = data.data
      }

      // Clear draft on successful submission
      const storageKey = qrToken ? `qr-registration-${qrToken}` : `generic-registration-${registrationSource}`
      localStorage.removeItem(storageKey)

      toast({
        title: "Registration Successful!",
        description: "Your patient information has been submitted successfully."
      })

      onSuccess?.(result.patient || result)
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

    form.clearErrors()

    if (currentStep === 1) {
      const isValid = await form.trigger(['first_name', 'last_name'])
      if (!isValid) return

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

        if (isNaN(birthDate.getTime())) {
          form.setError('date_of_birth', {
            type: 'manual',
            message: 'Please enter a valid date'
          })
          return
        }
      }
    } else if (currentStep === 2) {
      // Email is REQUIRED to proceed to step 3 (Medical History)
      const emailValue = form.getValues('email')
      if (!emailValue || emailValue.trim() === '') {
        form.setError('email', {
          type: 'manual',
          message: 'Email address is required'
        })
        return
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(emailValue)) {
        form.setError('email', {
          type: 'manual',
          message: 'Please enter a valid email address'
        })
        return
      }

      // Validate phone format IF provided (optional fields)
      const phoneValue = form.getValues('phone')
      const emergencyPhoneValue = form.getValues('emergency_contact_phone')

      if (phoneValue && phoneValue.trim() !== '' && !phoneValue.match(/^09\d{9}$/)) {
        form.setError('phone', {
          type: 'manual',
          message: 'Phone must be exactly 11 digits starting with 09'
        })
        return
      }

      if (emergencyPhoneValue && emergencyPhoneValue.trim() !== '' && !emergencyPhoneValue.match(/^09\d{9}$/)) {
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
    form.clearErrors()
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  return (
    <div className="space-y-6">
      {/* Progress Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b p-4 -mx-6 -mt-6 mb-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Registration Progress</span>
            <div className="flex items-center gap-2">
              {draftSaved && (
                <Badge variant="outline" className="gap-1 text-xs">
                  <Save className="h-3 w-3" />
                  Draft Saved
                </Badge>
              )}
              <span className="text-muted-foreground">Step {currentStep} of {totalSteps}</span>
            </div>
          </div>
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span className={currentStep >= 1 ? 'text-primary font-medium' : ''}>Personal</span>
            <span className={currentStep >= 2 ? 'text-primary font-medium' : ''}>Contact</span>
            <span className={currentStep >= 3 ? 'text-primary font-medium' : ''}>Medical</span>
          </div>
        </div>
      </div>

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
                  Tell us about yourself
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="first_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-semibold flex items-center gap-2">
                          <User className="h-4 w-4 text-primary" />
                          First Name
                          <Badge variant="secondary" className="text-xs">Required</Badge>
                        </FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Your first name" className="text-base" />
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
                        <FormLabel className="text-sm font-semibold flex items-center gap-2">
                          <User className="h-4 w-4 text-primary" />
                          Last Name
                          <Badge variant="secondary" className="text-xs">Required</Badge>
                        </FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Your last name" className="text-base" />
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
                          <Input {...field} value={field.value || ''} placeholder="Middle name (optional)" className="text-base" />
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
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-primary" />
                              <span className="text-sm font-semibold">Date of Birth</span>
                            </div>
                            <Calendar22
                              id="date_of_birth"
                              label=""
                              value={field.value ? new Date(field.value) : undefined}
                              onChange={(date) => {
                                field.onChange(date ? date.toISOString().split('T')[0] : '')
                              }}
                              placeholder="Select date of birth"
                              className="w-full"
                            />
                          </div>
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
                        <FormLabel className="text-sm font-semibold flex items-center gap-2">
                          <Users className="h-4 w-4 text-primary" />
                          Gender
                        </FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value || ''}>
                          <FormControl>
                            <SelectTrigger className="text-base">
                              <SelectValue placeholder="Select your gender" />
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
                  How can we reach you?
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold flex items-center gap-2">
                        <Phone className="h-4 w-4 text-primary" />
                        Phone Number
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            type="tel"
                            {...field}
                            value={field.value || ''}
                            placeholder="09XXXXXXXXX"
                            maxLength={11}
                            className="pl-10 text-base"
                            onChange={(e) => {
                              let value = e.target.value.replace(/\D/g, '')
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
                      <FormDescription className="text-xs">
                        Format: 09XXXXXXXXX (11 digits)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold flex items-center gap-2">
                        <Mail className="h-4 w-4 text-primary" />
                        Email Address
                        <Badge variant="secondary" className="text-xs">Required</Badge>
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input {...field} value={field.value || ''} type="email" placeholder="your@email.com" className="pl-10 text-base border-primary/20 focus:border-primary" />
                        </div>
                      </FormControl>
                      <FormDescription className="text-xs">
                        Email is required to access medical history and complete registration
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold">Address</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Textarea {...field} value={field.value || ''} placeholder="Your full address" className="pl-10 min-h-[80px] text-base" />
                        </div>
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

                  <FormField
                    control={form.control}
                    name="emergency_contact_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-semibold">Contact Name</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ''} placeholder="Emergency contact person" className="text-base" />
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
                        <FormLabel className="text-sm font-semibold">Contact Phone</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              type="tel"
                              {...field}
                              value={field.value || ''}
                              placeholder="09XXXXXXXXX"
                              maxLength={11}
                              className="pl-10 text-base"
                              onChange={(e) => {
                                let value = e.target.value.replace(/\D/g, '')
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
                        <FormDescription className="text-xs">
                          Format: 09XXXXXXXXX (11 digits) - Optional
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
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
                  Help us provide better care
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
                          placeholder="Any additional notes..."
                          rows={3}
                          className="resize-none text-base"
                        />
                      </FormControl>
                      <FormDescription className="text-xs">
                        Any other information that might be helpful
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          )}

          {/* Navigation Buttons */}
          <div className="sticky bottom-0 bg-background/95 backdrop-blur-sm border-t p-4 -mx-6 -mb-6 mt-6">
            <div className="flex justify-between items-center">
              {currentStep > 1 ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={prevStep}
                  className="px-6"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
              ) : (
                <div></div>
              )}

              {currentStep < totalSteps ? (
                <Button
                  type="button"
                  onClick={(e) => nextStep(e)}
                  disabled={isLoading}
                  className="px-6"
                >
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button
                  type="button"
                  disabled={isLoading}
                  onClick={async () => {
                    const isValid = await form.trigger()
                    if (!isValid) return

                    const formData = form.getValues()
                    await onSubmit(formData)
                  }}
                  className="px-6"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Complete Registration
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </form>
      </Form>
    </div>
  )
}