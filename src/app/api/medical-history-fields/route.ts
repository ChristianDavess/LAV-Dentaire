import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { medicalHistoryFieldSchema } from '@/lib/validations'

export async function GET() {
  try {
    const supabase = await createClient()

    const { data: fields, error } = await supabase
      .from('medical_history_fields')
      .select('*')
      .eq('is_active', true)
      .order('field_name')

    if (error) {
      console.error('Error fetching medical history fields:', error)
      // Return empty array instead of error to prevent blocking the UI
      return NextResponse.json({ fields: [] })
    }

    return NextResponse.json({ fields: fields || [] })
  } catch (error) {
    console.error('Unexpected error:', error)
    // Return empty array instead of error to prevent blocking the UI
    return NextResponse.json({ fields: [] })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    // Validate request body
    const validatedData = medicalHistoryFieldSchema.parse(body)

    const { data: field, error } = await supabase
      .from('medical_history_fields')
      .insert([validatedData])
      .select()
      .single()

    if (error) {
      console.error('Error creating medical history field:', error)
      return NextResponse.json(
        { error: 'Failed to create medical history field' },
        { status: 500 }
      )
    }

    return NextResponse.json({ field }, { status: 201 })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}