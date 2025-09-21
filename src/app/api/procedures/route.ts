import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth-local'
import { procedureSchema } from '@/lib/validations'
import { z } from 'zod'

// GET /api/procedures - List procedures with filtering and search
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

    const search = searchParams.get('search')
    const isActive = searchParams.get('is_active')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    let query = supabase
      .from('procedures')
      .select('*')
      .order('name', { ascending: true })
      .range(offset, offset + limit - 1)

    // Apply filters
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`)
    }
    if (isActive !== null && isActive !== undefined) {
      query = query.eq('is_active', isActive === 'true')
    }

    const { data: procedures, error, count } = await query

    if (error) {
      console.error('Error fetching procedures:', error)
      return NextResponse.json(
        { error: 'Failed to fetch procedures' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      procedures: procedures || [],
      total: count || 0,
      limit,
      offset
    })
  } catch (error) {
    console.error('Error in GET /api/procedures:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/procedures - Create new procedure
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
    const validatedData = procedureSchema.parse(body)

    const supabase = await createClient()

    // Check if procedure with same name already exists
    const { data: existingProcedure } = await supabase
      .from('procedures')
      .select('id')
      .ilike('name', validatedData.name)
      .single()

    if (existingProcedure) {
      return NextResponse.json(
        { error: 'Procedure with this name already exists' },
        { status: 409 }
      )
    }

    // Create procedure
    const { data: procedure, error: createError } = await supabase
      .from('procedures')
      .insert([validatedData])
      .select('*')
      .single()

    if (createError) {
      console.error('Error creating procedure:', createError)
      return NextResponse.json(
        { error: 'Failed to create procedure' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      procedure,
      message: 'Procedure created successfully'
    }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error in POST /api/procedures:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}