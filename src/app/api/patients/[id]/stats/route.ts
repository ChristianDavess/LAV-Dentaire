import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth-local'

interface PatientStatsRouteParams {
  params: Promise<{ id: string }>
}

export async function GET(
  request: NextRequest,
  context: PatientStatsRouteParams
) {
  try {
    // Authentication validation
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const user = await getCurrentUser(token)
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parameter validation with comprehensive checks
    let patientId: string
    try {
      const params = await context.params
      patientId = params?.id

      if (!patientId || typeof patientId !== 'string' || patientId.trim() === '') {
        return NextResponse.json(
          { error: 'Valid patient ID is required' },
          { status: 400 }
        )
      }

      // Basic UUID format validation
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      if (!uuidRegex.test(patientId)) {
        return NextResponse.json(
          { error: 'Invalid patient ID format' },
          { status: 400 }
        )
      }
    } catch (error) {
      console.error('Parameter parsing error:', error)
      return NextResponse.json(
        { error: 'Invalid request parameters' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Verify patient exists with enhanced error handling
    let patient
    try {
      const { data, error: patientError } = await supabase
        .from('patients')
        .select('id, created_at')
        .eq('id', patientId)
        .single()

      if (patientError) {
        if (patientError.code === 'PGRST116') {
          // No rows returned
          return NextResponse.json(
            { error: 'Patient not found' },
            { status: 404 }
          )
        }
        throw patientError
      }

      patient = data
    } catch (error) {
      console.error('Error fetching patient:', error)
      return NextResponse.json(
        { error: 'Failed to fetch patient information' },
        { status: 500 }
      )
    }

    // Initialize stats with defaults
    let totalTreatments = 0
    let totalAmountPaid = 0
    let upcomingAppointments = 0

    // Get treatment statistics with comprehensive error handling
    try {
      // Check if treatments table exists and get count
      const { count: treatmentCount, error: countError } = await supabase
        .from('treatments')
        .select('*', { count: 'exact', head: true })
        .eq('patient_id', patientId)

      if (!countError) {
        totalTreatments = treatmentCount || 0

        // Get paid treatments
        const { data: treatments, error: treatmentError } = await supabase
          .from('treatments')
          .select('total_cost')
          .eq('patient_id', patientId)
          .eq('payment_status', 'paid')

        if (!treatmentError && treatments) {
          totalAmountPaid = treatments.reduce((sum, treatment) => {
            const cost = Number(treatment.total_cost) || 0
            return sum + cost
          }, 0)
        }
      }
    } catch (error) {
      console.log('Treatments table not available or contains invalid data (Phase 5):', error)
      // Keep defaults for treatments stats
    }

    // Get appointment statistics with comprehensive error handling
    try {
      const today = new Date()
      const todayStr = today.toISOString().split('T')[0]

      const { count: appointmentCount, error: appointmentError } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('patient_id', patientId)
        .gte('appointment_date', todayStr)

      if (!appointmentError) {
        upcomingAppointments = appointmentCount || 0
      }
    } catch (error) {
      console.log('Appointments table not available or contains invalid data (Phase 4):', error)
      // Keep defaults for appointment stats
    }

    // Build stats response with safe date handling
    const stats = {
      totalTreatments,
      totalAmountPaid: Number(totalAmountPaid.toFixed(2)), // Ensure proper decimal formatting
      upcomingAppointments,
      patientSince: patient?.created_at || new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    }

    return NextResponse.json({ stats })
  } catch (error) {
    console.error('Unexpected error in patient stats endpoint:', error)
    return NextResponse.json(
      {
        error: 'Internal server error while fetching patient statistics',
        details: process.env.NODE_ENV === 'development' ? (error as Error)?.message : undefined
      },
      { status: 500 }
    )
  }
}