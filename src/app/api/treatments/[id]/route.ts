import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth-local'
import { z } from 'zod'

// Schema for updating treatment
const updateTreatmentSchema = z.object({
  treatment_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD format').optional(),
  payment_status: z.enum(['pending', 'partial', 'paid']).optional(),
  notes: z.string().optional(),
  procedures: z.array(z.object({
    id: z.string().uuid().optional(), // For existing procedures
    procedure_id: z.string().uuid('Invalid procedure ID'),
    quantity: z.number().min(1, 'Quantity must be at least 1'),
    cost_per_unit: z.number().min(0, 'Cost must be positive'),
    tooth_number: z.string().optional(),
    notes: z.string().optional()
  })).optional()
})

// GET /api/treatments/[id] - Get single treatment with procedures
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

    // Get treatment with patient and appointment info
    const { data: treatment, error } = await supabase
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
      .eq('id', id)
      .single()

    if (error || !treatment) {
      return NextResponse.json(
        { error: 'Treatment not found' },
        { status: 404 }
      )
    }

    // Get treatment procedures
    const { data: procedures } = await supabase
      .from('treatment_procedures')
      .select(`
        *,
        procedures:procedure_id (
          id,
          name,
          description,
          default_cost
        )
      `)
      .eq('treatment_id', id)

    return NextResponse.json({
      treatment: {
        ...treatment,
        treatment_procedures: procedures || []
      }
    })
  } catch (error) {
    console.error('Error in GET /api/treatments/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/treatments/[id] - Update treatment
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
    const validatedData = updateTreatmentSchema.parse(body)

    const supabase = await createClient()

    // Check if treatment exists
    const { data: existingTreatment, error: fetchError } = await supabase
      .from('treatments')
      .select('id, total_cost')
      .eq('id', id)
      .single()

    if (fetchError || !existingTreatment) {
      return NextResponse.json(
        { error: 'Treatment not found' },
        { status: 404 }
      )
    }

    let totalCost = existingTreatment.total_cost

    // Update procedures if provided
    if (validatedData.procedures) {
      // Remove existing procedures
      await supabase
        .from('treatment_procedures')
        .delete()
        .eq('treatment_id', id)

      // Verify all procedures exist and calculate total cost
      totalCost = 0
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

      // Create new treatment procedures
      const treatmentProcedures = validatedData.procedures.map(proc => ({
        treatment_id: id,
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
        console.error('Error updating treatment procedures:', proceduresError)
        return NextResponse.json(
          { error: 'Failed to update treatment procedures' },
          { status: 500 }
        )
      }
    }

    // Update treatment
    const updateData: any = {
      updated_at: new Date().toISOString(),
      total_cost: totalCost
    }

    if (validatedData.treatment_date) updateData.treatment_date = validatedData.treatment_date
    if (validatedData.payment_status) updateData.payment_status = validatedData.payment_status
    if (validatedData.notes !== undefined) updateData.notes = validatedData.notes

    const { data: treatment, error: updateError } = await supabase
      .from('treatments')
      .update(updateData)
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
        ),
        appointments:appointment_id (
          id,
          appointment_date,
          appointment_time
        )
      `)
      .single()

    if (updateError) {
      console.error('Error updating treatment:', updateError)
      return NextResponse.json(
        { error: 'Failed to update treatment' },
        { status: 500 }
      )
    }

    // Get updated procedures
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
      .eq('treatment_id', id)

    return NextResponse.json({
      treatment: {
        ...treatment,
        treatment_procedures: procedures || []
      },
      message: 'Treatment updated successfully'
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error in PUT /api/treatments/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/treatments/[id] - Delete treatment
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

    // Check if treatment exists
    const { data: existingTreatment, error: fetchError } = await supabase
      .from('treatments')
      .select('id')
      .eq('id', id)
      .single()

    if (fetchError || !existingTreatment) {
      return NextResponse.json(
        { error: 'Treatment not found' },
        { status: 404 }
      )
    }

    // Delete treatment procedures first (due to foreign key constraint)
    const { error: deleteProceduresError } = await supabase
      .from('treatment_procedures')
      .delete()
      .eq('treatment_id', id)

    if (deleteProceduresError) {
      console.error('Error deleting treatment procedures:', deleteProceduresError)
      return NextResponse.json(
        { error: 'Failed to delete treatment procedures' },
        { status: 500 }
      )
    }

    // Delete treatment
    const { error: deleteError } = await supabase
      .from('treatments')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Error deleting treatment:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete treatment' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Treatment deleted successfully'
    })
  } catch (error) {
    console.error('Error in DELETE /api/treatments/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}