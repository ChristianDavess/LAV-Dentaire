import { NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { createApiHandler, createSuccessResponse, ApiErrorClass } from '@/lib/middleware'
import { z } from 'zod'

// Query parameters validation schema
const getTreatmentsQuerySchema = z.object({
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  payment_status: z.enum(['pending', 'partial', 'paid']).optional(),
  patient_id: z.string().uuid().optional(),
  limit: z.coerce.number().min(1).max(500).default(50),
  offset: z.coerce.number().min(0).default(0)
})

// Schema for creating treatment with procedures
const createTreatmentSchema = z.object({
  patient_id: z.string().uuid('Invalid patient ID'),
  appointment_id: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? undefined : val),
    z.string().uuid('Invalid appointment ID').optional()
  ),
  treatment_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD format'),
  payment_status: z.enum(['pending', 'partial', 'paid']).default('pending'),
  notes: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? undefined : val),
    z.string().optional()
  ),
  procedures: z.array(z.object({
    procedure_id: z.string().uuid('Invalid procedure ID'),
    quantity: z.number().min(1, 'Quantity must be at least 1'),
    cost_per_unit: z.number().min(0, 'Cost must be positive'),
    tooth_number: z.preprocess(
      (val) => (val === '' || val === null || val === undefined ? undefined : val),
      z.string().optional()
    ),
    notes: z.preprocess(
      (val) => (val === '' || val === null || val === undefined ? undefined : val),
      z.string().optional()
    )
  })).min(1, 'At least one procedure is required')
})

// GET /api/treatments - List treatments with filtering
export const GET = createApiHandler()
  .requireAuth()
  .handle(async (request: NextRequest, user: any) => {
    const supabase = createServiceClient()

    // Parse and validate query parameters manually
    const url = new URL(request.url)
    const queryParams = Object.fromEntries(url.searchParams.entries())
    const validatedQuery = getTreatmentsQuerySchema.parse(queryParams)
    const { start_date, end_date, payment_status, patient_id, limit, offset } = validatedQuery

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
        ),
        treatment_procedures (
          id,
          procedure_id,
          quantity,
          cost_per_unit,
          total_cost,
          tooth_number,
          notes,
          procedure:procedure_id (
            id,
            name,
            description,
            default_cost,
            estimated_duration
          )
        )
      `)
      .order('treatment_date', { ascending: false })
      .range(offset, offset + limit - 1)

    // Apply filters
    if (start_date) query = query.gte('treatment_date', start_date)
    if (end_date) query = query.lte('treatment_date', end_date)
    if (payment_status) query = query.eq('payment_status', payment_status)
    if (patient_id) query = query.eq('patient_id', patient_id)

    const { data: treatments, error, count } = await query

    if (error) {
      console.error('Error fetching treatments:', error)
      throw new ApiErrorClass('Failed to fetch treatments', 500)
    }

    return createSuccessResponse({
      treatments,
      pagination: {
        limit,
        offset,
        total: count || 0,
        hasMore: (count || 0) > offset + limit
      }
    })
  })

// POST /api/treatments - Create new treatment
export const POST = createApiHandler()
  .requireAuth()
  .validateBody(createTreatmentSchema)
  .handle(async (request: NextRequest, user: any, treatmentData: z.infer<typeof createTreatmentSchema>) => {
    const supabase = createServiceClient()

    try {
      // Start transaction
      const { data: treatment, error: treatmentError } = await supabase
        .from('treatments')
        .insert({
          patient_id: treatmentData.patient_id,
          appointment_id: treatmentData.appointment_id,
          treatment_date: treatmentData.treatment_date,
          payment_status: treatmentData.payment_status,
          notes: treatmentData.notes,
          total_cost: 0 // Will be calculated after procedures are inserted
        })
        .select('*')
        .single()

      if (treatmentError || !treatment) {
        throw new ApiErrorClass('Failed to create treatment', 500)
      }

      // Insert treatment procedures
      const proceduresToInsert = treatmentData.procedures.map(proc => ({
        treatment_id: treatment.id,
        procedure_id: proc.procedure_id,
        quantity: proc.quantity,
        cost_per_unit: proc.cost_per_unit,
        total_cost: proc.quantity * proc.cost_per_unit,
        tooth_number: proc.tooth_number,
        notes: proc.notes
      }))

      const { data: procedures, error: proceduresError } = await supabase
        .from('treatment_procedures')
        .insert(proceduresToInsert)
        .select('*')

      if (proceduresError) {
        // Rollback treatment creation
        await supabase.from('treatments').delete().eq('id', treatment.id)
        throw new ApiErrorClass('Failed to create treatment procedures', 500)
      }

      // Update treatment total cost
      const totalCost = proceduresToInsert.reduce((sum, proc) => sum + proc.total_cost, 0)

      const { error: updateError } = await supabase
        .from('treatments')
        .update({ total_cost: totalCost })
        .eq('id', treatment.id)

      if (updateError) {
        console.error('Failed to update treatment total cost:', updateError)
        // Non-fatal error, continue
      }

      return createSuccessResponse(
        {
          treatment: { ...treatment, total_cost: totalCost },
          procedures
        },
        'Treatment created successfully',
        201
      )
    } catch (error) {
      if (error instanceof ApiErrorClass) {
        throw error
      }
      console.error('Error creating treatment:', error)
      throw new ApiErrorClass('Failed to create treatment', 500)
    }
  })