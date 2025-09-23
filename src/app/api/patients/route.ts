import { NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { createApiHandler, createSuccessResponse, ApiErrorClass } from '@/lib/middleware'
import { patientSchema } from '@/lib/validations'
import { z } from 'zod'

// Query parameters validation schema for patient listing
const getPatientsQuerySchema = z.object({
  search: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
  sort_by: z.enum(['created_at', 'first_name', 'last_name']).default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc')
})

// Generate the next patient ID (P001, P002, etc.)
async function generatePatientId(supabase: any): Promise<string> {
  const { data: latestPatient, error } = await supabase
    .from('patients')
    .select('patient_id')
    .order('created_at', { ascending: false })
    .limit(1)

  if (error && error.code !== 'PGRST116') {
    throw new ApiErrorClass('Failed to generate patient ID', 500)
  }

  let nextNumber = 1

  if (latestPatient && latestPatient.length > 0) {
    const latestId = latestPatient[0].patient_id
    const numberMatch = latestId.match(/P(\d+)/)
    if (numberMatch) {
      nextNumber = parseInt(numberMatch[1]) + 1
    }
  }

  return `P${nextNumber.toString().padStart(3, '0')}`
}

// GET /api/patients - List patients with filtering and pagination
export const GET = createApiHandler()
  .requireAuth()
  .handle(async (request: NextRequest, user: any) => {
    const supabase = createServiceClient()

    // Parse and validate query parameters manually
    const url = new URL(request.url)
    const queryParams = Object.fromEntries(url.searchParams.entries())
    const validatedQuery = getPatientsQuerySchema.parse(queryParams)
    const { search, limit, offset, sort_by, sort_order } = validatedQuery

    let query = supabase
      .from('patients')
      .select('*', { count: 'exact' })
      .order(sort_by, { ascending: sort_order === 'asc' })
      .range(offset, offset + limit - 1)

    // Apply search filter if provided
    if (search) {
      query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,patient_id.ilike.%${search}%,phone.ilike.%${search}%`)
    }

    const { data: patients, error, count } = await query

    if (error) {
      console.error('Error fetching patients:', error)
      throw new ApiErrorClass('Failed to fetch patients', 500)
    }

    return createSuccessResponse({
      patients,
      pagination: {
        limit,
        offset,
        total: count || 0,
        hasMore: (count || 0) > offset + limit
      }
    })
  })

// POST /api/patients - Create new patient
export const POST = createApiHandler()
  .requireAuth()
  .validateBody(patientSchema)
  .handle(async (request: NextRequest, user: any, patientData: z.infer<typeof patientSchema>) => {
    const supabase = createServiceClient()

    try {
      // Generate auto-incremented patient ID
      const patientId = await generatePatientId(supabase)

      // Prepare patient data with generated ID
      const finalPatientData = {
        ...patientData,
        patient_id: patientId,
      }

      const { data: patient, error } = await supabase
        .from('patients')
        .insert([finalPatientData])
        .select()
        .single()

      if (error) {
        console.error('Error creating patient:', error)
        throw new ApiErrorClass('Failed to create patient', 500)
      }

      return createSuccessResponse(
        { patient },
        'Patient created successfully',
        201
      )
    } catch (error) {
      if (error instanceof ApiErrorClass) {
        throw error
      }
      console.error('Unexpected error creating patient:', error)
      throw new ApiErrorClass('Failed to create patient', 500)
    }
  })