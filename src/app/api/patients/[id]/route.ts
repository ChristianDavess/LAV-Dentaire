import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth-local'
import { patientSchema } from '@/lib/validations'

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

    const body = await request.json()

    // Validate request body
    const validatedData = patientSchema.parse(body)

    const supabase = await createClient()

    // Verify patient exists
    const { data: existingPatient, error: fetchError } = await supabase
      .from('patients')
      .select('id')
      .eq('id', patientId)
      .single()

    if (fetchError || !existingPatient) {
      return NextResponse.json(
        { error: 'Patient not found' },
        { status: 404 }
      )
    }

    // Update patient data - schema preprocessing handles empty string conversion
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
      return NextResponse.json(
        { error: 'Failed to update patient' },
        { status: 500 }
      )
    }

    return NextResponse.json({ patient: updatedPatient })
  } catch (error) {
    console.error('Patient PUT error:', error)
    return NextResponse.json(
      { error: 'Failed to update patient' },
      { status: 500 }
    )
  }
}

export async function DELETE(
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

    // Verify patient exists
    const { data: existingPatient, error: fetchError } = await supabase
      .from('patients')
      .select('id, patient_id, first_name, last_name')
      .eq('id', patientId)
      .single()

    if (fetchError || !existingPatient) {
      return NextResponse.json(
        { error: 'Patient not found' },
        { status: 404 }
      )
    }

    // Delete patient
    const { error: deleteError } = await supabase
      .from('patients')
      .delete()
      .eq('id', patientId)

    if (deleteError) {
      console.error('Error deleting patient:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete patient' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: `Patient ${existingPatient.first_name} ${existingPatient.last_name} (${existingPatient.patient_id}) has been deleted successfully`,
      deletedPatient: existingPatient
    })
  } catch (error) {
    console.error('Patient DELETE error:', error)
    return NextResponse.json(
      { error: 'Failed to delete patient' },
      { status: 500 }
    )
  }
}