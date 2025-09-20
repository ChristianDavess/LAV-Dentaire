import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth-local'
import { z } from 'zod'

const updateAppointmentSchema = z.object({
  patient_id: z.string().uuid('Invalid patient ID').optional(),
  appointment_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD format').optional(),
  appointment_time: z.string().regex(/^\d{2}:\d{2}:\d{2}$/, 'Time must be HH:MM:SS format').optional(),
  duration_minutes: z.number().min(15).max(240).optional(),
  reason: z.string().max(500).optional(),
  notes: z.string().max(1000).optional(),
  status: z.enum(['scheduled', 'completed', 'cancelled', 'no-show']).optional()
})

// Helper function to check appointment conflicts (excluding current appointment)
async function checkAppointmentConflict(
  supabase: any,
  date: string,
  time: string,
  duration: number,
  excludeId: string
) {
  const startTime = new Date(`${date}T${time}`)
  const endTime = new Date(startTime.getTime() + duration * 60000)

  const { data: conflicts } = await supabase
    .from('appointments')
    .select('id, appointment_time, duration_minutes')
    .eq('appointment_date', date)
    .neq('status', 'cancelled')
    .neq('id', excludeId)

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

// GET /api/appointments/[id] - Get specific appointment
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'No authentication token' }, { status: 401 })
    }

    const user = await getCurrentUser(token)
    if (!user) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 })
    }

    const { id } = await params
    const supabase = await createClient()

    const { data: appointment, error } = await supabase
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
      .eq('id', id)
      .single()

    if (error || !appointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ appointment })
  } catch (error) {
    console.error('Error in GET /api/appointments/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/appointments/[id] - Update appointment
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'No authentication token' }, { status: 401 })
    }

    const user = await getCurrentUser(token)
    if (!user) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const validatedData = updateAppointmentSchema.parse(body)

    const supabase = await createClient()

    // Check if appointment exists
    const { data: existingAppointment, error: fetchError } = await supabase
      .from('appointments')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !existingAppointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      )
    }

    // If patient_id is being updated, check if patient exists
    if (validatedData.patient_id && validatedData.patient_id !== existingAppointment.patient_id) {
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
    }

    // Check if appointment time is being updated and not in the past
    const newDate = validatedData.appointment_date || existingAppointment.appointment_date
    const newTime = validatedData.appointment_time || existingAppointment.appointment_time
    const appointmentDateTime = new Date(`${newDate}T${newTime}`)

    if (appointmentDateTime < new Date() && validatedData.status !== 'completed') {
      return NextResponse.json(
        { error: 'Cannot schedule appointments in the past' },
        { status: 400 }
      )
    }

    // Check for conflicts if date, time, or duration is being updated
    if (validatedData.appointment_date || validatedData.appointment_time || validatedData.duration_minutes) {
      const newDuration = validatedData.duration_minutes || existingAppointment.duration_minutes

      const hasConflict = await checkAppointmentConflict(
        supabase,
        newDate,
        newTime,
        newDuration,
        id
      )

      if (hasConflict) {
        return NextResponse.json(
          { error: 'Appointment time conflicts with existing appointment' },
          { status: 409 }
        )
      }
    }

    // Update appointment
    const { data: appointment, error: updateError } = await supabase
      .from('appointments')
      .update(validatedData)
      .eq('id', id)
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

    if (updateError) {
      console.error('Error updating appointment:', updateError)
      return NextResponse.json(
        { error: 'Failed to update appointment' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      appointment,
      message: 'Appointment updated successfully'
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error in PUT /api/appointments/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/appointments/[id] - Cancel appointment
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'No authentication token' }, { status: 401 })
    }

    const user = await getCurrentUser(token)
    if (!user) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 })
    }

    const { id } = await params
    const supabase = await createClient()

    // Check if appointment exists
    const { data: existingAppointment, error: fetchError } = await supabase
      .from('appointments')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !existingAppointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      )
    }

    // Update appointment status to cancelled instead of deleting
    const { data: appointment, error: updateError } = await supabase
      .from('appointments')
      .update({ status: 'cancelled' })
      .eq('id', id)
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

    if (updateError) {
      console.error('Error cancelling appointment:', updateError)
      return NextResponse.json(
        { error: 'Failed to cancel appointment' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      appointment,
      message: 'Appointment cancelled successfully'
    })
  } catch (error) {
    console.error('Error in DELETE /api/appointments/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}