import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { medicalHistoryFieldSchema } from '@/lib/validations'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params
    const body = await request.json()

    // Validate request body
    const validatedData = medicalHistoryFieldSchema.parse(body)

    const { data: field, error } = await supabase
      .from('medical_history_fields')
      .update(validatedData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating medical history field:', error)
      return NextResponse.json(
        { error: 'Failed to update medical history field' },
        { status: 500 }
      )
    }

    return NextResponse.json({ field })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params

    // Soft delete by setting is_active to false
    const { error } = await supabase
      .from('medical_history_fields')
      .update({ is_active: false })
      .eq('id', id)

    if (error) {
      console.error('Error deleting medical history field:', error)
      return NextResponse.json(
        { error: 'Failed to delete medical history field' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}