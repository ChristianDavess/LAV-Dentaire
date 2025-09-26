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
import { CalendarIcon, User, AlertCircle, Loader2, Plus, Minus, CreditCard, Search, UserPlus, Phone, Clock } from 'lucide-react'
import ProcedureSelector from './procedure-selector'
import { format } from 'date-fns'
import { TreatmentWithDetails, Patient, Appointment, Procedure, TreatmentProcedure } from '@/types/database'

const treatmentSchema = z.object({
  patient_id: z.string().uuid('Please select a valid patient'),
  appointment_id: z.string().uuid().optional(),
  treatment_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Please select a valid date'),
  payment_status: z.enum(['pending', 'partial', 'paid']).default('pending'),
  notes: z.string().max(1000).optional().or(z.literal('')),
  procedures: z.array(z.object({
    procedure_id: z.string().uuid('Invalid procedure ID'),
    quantity: z.number().min(1, 'Quantity must be at least 1'),
    cost_per_unit: z.number().min(0, 'Cost must be positive'),
    tooth_number: z.string().optional().or(z.literal('')),
    notes: z.string().optional().or(z.literal(''))
  })).min(1, 'At least one procedure is required')
})

type TreatmentFormData = z.infer<typeof treatmentSchema>

type Treatment = TreatmentWithDetails

interface TreatmentFormProps {
  treatment?: TreatmentWithDetails
  onSubmit: (data: TreatmentFormData) => void
  onCancel: () => void
}

export default function TreatmentForm({ treatment, onSubmit, onCancel }: TreatmentFormProps) {
  console.log('TreatmentForm props:', { treatment, hasOnSubmit: !!onSubmit })
  console.log('Treatment procedures:', treatment?.treatment_procedures)

  const [patients, setPatients] = useState<Patient[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [procedures, setProcedures] = useState<Procedure[]>([])
  const [loadingPatients, setLoadingPatients] = useState(false)
  const [loadingAppointments, setLoadingAppointments] = useState(false)
  const [patientSearchQuery, setPatientSearchQuery] = useState('')
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    treatment ? new Date(treatment.treatment_date) : undefined
  )
  const [selectedProcedures, setSelectedProcedures] = useState<TreatmentProcedure[]>(
    treatment?.treatment_procedures?.map(tp => ({
      id: tp.id,
      treatment_id: tp.treatment_id,
      procedure_id: tp.procedure_id,
      quantity: tp.quantity,
      cost_per_unit: tp.cost_per_unit,
      total_cost: tp.total_cost,
      tooth_number: tp.tooth_number,
      notes: tp.notes,
      procedure: tp.procedure
    })) || []
  )

  const form = useForm({
    resolver: zodResolver(treatmentSchema),
    defaultValues: {
      patient_id: treatment?.patient_id || '',
      appointment_id: treatment?.appointment_id || '',
      treatment_date: treatment?.treatment_date || '',
      payment_status: (treatment?.payment_status as 'pending' | 'partial' | 'paid') || 'pending',
      notes: treatment?.notes || '',
      procedures: []
    }
  })

  const selectedPatientId = form.watch('patient_id')

  // Filter patients based on search query
  const filteredPatients = patients.filter(patient => {
    if (!patientSearchQuery) return true
    const searchLower = patientSearchQuery.toLowerCase()
    const fullName = `${patient.first_name || ''} ${patient.last_name || ''}`.toLowerCase()
    const patientId = patient.patient_id.toLowerCase()
    const phone = patient.phone?.toLowerCase() || ''
    return fullName.includes(searchLower) || patientId.includes(searchLower) || phone.includes(searchLower)
  })

  // Sort patients: recent treatments first, then alphabetically
  const sortedPatients = [...filteredPatients].sort((a, b) => {
    // For now, sort alphabetically. In future, we could add last treatment date sorting
    const nameA = `${a.first_name || ''} ${a.last_name || ''}`.toLowerCase()
    const nameB = `${b.first_name || ''} ${b.last_name || ''}`.toLowerCase()
    return nameA.localeCompare(nameB)
  })

  // Get recent patients (first 3) and remaining patients
  const recentPatients = sortedPatients.slice(0, 3)
  const otherPatients = sortedPatients.slice(3)

  // Get selected patient for display
  const selectedPatient = patients.find(p => p.id === selectedPatientId)

  // Highlight matching text in patient names
  const highlightMatch = (text: string, query: string) => {
    if (!query) return text
    const regex = new RegExp(`(${query})`, 'gi')
    const parts = text.split(regex)
    return parts.map((part, index) =>
      regex.test(part) ? `**${part}**` : part
    ).join('')
  }

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
    // Map selectedProcedures to match the schema exactly
    const proceduresForForm = selectedProcedures.map(proc => ({
      procedure_id: proc.procedure_id,
      quantity: Number(proc.quantity) || 1,
      cost_per_unit: Number(proc.cost_per_unit) || 0,
      tooth_number: proc.tooth_number && proc.tooth_number.trim() !== '' ? proc.tooth_number.trim() : undefined,
      notes: proc.notes && proc.notes.trim() !== '' ? proc.notes.trim() : undefined
    }))
    console.log('Setting procedures in form:', proceduresForForm)
    form.setValue('procedures', proceduresForForm)
    // Trigger validation for procedures field after setting the value
    form.trigger('procedures')
  }, [selectedProcedures, form])

  const fetchPatients = async () => {
    setLoadingPatients(true)
    try {
      const response = await fetch('/api/patients', {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        setPatients(data.data?.patients || [])
      } else {
        console.error('Failed to fetch patients:', response.status, response.statusText)
        setPatients([])
      }
    } catch (error) {
      console.error('Error fetching patients:', error)
      setPatients([])
    } finally {
      setLoadingPatients(false)
    }
  }

  const fetchPatientAppointments = async (patientId: string) => {
    setLoadingAppointments(true)
    try {
      const response = await fetch(`/api/appointments?patient_id=${patientId}&status=scheduled`, {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        setAppointments(data.appointments || [])
      } else {
        console.error('Failed to fetch appointments:', response.status, response.statusText)
        setAppointments([])
      }
    } catch (error) {
      console.error('Error fetching appointments:', error)
      setAppointments([])
    } finally {
      setLoadingAppointments(false)
    }
  }

  const fetchProcedures = async () => {
    try {
      const response = await fetch('/api/procedures?is_active=true', {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        setProcedures(data.data?.procedures || [])
      } else {
        console.error('Failed to fetch procedures:', response.status, response.statusText)
        setProcedures([])
      }
    } catch (error) {
      console.error('Error fetching procedures:', error)
      setProcedures([])
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
      return total + ((proc.cost_per_unit ?? 0) * proc.quantity)
    }, 0)
  }

  const handleSubmit = (data: TreatmentFormData) => {
    console.log('Form submitted with data:', data)
    console.log('Form errors:', form.formState.errors)
    console.log('Selected procedures:', selectedProcedures)
    console.log('Form isValid:', form.formState.isValid)
    console.log('Procedures validation:', data.procedures)

    // Validate that all procedures have valid data
    const hasValidProcedures = data.procedures.every(proc =>
      proc.procedure_id &&
      typeof proc.quantity === 'number' && proc.quantity > 0 &&
      typeof proc.cost_per_unit === 'number' && proc.cost_per_unit >= 0
    )

    console.log('All procedures valid:', hasValidProcedures)

    if (hasValidProcedures) {
      onSubmit(data)
    } else {
      console.error('Invalid procedure data detected')
    }
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
            <FormItem className="space-y-3">
              <FormLabel className="text-base font-semibold">Patient</FormLabel>

              {/* Selected Patient Display */}
              {selectedPatient && (
                <div className="flex items-center justify-between p-3 bg-primary/5 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">
                          {selectedPatient.first_name} {selectedPatient.last_name}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {selectedPatient.patient_id}
                        </Badge>
                      </div>
                      {selectedPatient.phone && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          {selectedPatient.phone}
                        </div>
                      )}
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      field.onChange('')
                      setPatientSearchQuery('')
                    }}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Search className="h-4 w-4" />
                    Change
                  </Button>
                </div>
              )}

              {/* Search Input */}
              {!selectedPatient && (
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Type to search patients by name, ID, or phone..."
                      value={patientSearchQuery}
                      onChange={(e) => setPatientSearchQuery(e.target.value)}
                      className="pl-10 h-11"
                      disabled={loadingPatients}
                    />
                    {loadingPatients && (
                      <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                  </div>

                  {/* Inline Search Results */}
                  {(patientSearchQuery || (!selectedPatient && !loadingPatients)) && (
                    <Card className="border shadow-sm">
                      <CardContent className="p-0">
                        {filteredPatients.length > 0 ? (
                          <div className="space-y-1 max-h-80 overflow-y-auto">
                            {/* Recent Patients Section */}
                            {!patientSearchQuery && recentPatients.length > 0 && (
                              <>
                                <div className="px-3 py-2 text-xs font-medium text-muted-foreground bg-muted/30 border-b">
                                  Recent Patients
                                </div>
                                {recentPatients.map((patient) => (
                                  <div
                                    key={`recent-${patient.id}`}
                                    onClick={() => {
                                      field.onChange(patient.id)
                                      setPatientSearchQuery('')
                                    }}
                                    className="flex items-center gap-3 p-3 hover:bg-muted/50 cursor-pointer transition-colors border-l-2 border-l-primary/20"
                                  >
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                                      <User className="h-4 w-4 text-primary" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className="font-medium text-sm">
                                          {patient.first_name} {patient.last_name}
                                        </span>
                                        <Badge variant="outline" className="text-xs">
                                          {patient.patient_id}
                                        </Badge>
                                      </div>
                                      {patient.phone && (
                                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                          <Phone className="h-3 w-3" />
                                          {patient.phone}
                                        </div>
                                      )}
                                    </div>
                                    <Clock className="h-4 w-4 text-muted-foreground/60" />
                                  </div>
                                ))}
                                {otherPatients.length > 0 && (
                                  <div className="border-t border-muted/50"></div>
                                )}
                              </>
                            )}

                            {/* Main Results */}
                            {(patientSearchQuery ? sortedPatients : otherPatients).length > 0 && (
                              <>
                                {!patientSearchQuery && otherPatients.length > 0 && (
                                  <div className="px-3 py-2 text-xs font-medium text-muted-foreground bg-muted/30 border-b">
                                    All Patients
                                  </div>
                                )}
                                {patientSearchQuery && (
                                  <div className="px-3 py-2 text-xs font-medium text-muted-foreground bg-muted/30 border-b">
                                    Search Results ({sortedPatients.length})
                                  </div>
                                )}
                                {(patientSearchQuery ? sortedPatients : otherPatients).slice(0, 8).map((patient) => (
                                  <div
                                    key={patient.id}
                                    onClick={() => {
                                      field.onChange(patient.id)
                                      setPatientSearchQuery('')
                                    }}
                                    className="flex items-center gap-3 p-3 hover:bg-muted/50 cursor-pointer transition-colors"
                                  >
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary/50">
                                      <User className="h-4 w-4" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className="font-medium text-sm">
                                          {patient.first_name} {patient.last_name}
                                        </span>
                                        <Badge variant="outline" className="text-xs">
                                          {patient.patient_id}
                                        </Badge>
                                      </div>
                                      {patient.phone && (
                                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                          <Phone className="h-3 w-3" />
                                          {patient.phone}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </>
                            )}
                          </div>
                        ) : (
                          <div className="p-6 text-center">
                            <User className="h-12 w-12 mx-auto mb-4 opacity-20" />
                            <h3 className="text-sm font-semibold mb-2">No patients found</h3>
                            <p className="text-xs text-muted-foreground mb-4">
                              {patientSearchQuery
                                ? `No patients match "${patientSearchQuery}"`
                                : "No patients available"
                              }
                            </p>
                            <Button variant="outline" size="sm" className="text-xs">
                              <UserPlus className="h-3 w-3 mr-1" />
                              Add New Patient
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              <FormDescription>
                {selectedPatient ? 'Patient selected' : 'Search for a patient by name, patient ID, or phone number'}
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
              <CreditCard className="h-4 w-4 mr-1" />
              Total: ₱{totalCost.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
            </Badge>
          </div>
          <Card>
            <CardContent className="p-4">
              <ProcedureSelector
                procedures={procedures as any}
                selectedProcedures={selectedProcedures as any}
                onProceduresChange={handleProceduresChange as any}
              />
            </CardContent>
          </Card>
          {form.formState.errors.procedures && (
            <p className="text-sm font-medium text-destructive">
              {form.formState.errors.procedures.message}
            </p>
          )}
        </div>

        {/* Payment Status */}
        <FormField
          control={form.control}
          name="payment_status"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base font-semibold">Payment Status</FormLabel>
              <Select onValueChange={field.onChange} value={field.value || 'pending'}>
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