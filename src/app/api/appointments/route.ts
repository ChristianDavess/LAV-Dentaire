import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth-local'
import { z } from 'zod'

const appointmentSchema = z.object({
  patient_id: z.string().uuid('Invalid patient ID'),
  appointment_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD format'),
  appointment_time: z.string().regex(/^\d{2}:\d{2}:\d{2}$/, 'Time must be HH:MM:SS format'),
  duration_minutes: z.number().min(15).max(240).default(60),
  reason: z.string().max(500).optional(),
  notes: z.string().max(1000).optional(),
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
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'No authentication token' }, { status: 401 })
    }

    const user = await getCurrentUser(token)
    if (!user) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 })
    }

    const supabase = await createClient()
    const { searchParams } = new URL(request.url)

    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')
    const status = searchParams.get('status')
    const patientId = searchParams.get('patient_id')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

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
      `)
      .order('appointment_date', { ascending: true })
      .order('appointment_time', { ascending: true })
      .range(offset, offset + limit - 1)

    if (startDate) {
      query = query.gte('appointment_date', startDate)
    }
    if (endDate) {
      query = query.lte('appointment_date', endDate)
    }
    if (status) {
      query = query.eq('status', status)
    }
    if (patientId) {
      query = query.eq('patient_id', patientId)
    }

    const { data: appointments, error, count } = await query

    if (error) {
      console.error('Error fetching appointments:', error)
      return NextResponse.json(
        { error: 'Failed to fetch appointments' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      appointments: appointments || [],
      total: count || 0,
      limit,
      offset
    })
  } catch (error) {
    console.error('Error in GET /api/appointments:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/appointments - Create new appointment
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'No authentication token' }, { status: 401 })
    }

    const user = await getCurrentUser(token)
    if (!user) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = appointmentSchema.parse(body)

    const supabase = await createClient()

    // Check if patient exists
    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .select('id')
      .eq('id', validatedData.patient_id)
      .single()

    if (patientError || !patient) {
      return NextResponse.json(
        { error: 'Patient not found' },
        { status: 404 }
      )
    }

    // Check if appointment is in the past
    const appointmentDateTime = new Date(`${validatedData.appointment_date}T${validatedData.appointment_time}`)
    if (appointmentDateTime < new Date()) {
      return NextResponse.json(
        { error: 'Cannot schedule appointments in the past' },
        { status: 400 }
      )
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
      return NextResponse.json(
        { error: 'Appointment time conflicts with existing appointment' },
        { status: 409 }
      )
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
      return NextResponse.json(
        { error: 'Failed to create appointment' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      appointment,
      message: 'Appointment created successfully'
    }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error in POST /api/appointments:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}