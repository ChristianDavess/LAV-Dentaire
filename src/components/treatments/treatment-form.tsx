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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CalendarIcon, User, AlertCircle, Loader2, Plus, Minus, DollarSign } from 'lucide-react'
import ProcedureSelector from './procedure-selector'
import { format } from 'date-fns'

const treatmentSchema = z.object({
  patient_id: z.string().min(1, 'Please select a patient'),
  appointment_id: z.string().optional(),
  treatment_date: z.string().min(1, 'Please select a date'),
  payment_status: z.enum(['pending', 'partial', 'paid']),
  notes: z.string().optional(),
  procedures: z.array(z.object({
    procedure_id: z.string(),
    quantity: z.number().min(1),
    cost_per_unit: z.number().min(0),
    tooth_number: z.string().optional(),
    notes: z.string().optional()
  })).min(1, 'At least one procedure is required')
})

type TreatmentFormData = z.infer<typeof treatmentSchema>

interface Patient {
  id: string
  patient_id: string
  first_name: string
  last_name: string
  phone?: string
  email?: string
}

interface Appointment {
  id: string
  appointment_date: string
  appointment_time: string
  reason?: string
}

interface Procedure {
  id: string
  name: string
  description?: string
  default_cost?: number
  estimated_duration?: number
  is_active: boolean
}

interface TreatmentProcedure {
  procedure_id: string
  procedure?: Procedure
  quantity: number
  cost_per_unit: number
  tooth_number?: string
  notes?: string
}

interface Treatment {
  id: string
  patient_id: string
  appointment_id?: string
  treatment_date: string
  total_cost: number
  payment_status: 'pending' | 'partial' | 'paid'
  notes?: string
  patients: Patient
  appointments?: Appointment
  treatment_procedures: (TreatmentProcedure & { procedures: Procedure })[]
}

interface TreatmentFormProps {
  treatment?: Treatment
  onSubmit: (data: TreatmentFormData) => void
  onCancel: () => void
}

export default function TreatmentForm({ treatment, onSubmit, onCancel }: TreatmentFormProps) {
  const [patients, setPatients] = useState<Patient[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [procedures, setProcedures] = useState<Procedure[]>([])
  const [loadingPatients, setLoadingPatients] = useState(false)
  const [loadingAppointments, setLoadingAppointments] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    treatment ? new Date(treatment.treatment_date) : undefined
  )
  const [selectedProcedures, setSelectedProcedures] = useState<TreatmentProcedure[]>(
    treatment?.treatment_procedures.map(tp => ({
      procedure_id: tp.procedure_id,
      procedure: tp.procedures,
      quantity: tp.quantity,
      cost_per_unit: tp.cost_per_unit,
      tooth_number: tp.tooth_number,
      notes: tp.notes
    })) || []
  )

  const form = useForm<TreatmentFormData>({
    resolver: zodResolver(treatmentSchema),
    defaultValues: {
      patient_id: treatment?.patient_id || '',
      appointment_id: treatment?.appointment_id || '',
      treatment_date: treatment?.treatment_date || '',
      payment_status: treatment?.payment_status || 'pending',
      notes: treatment?.notes || '',
      procedures: selectedProcedures
    }
  })

  const selectedPatientId = form.watch('patient_id')

  useEffect(() => {
    fetchPatients()
    fetchProcedures()
  }, [])

  useEffect(() => {
    if (selectedPatientId) {
      fetchPatientAppointments(selectedPatientId)
    }
  }, [selectedPatientId])

  useEffect(() => {
    form.setValue('procedures', selectedProcedures)
  }, [selectedProcedures, form])

  const fetchPatients = async () => {
    setLoadingPatients(true)
    try {
      const response = await fetch('/api/patients')
      if (response.ok) {
        const data = await response.json()
        setPatients(data.patients || [])
      }
    } catch (error) {
      console.error('Error fetching patients:', error)
    } finally {
      setLoadingPatients(false)
    }
  }

  const fetchPatientAppointments = async (patientId: string) => {
    setLoadingAppointments(true)
    try {
      const response = await fetch(`/api/appointments?patient_id=${patientId}&status=scheduled`)
      if (response.ok) {
        const data = await response.json()
        setAppointments(data.appointments || [])
      }
    } catch (error) {
      console.error('Error fetching appointments:', error)
    } finally {
      setLoadingAppointments(false)
    }
  }

  const fetchProcedures = async () => {
    try {
      const response = await fetch('/api/procedures?is_active=true')
      if (response.ok) {
        const data = await response.json()
        setProcedures(data.procedures || [])
      }
    } catch (error) {
      console.error('Error fetching procedures:', error)
    }
  }

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date)
    if (date) {
      form.setValue('treatment_date', format(date, 'yyyy-MM-dd'))
    }
  }

  const handleProceduresChange = (newProcedures: TreatmentProcedure[]) => {
    setSelectedProcedures(newProcedures)
  }

  const calculateTotalCost = () => {
    return selectedProcedures.reduce((total, proc) => {
      return total + (proc.cost_per_unit * proc.quantity)
    }, 0)
  }

  const handleSubmit = (data: TreatmentFormData) => {
    onSubmit(data)
  }

  const totalCost = calculateTotalCost()

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
                Select the patient for this treatment
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Date Selection */}
          <FormField
            control={form.control}
            name="treatment_date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel className="text-base font-semibold">Treatment Date</FormLabel>
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
                      disabled={(date) =>
                        date < new Date(new Date().setDate(new Date().getDate() - 1))
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormDescription id="date-description">
                  Date when the treatment was or will be performed
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Appointment Selection (Optional) */}
          <FormField
            control={form.control}
            name="appointment_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base font-semibold">Related Appointment</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!selectedPatientId || loadingAppointments}>
                  <FormControl>
                    <SelectTrigger
                      aria-describedby="appointment-description"
                      aria-label={loadingAppointments ? "Loading appointments" : "Select an appointment"}
                    >
                      <SelectValue placeholder={
                        !selectedPatientId
                          ? "Select patient first"
                          : loadingAppointments
                            ? "Loading appointments..."
                            : "Optional: Link to appointment"
                      } />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {appointments.map((appointment) => (
                      <SelectItem key={appointment.id} value={appointment.id}>
                        <div className="flex flex-col">
                          <span>{format(new Date(appointment.appointment_date), 'PPP')} at {appointment.appointment_time}</span>
                          {appointment.reason && (
                            <span className="text-xs text-muted-foreground">{appointment.reason}</span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription id="appointment-description">
                  Optionally link this treatment to an existing appointment
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Procedure Selection */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <FormLabel className="text-base font-semibold">Procedures</FormLabel>
            <Badge variant="secondary" className="text-sm">
              <DollarSign className="h-3 w-3 mr-1" />
              Total: ₱{totalCost.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
            </Badge>
          </div>
          <Card>
            <CardContent className="p-4">
              <ProcedureSelector
                procedures={procedures}
                selectedProcedures={selectedProcedures}
                onProceduresChange={handleProceduresChange}
              />
            </CardContent>
          </Card>
          <FormField
            control={form.control}
            name="procedures"
            render={() => (
              <FormMessage />
            )}
          />
        </div>

        {/* Payment Status */}
        <FormField
          control={form.control}
          name="payment_status"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base font-semibold">Payment Status</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger aria-describedby="payment-description">
                    <SelectValue placeholder="Select payment status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="partial">Partial Payment</SelectItem>
                  <SelectItem value="paid">Fully Paid</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription id="payment-description">
                Current payment status for this treatment
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
              <FormLabel className="text-base font-semibold">Treatment Notes</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Additional notes about the treatment, observations, follow-up instructions..."
                  className="resize-none"
                  rows={3}
                  aria-describedby="notes-description"
                  {...field}
                />
              </FormControl>
              <FormDescription id="notes-description">
                Any additional information about this treatment
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

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
            disabled={form.formState.isSubmitting || selectedProcedures.length === 0}
            aria-label={
              form.formState.isSubmitting
                ? `${treatment ? 'Updating' : 'Creating'} treatment...`
                : `${treatment ? 'Update' : 'Create'} treatment`
            }
          >
            {form.formState.isSubmitting && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
            )}
            {form.formState.isSubmitting
              ? `${treatment ? 'Updating' : 'Creating'}...`
              : `${treatment ? 'Update' : 'Create'} Treatment`
            }
          </Button>
        </div>
      </form>
    </Form>
  )
}