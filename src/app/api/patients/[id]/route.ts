import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { getCurrentUser } from '@/lib/auth-local'
import { createApiHandler, createSuccessResponse, ApiErrorClass } from '@/lib/middleware'
import { patientSchema } from '@/lib/validations'
import { z } from 'zod'

interface PatientUpdateRouteParams {
  params: Promise<{ id: string }>
}

export async function GET(
  request: NextRequest,
  context: PatientUpdateRouteParams
) {
  try {
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

    const { id: patientId } = await context.params

    if (!patientId) {
      return NextResponse.json(
        { error: 'Patient ID is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    const { data: patient, error } = await supabase
      .from('patients')
      .select('*')
      .eq('id', patientId)
      .single()

    if (error || !patient) {
      return NextResponse.json(
        { error: 'Patient not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ patient })
  } catch (error) {
    console.error('Patient GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch patient' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  context: PatientUpdateRouteParams
) {
  return createApiHandler()
    .requireAuth()
    .validateBody(patientSchema)
    .handle(async (req: NextRequest, user: any, validatedData: z.infer<typeof patientSchema>) => {
      const supabase = createServiceClient()

      // Extract patient ID from URL path - fixed for middleware
      const url = new URL(req.url)
      const pathParts = url.pathname.split('/')
      const patientId = pathParts[pathParts.length - 1]

      if (!patientId || patientId === '[id]') {
        throw new ApiErrorClass('Patient ID is required', 400)
      }

    // Verify patient exists
    const { data: existingPatient, error: fetchError } = await supabase
      .from('patients')
      .select('id')
      .eq('id', patientId)
      .single()

    if (fetchError || !existingPatient) {
      throw new ApiErrorClass('Patient not found', 404)
    }

    // Update patient data
    const { data: updatedPatient, error: updateError } = await supabase
      .from('patients')
      .update({
        ...validatedData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', patientId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating patient:', updateError)
      throw new ApiErrorClass('Failed to update patient', 500)
    }

      return createSuccessResponse(
        { patient: updatedPatient },
        'Patient updated successfully'
      )
    })(request, context)
}

export async function DELETE(
  request: NextRequest,
  context: PatientUpdateRouteParams
) {
  return createApiHandler()
    .requireAuth()
    .handle(async (req: NextRequest, user: any) => {
      const supabase = createServiceClient()

      // Extract patient ID from URL path - fixed for middleware (DELETE)
      const url = new URL(req.url)
      const pathParts = url.pathname.split('/')
      const patientId = pathParts[pathParts.length - 1]

      if (!patientId || patientId === '[id]') {
        throw new ApiErrorClass('Patient ID is required', 400)
      }

      // Verify patient exists
      const { data: existingPatient, error: fetchError } = await supabase
        .from('patients')
        .select('id, patient_id, first_name, last_name')
        .eq('id', patientId)
        .single()

      if (fetchError || !existingPatient) {
        throw new ApiErrorClass('Patient not found', 404)
      }

      // Delete patient
      const { error: deleteError } = await supabase
        .from('patients')
        .delete()
        .eq('id', patientId)

      if (deleteError) {
        console.error('Error deleting patient:', deleteError)
        throw new ApiErrorClass('Failed to delete patient', 500)
      }

      return createSuccessResponse({
        message: `Patient ${existingPatient.first_name} ${existingPatient.last_name} (${existingPatient.patient_id}) has been deleted successfully`,
        deletedPatient: existingPatient
      })
    })(request, context)
}