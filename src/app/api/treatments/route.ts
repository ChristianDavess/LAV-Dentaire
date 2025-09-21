import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth-local'
import { treatmentSchema, treatmentProcedureSchema } from '@/lib/validations'
import { z } from 'zod'

// Schema for creating treatment with procedures
const createTreatmentSchema = z.object({
  patient_id: z.string().uuid('Invalid patient ID'),
  appointment_id: z.string().uuid('Invalid appointment ID').optional(),
  treatment_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD format'),
  payment_status: z.enum(['pending', 'partial', 'paid']).default('pending'),
  notes: z.string().optional(),
  procedures: z.array(z.object({
    procedure_id: z.string().uuid('Invalid procedure ID'),
    quantity: z.number().min(1, 'Quantity must be at least 1'),
    cost_per_unit: z.number().min(0, 'Cost must be positive'),
    tooth_number: z.string().optional(),
    notes: z.string().optional()
  })).min(1, 'At least one procedure is required')
})

// GET /api/treatments - List treatments with filtering
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
    const paymentStatus = searchParams.get('payment_status')
    const patientId = searchParams.get('patient_id')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    let query = supabase
      .from('treatments')
      .select(`
        *,
        patients:patient_id (
          id,
          patient_id,
          first_name,
          last_name,
          phone,
          email
        ),
        appointments:appointment_id (
          id,
          appointment_date,
          appointment_time
        )
      `)
      .order('treatment_date', { ascending: false })
      .range(offset, offset + limit - 1)

    // Apply filters
    if (startDate) {
      query = query.gte('treatment_date', startDate)
    }
    if (endDate) {
      query = query.lte('treatment_date', endDate)
    }
    if (paymentStatus) {
      query = query.eq('payment_status', paymentStatus)
    }
    if (patientId) {
      query = query.eq('patient_id', patientId)
    }

    const { data: treatments, error, count } = await query

    if (error) {
      console.error('Error fetching treatments:', error)
      return NextResponse.json(
        { error: 'Failed to fetch treatments' },
        { status: 500 }
      )
    }

    // Fetch procedures for each treatment
    const treatmentsWithProcedures = await Promise.all(
      (treatments || []).map(async (treatment) => {
        const { data: procedures } = await supabase
          .from('treatment_procedures')
          .select(`
            *,
            procedures:procedure_id (
              id,
              name,
              description
            )
          `)
          .eq('treatment_id', treatment.id)

        return {
          ...treatment,
          treatment_procedures: procedures || []
        }
      })
    )

    return NextResponse.json({
      treatments: treatmentsWithProcedures,
      total: count || 0,
      limit,
      offset
    })
  } catch (error) {
    console.error('Error in GET /api/treatments:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/treatments - Create treatment with procedures
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
    const validatedData = createTreatmentSchema.parse(body)

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

    // Check if appointment exists (if provided)
    if (validatedData.appointment_id) {
      const { data: appointment, error: appointmentError } = await supabase
        .from('appointments')
        .select('id')
        .eq('id', validatedData.appointment_id)
        .single()

      if (appointmentError || !appointment) {
        return NextResponse.json(
          { error: 'Appointment not found' },
          { status: 404 }
        )
      }
    }

    // Verify all procedures exist and calculate total cost
    let totalCost = 0
    for (const proc of validatedData.procedures) {
      const { data: procedure, error: procError } = await supabase
        .from('procedures')
        .select('id, is_active')
        .eq('id', proc.procedure_id)
        .single()

      if (procError || !procedure) {
        return NextResponse.json(
          { error: `Procedure not found: ${proc.procedure_id}` },
          { status: 404 }
        )
      }

      if (!procedure.is_active) {
        return NextResponse.json(
          { error: `Procedure is not active: ${proc.procedure_id}` },
          { status: 400 }
        )
      }

      totalCost += proc.cost_per_unit * proc.quantity
    }

    // Create treatment and procedures in a transaction
    const { data: treatment, error: treatmentError } = await supabase
      .from('treatments')
      .insert([{
        patient_id: validatedData.patient_id,
        appointment_id: validatedData.appointment_id,
        treatment_date: validatedData.treatment_date,
        total_cost: totalCost,
        payment_status: validatedData.payment_status,
        notes: validatedData.notes
      }])
      .select('*')
      .single()

    if (treatmentError) {
      console.error('Error creating treatment:', treatmentError)
      return NextResponse.json(
        { error: 'Failed to create treatment' },
        { status: 500 }
      )
    }

    // Create treatment procedures
    const treatmentProcedures = validatedData.procedures.map(proc => ({
      treatment_id: treatment.id,
      procedure_id: proc.procedure_id,
      quantity: proc.quantity,
      cost_per_unit: proc.cost_per_unit,
      total_cost: proc.cost_per_unit * proc.quantity,
      tooth_number: proc.tooth_number,
      notes: proc.notes
    }))

    const { error: proceduresError } = await supabase
      .from('treatment_procedures')
      .insert(treatmentProcedures)

    if (proceduresError) {
      // Rollback: delete the treatment if procedure creation fails
      await supabase.from('treatments').delete().eq('id', treatment.id)
      console.error('Error creating treatment procedures:', proceduresError)
      return NextResponse.json(
        { error: 'Failed to create treatment procedures' },
        { status: 500 }
      )
    }

    // Fetch the complete treatment with procedures
    const { data: completeTreatment } = await supabase
      .from('treatments')
      .select(`
        *,
        patients:patient_id (
          id,
          patient_id,
          first_name,
          last_name,
          phone,
          email
        ),
        appointments:appointment_id (
          id,
          appointment_date,
          appointment_time
        )
      `)
      .eq('id', treatment.id)
      .single()

    const { data: procedures } = await supabase
      .from('treatment_procedures')
      .select(`
        *,
        procedures:procedure_id (
          id,
          name,
          description
        )
      `)
      .eq('treatment_id', treatment.id)

    return NextResponse.json({
      treatment: {
        ...completeTreatment,
        treatment_procedures: procedures || []
      },
      message: 'Treatment created successfully'
    }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error in POST /api/treatments:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}