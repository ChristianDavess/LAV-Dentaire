import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth-local'

// Business hours configuration
const BUSINESS_HOURS = {
  start: '09:00:00',
  end: '18:00:00',
  slotDuration: 30, // minutes
  breakDuration: 15 // minutes between appointments
}

// GET /api/appointments/availability - Get available time slots for a date
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

    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    const duration = parseInt(searchParams.get('duration') || '60')

    if (!date) {
      return NextResponse.json(
        { error: 'Date parameter is required' },
        { status: 400 }
      )
    }

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json(
        { error: 'Date must be in YYYY-MM-DD format' },
        { status: 400 }
      )
    }

    // Check if date is in the past
    const selectedDate = new Date(date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (selectedDate < today) {
      return NextResponse.json({
        date,
        availableSlots: [],
        message: 'Cannot book appointments in the past'
      })
    }

    const supabase = await createClient()

    // Get existing appointments for the date
    const { data: existingAppointments, error } = await supabase
      .from('appointments')
      .select('appointment_time, duration_minutes')
      .eq('appointment_date', date)
      .neq('status', 'cancelled')
      .order('appointment_time')

    if (error) {
      console.error('Error fetching existing appointments:', error)
      return NextResponse.json(
        { error: 'Failed to check availability' },
        { status: 500 }
      )
    }

    // Generate all possible time slots
    const availableSlots: string[] = []
    const startTime = new Date(`${date}T${BUSINESS_HOURS.start}`)
    const endTime = new Date(`${date}T${BUSINESS_HOURS.end}`)

    let currentTime = new Date(startTime)

    while (currentTime < endTime) {
      const slotStart = new Date(currentTime)
      const slotEnd = new Date(currentTime.getTime() + duration * 60000)

      // Check if slot end is within business hours
      if (slotEnd <= endTime) {
        const timeString = currentTime.toTimeString().substring(0, 8)

        // Check if slot conflicts with existing appointments
        let hasConflict = false

        if (existingAppointments) {
          for (const appointment of existingAppointments) {
            const existingStart = new Date(`${date}T${appointment.appointment_time}`)
            const existingEnd = new Date(existingStart.getTime() + appointment.duration_minutes * 60000)

            // Add buffer time between appointments
            const existingEndWithBuffer = new Date(existingEnd.getTime() + BUSINESS_HOURS.breakDuration * 60000)
            const slotStartWithBuffer = new Date(slotStart.getTime() - BUSINESS_HOURS.breakDuration * 60000)

            if (
              (slotStart >= existingStart && slotStart < existingEndWithBuffer) ||
              (slotEnd > existingStart && slotEnd <= existingEndWithBuffer) ||
              (slotStartWithBuffer <= existingStart && slotEnd >= existingEnd)
            ) {
              hasConflict = true
              break
            }
          }
        }

        if (!hasConflict) {
          availableSlots.push(timeString)
        }
      }

      // Move to next slot
      currentTime = new Date(currentTime.getTime() + BUSINESS_HOURS.slotDuration * 60000)
    }

    return NextResponse.json({
      date,
      duration,
      availableSlots,
      businessHours: BUSINESS_HOURS,
      totalSlots: availableSlots.length
    })
  } catch (error) {
    console.error('Error in GET /api/appointments/availability:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}