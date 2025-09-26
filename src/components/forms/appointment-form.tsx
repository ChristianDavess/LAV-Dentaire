'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { CalendarIcon, Clock, User, AlertCircle, Loader2 } from 'lucide-react'
import { TimeSlotPicker } from '@/components/appointments'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { Patient, Appointment } from '@/types'

const appointmentSchema = z.object({
  patient_id: z.string().uuid('Please select a valid patient'),
  appointment_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Please select a valid date'),
  appointment_time: z.string().regex(/^\d{2}:\d{2}:\d{2}$/, 'Please select a valid time'),
  duration_minutes: z.number().min(15, 'Minimum duration is 15 minutes').max(240, 'Maximum duration is 4 hours'),
  reason: z.string().max(500).optional().or(z.literal('')),
  notes: z.string().max(1000).optional().or(z.literal('')),
  status: z.enum(['scheduled', 'completed', 'cancelled', 'no-show'])
})

type AppointmentFormData = z.infer<typeof appointmentSchema>

interface AppointmentWithPatient extends Appointment {
  patients: Patient
}

interface AppointmentFormProps {
  appointment?: AppointmentWithPatient
  onSubmit: (data: AppointmentFormData) => void
  onCancel: () => void
}

export default function AppointmentForm({ appointment, onSubmit, onCancel }: AppointmentFormProps) {
  const [patients, setPatients] = useState<Patient[]>([])
  const [loadingPatients, setLoadingPatients] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    appointment ? new Date(appointment.appointment_date) : undefined
  )

  const form = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      patient_id: appointment?.patient_id || '',
      appointment_date: appointment?.appointment_date || '',
      appointment_time: appointment?.appointment_time || '',
      duration_minutes: appointment?.duration_minutes || 60,
      reason: appointment?.reason || '',
      notes: appointment?.notes || '',
      status: (appointment?.status as 'scheduled' | 'completed' | 'cancelled' | 'no-show') || 'scheduled'
    }
  })

  const duration = form.watch('duration_minutes')
  const selectedTime = form.watch('appointment_time')

  useEffect(() => {
    fetchPatients()
  }, [])

  const fetchPatients = async () => {
    setLoadingPatients(true)
    try {
      const response = await fetch('/api/patients', {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        setPatients(data.data?.patients || [])
      }
    } catch (error) {
      console.error('Error fetching patients:', error)
    } finally {
      setLoadingPatients(false)
    }
  }

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date)
    if (date) {
      form.setValue('appointment_date', format(date, 'yyyy-MM-dd'))
      // Clear selected time when date changes
      form.setValue('appointment_time', '')
    }
  }

  const handleTimeSelect = (time: string) => {
    form.setValue('appointment_time', time)
  }

  const handleSubmit = (data: AppointmentFormData) => {
    console.log('📋 Appointment form submission data:', data)
    const selectedPatient = patients.find(p => p.id === data.patient_id)
    console.log('👤 Selected patient details:', selectedPatient ? {
      id: selectedPatient.id,
      patient_id: selectedPatient.patient_id,
      name: `${selectedPatient.first_name} ${selectedPatient.last_name}`
    } : 'Patient not found in local list')
    console.log('📊 Total patients loaded:', patients.length)
    onSubmit(data)
  }

  const durationOptions = [
    { value: 15, label: '15 minutes' },
    { value: 30, label: '30 minutes' },
    { value: 45, label: '45 minutes' },
    { value: 60, label: '1 hour' },
    { value: 90, label: '1.5 hours' },
    { value: 120, label: '2 hours' },
    { value: 180, label: '3 hours' },
    { value: 240, label: '4 hours' }
  ]

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Patient Selection */}
        <FormField
          control={form.control}
          name="patient_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base font-semibold">Patient</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value} disabled={loadingPatients}>
                <FormControl>
                  <SelectTrigger
                    aria-describedby="patient-description"
                    aria-label={loadingPatients ? "Loading patients" : "Select a patient"}
                  >
                    <SelectValue placeholder={loadingPatients ? "Loading patients..." : "Select a patient"} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {patients.map((patient) => (
                    <SelectItem key={patient.id} value={patient.id}>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span>{patient.first_name} {patient.last_name}</span>
                        <Badge variant="outline" className="text-xs">
                          {patient.patient_id}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription id="patient-description">
                Select the patient for this appointment
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Date Selection */}
          <FormField
            control={form.control}
            name="appointment_date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel className="text-base font-semibold">Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        data-empty={!selectedDate}
                        className="data-[empty=true]:text-muted-foreground w-full pl-3 text-left font-normal"
                        aria-describedby="date-description"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {selectedDate ? (
                          format(selectedDate, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={handleDateSelect}
                      disabled={(date) => {
                        const today = new Date()
                        today.setHours(0, 0, 0, 0) // Start of today
                        return date < today || date < new Date("1900-01-01")
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormDescription id="date-description">
                  Select the appointment date
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Duration Selection */}
          <FormField
            control={form.control}
            name="duration_minutes"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base font-semibold">Duration</FormLabel>
                <Select onValueChange={(value) => field.onChange(parseInt(value))} defaultValue={field.value.toString()}>
                  <FormControl>
                    <SelectTrigger aria-describedby="duration-description">
                      <SelectValue placeholder="Select duration" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {durationOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value.toString()}>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          {option.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription id="duration-description">
                  How long will this appointment take?
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Time Selection */}
        {selectedDate && (
          <FormField
            control={form.control}
            name="appointment_time"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base font-semibold">Available Times</FormLabel>
                <FormControl>
                  <TimeSlotPicker
                    selectedDate={format(selectedDate, 'yyyy-MM-dd')}
                    duration={duration}
                    selectedTime={selectedTime}
                    onTimeSelect={handleTimeSelect}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Reason */}
        <FormField
          control={form.control}
          name="reason"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base font-semibold">Reason for Appointment</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., Regular cleaning, Consultation, Treatment..."
                  aria-describedby="reason-description"
                  {...field}
                />
              </FormControl>
              <FormDescription id="reason-description">
                Brief description of the appointment purpose
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Notes */}
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base font-semibold">Notes</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Additional notes or special instructions..."
                  className="resize-none"
                  aria-describedby="notes-description"
                  {...field}
                />
              </FormControl>
              <FormDescription id="notes-description">
                Any additional information about this appointment
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Status (only for editing) */}
        {appointment && (
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base font-semibold">Status</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger aria-describedby="status-description">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="no-show">No Show</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription id="status-description">
                  Current appointment status
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Form Actions */}
        <div className="flex items-center justify-end space-x-4 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={form.formState.isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={form.formState.isSubmitting}
            aria-label={
              form.formState.isSubmitting
                ? `${appointment ? 'Updating' : 'Creating'} appointment...`
                : `${appointment ? 'Update' : 'Create'} appointment`
            }
          >
            {form.formState.isSubmitting && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
            )}
            {form.formState.isSubmitting
              ? `${appointment ? 'Updating' : 'Creating'}...`
              : `${appointment ? 'Update' : 'Create'} Appointment`
            }
          </Button>
        </div>
      </form>
    </Form>
  )
}