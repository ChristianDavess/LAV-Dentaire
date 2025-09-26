import { NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { createApiHandler, createSuccessResponse, ApiErrorClass } from '@/lib/middleware'
import { z } from 'zod'

// Query parameters validation schema for appointment listing
const getAppointmentsQuerySchema = z.object({
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  status: z.enum(['scheduled', 'completed', 'cancelled', 'no-show']).optional(),
  patient_id: z.string().uuid().optional(),
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0)
})

const appointmentSchema = z.object({
  patient_id: z.string().uuid('Invalid patient ID'),
  appointment_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD format'),
  appointment_time: z.string().regex(/^\d{2}:\d{2}:\d{2}$/, 'Time must be HH:MM:SS format'),
  duration_minutes: z.number().min(15).max(240).default(60),
  reason: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? undefined : val),
    z.string().max(500).optional()
  ),
  notes: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? undefined : val),
    z.string().max(1000).optional()
  ),
  status: z.enum(['scheduled', 'completed', 'cancelled', 'no-show']).default('scheduled')
})

// Helper function to check appointment conflicts
async function checkAppointmentConflict(
  supabase: any,
  patientId: string,
  date: string,
  time: string,
  duration: number,
  excludeId?: string
) {
  const startTime = new Date(`${date}T${time}`)
  const endTime = new Date(startTime.getTime() + duration * 60000)

  const { data: conflicts } = await supabase
    .from('appointments')
    .select('id, appointment_time, duration_minutes')
    .eq('appointment_date', date)
    .neq('status', 'cancelled')
    .neq('id', excludeId || '')

  if (conflicts) {
    for (const appointment of conflicts) {
      const existingStart = new Date(`${date}T${appointment.appointment_time}`)
      const existingEnd = new Date(existingStart.getTime() + appointment.duration_minutes * 60000)

      if (
        (startTime >= existingStart && startTime < existingEnd) ||
        (endTime > existingStart && endTime <= existingEnd) ||
        (startTime <= existingStart && endTime >= existingEnd)
      ) {
        return true
      }
    }
  }

  return false
}

// GET /api/appointments - List appointments with filtering
export const GET = createApiHandler()
  .requireAuth()
  .handle(async (request: NextRequest, user: any) => {
    const supabase = createServiceClient()

    // Parse and validate query parameters manually
    const url = new URL(request.url)
    const queryParams = Object.fromEntries(url.searchParams.entries())
    const validatedQuery = getAppointmentsQuerySchema.parse(queryParams)
    const { start_date, end_date, status, patient_id, limit, offset } = validatedQuery

    let query = supabase
      .from('appointments')
      .select(`
        *,
        patients:patient_id (
          id,
          patient_id,
          first_name,
          last_name,
          phone,
          email
        )
      `, { count: 'exact' })
      .order('appointment_date', { ascending: true })
      .order('appointment_time', { ascending: true })
      .range(offset, offset + limit - 1)

    // Apply filters
    if (start_date) query = query.gte('appointment_date', start_date)
    if (end_date) query = query.lte('appointment_date', end_date)
    if (status) query = query.eq('status', status)
    if (patient_id) query = query.eq('patient_id', patient_id)

    const { data: appointments, error, count } = await query

    if (error) {
      console.error('Error fetching appointments:', error)
      throw new ApiErrorClass('Failed to fetch appointments', 500)
    }

    return createSuccessResponse({
      appointments: appointments || [],
      pagination: {
        limit,
        offset,
        total: count || 0,
        hasMore: (count || 0) > offset + limit
      }
    })
  })

// POST /api/appointments - Create new appointment
export const POST = createApiHandler()
  .requireAuth()
  .validateBody(appointmentSchema)
  .handle(async (request: NextRequest, user: any, validatedData: z.infer<typeof appointmentSchema>) => {
    const supabase = createServiceClient()

    try {

      // Check if patient exists
      const { data: patient, error: patientError } = await supabase
        .from('patients')
        .select('id, patient_id, first_name, last_name')
        .eq('id', validatedData.patient_id)
        .single()

      if (patientError || !patient) {
        throw new ApiErrorClass('Patient not found', 404)
      }

      // Check if appointment is in the past (allow same-day appointments with reasonable buffer)
      const appointmentDateTime = new Date(`${validatedData.appointment_date}T${validatedData.appointment_time}`)
      const now = new Date()
      const minimumTime = new Date(now.getTime() + 15 * 60 * 1000) // 15 minutes from now

      if (appointmentDateTime < minimumTime) {
        throw new ApiErrorClass('Appointments must be scheduled at least 15 minutes in advance', 400)
      }

      // Check for conflicts
      const hasConflict = await checkAppointmentConflict(
        supabase,
        validatedData.patient_id,
        validatedData.appointment_date,
        validatedData.appointment_time,
        validatedData.duration_minutes
      )

      if (hasConflict) {
        throw new ApiErrorClass('Appointment time conflicts with existing appointment', 409)
      }

      // Create appointment
      const { data: appointment, error: createError } = await supabase
        .from('appointments')
        .insert([validatedData])
        .select(`
          *,
          patients:patient_id (
            id,
            patient_id,
            first_name,
            last_name,
            phone,
            email
          )
        `)
        .single()

      if (createError) {
        console.error('Error creating appointment:', createError)
        throw new ApiErrorClass('Failed to create appointment', 500)
      }

      return createSuccessResponse(
        { appointment },
        'Appointment created successfully',
        201
      )
    } catch (error) {
      if (error instanceof ApiErrorClass) {
        throw error
      }
      console.error('Unexpected error creating appointment:', error)
      throw new ApiErrorClass('Failed to create appointment', 500)
    }
  })