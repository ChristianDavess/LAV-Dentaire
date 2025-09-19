import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { patientSchema } from '@/lib/validations'

// Force recompilation with updated schema

// Generate the next patient ID (P001, P002, etc.)
async function generatePatientId(supabase: any): Promise<string> {
  // Get the latest patient ID
  const { data: latestPatient, error } = await supabase
    .from('patients')
    .select('patient_id')
    .order('created_at', { ascending: false })
    .limit(1)

  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
    throw new Error('Failed to generate patient ID')
  }

  let nextNumber = 1

  if (latestPatient && latestPatient.length > 0) {
    const latestId = latestPatient[0].patient_id
    // Extract number from P001 format
    const numberMatch = latestId.match(/P(\d+)/)
    if (numberMatch) {
      nextNumber = parseInt(numberMatch[1]) + 1
    }
  }

  // Format as P001, P002, etc.
  return `P${nextNumber.toString().padStart(3, '0')}`
}

export async function GET() {
  try {
    const supabase = await createClient()

    const { data: patients, error } = await supabase
      .from('patients')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching patients:', error)
      return NextResponse.json(
        { error: 'Failed to fetch patients' },
        { status: 500 }
      )
    }

    return NextResponse.json({ patients })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    // Validate request body with updated schema
    const validatedData = patientSchema.parse(body)

    // Generate auto-incremented patient ID
    const patientId = await generatePatientId(supabase)

    // Prepare patient data with generated ID - schema preprocessing handles empty string conversion
    const patientData = {
      ...validatedData,
      patient_id: patientId,
    }

    const { data: patient, error } = await supabase
      .from('patients')
      .insert([patientData])
      .select()
      .single()

    if (error) {
      console.error('Error creating patient:', error)
      return NextResponse.json(
        { error: 'Failed to create patient' },
        { status: 500 }
      )
    }

    return NextResponse.json({ patient }, { status: 201 })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}