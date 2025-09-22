import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth-local'
import { procedureSchema } from '@/lib/validations'
import { z } from 'zod'

// GET /api/procedures/[id] - Get single procedure
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
    const { data: procedure, error } = await supabase
      .from('procedures')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !procedure) {
      return NextResponse.json(
        { error: 'Procedure not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ procedure })
  } catch (error) {
    console.error('Error in GET /api/procedures/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/procedures/[id] - Update procedure
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
    const validatedData = procedureSchema.parse(body)

    const supabase = await createClient()

    // Check if procedure exists
    const { data: existingProcedure, error: fetchError } = await supabase
      .from('procedures')
      .select('id')
      .eq('id', id)
      .single()

    if (fetchError || !existingProcedure) {
      return NextResponse.json(
        { error: 'Procedure not found' },
        { status: 404 }
      )
    }

    // Check if another procedure with same name exists (excluding current one)
    const { data: duplicateProcedure } = await supabase
      .from('procedures')
      .select('id')
      .ilike('name', validatedData.name)
      .neq('id', id)
      .single()

    if (duplicateProcedure) {
      return NextResponse.json(
        { error: 'Another procedure with this name already exists' },
        { status: 409 }
      )
    }

    // Update procedure
    const { data: procedure, error: updateError } = await supabase
      .from('procedures')
      .update({
        ...validatedData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select('*')
      .single()

    if (updateError) {
      console.error('Error updating procedure:', updateError)
      return NextResponse.json(
        { error: 'Failed to update procedure' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      procedure,
      message: 'Procedure updated successfully'
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error in PUT /api/procedures/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/procedures/[id] - Delete procedure
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

    // Check if procedure exists
    const { data: existingProcedure, error: fetchError } = await supabase
      .from('procedures')
      .select('id')
      .eq('id', id)
      .single()

    if (fetchError || !existingProcedure) {
      return NextResponse.json(
        { error: 'Procedure not found' },
        { status: 404 }
      )
    }

    // Check if procedure is used in any treatments
    const { data: treatmentProcedures, error: checkError } = await supabase
      .from('treatment_procedures')
      .select('id')
      .eq('procedure_id', id)
      .limit(1)

    if (checkError) {
      console.error('Error checking procedure usage:', checkError)
      return NextResponse.json(
        { error: 'Failed to check procedure usage' },
        { status: 500 }
      )
    }

    if (treatmentProcedures && treatmentProcedures.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete procedure that is used in treatments. Consider deactivating it instead.' },
        { status: 409 }
      )
    }

    // Delete procedure
    const { error: deleteError } = await supabase
      .from('procedures')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Error deleting procedure:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete procedure' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Procedure deleted successfully'
    })
  } catch (error) {
    console.error('Error in DELETE /api/procedures/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}