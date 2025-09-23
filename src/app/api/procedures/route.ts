import { NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { createApiHandler, createSuccessResponse, ApiErrorClass } from '@/lib/middleware'
import { procedureSchema } from '@/lib/validations'
import { z } from 'zod'

// Query parameters validation schema for procedure listing
const getProceduresQuerySchema = z.object({
  search: z.string().optional(),
  is_active: z.coerce.boolean().optional(),
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
  sort_by: z.enum(['name', 'default_cost', 'created_at']).default('name'),
  sort_order: z.enum(['asc', 'desc']).default('asc')
})

// GET /api/procedures - List procedures with filtering and search
export const GET = createApiHandler()
  .requireAuth()
  .handle(async (request: NextRequest, user: any) => {
    const supabase = createServiceClient()

    // Parse and validate query parameters manually
    const url = new URL(request.url)
    const queryParams = Object.fromEntries(url.searchParams.entries())
    const validatedQuery = getProceduresQuerySchema.parse(queryParams)
    const { search, is_active, limit, offset, sort_by, sort_order } = validatedQuery

    let query = supabase
      .from('procedures')
      .select('*', { count: 'exact' })
      .order(sort_by, { ascending: sort_order === 'asc' })
      .range(offset, offset + limit - 1)

    // Apply filters
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`)
    }
    if (is_active !== undefined) {
      query = query.eq('is_active', is_active)
    }

    const { data: procedures, error, count } = await query

    if (error) {
      console.error('Error fetching procedures:', error)
      throw new ApiErrorClass('Failed to fetch procedures', 500)
    }

    return createSuccessResponse({
      procedures: procedures || [],
      pagination: {
        limit,
        offset,
        total: count || 0,
        hasMore: (count || 0) > offset + limit
      }
    })
  })

// POST /api/procedures - Create new procedure
export const POST = createApiHandler()
  .requireAuth()
  .validateBody(procedureSchema)
  .handle(async (request: NextRequest, user: any, validatedData: z.infer<typeof procedureSchema>) => {
    const supabase = createServiceClient()

    try {
      // Check if procedure with same name already exists
      const { data: existingProcedure } = await supabase
        .from('procedures')
        .select('id')
        .ilike('name', validatedData.name)
        .single()

      if (existingProcedure) {
        throw new ApiErrorClass('Procedure with this name already exists', 409)
      }

      // Create procedure
      const { data: procedure, error: createError } = await supabase
        .from('procedures')
        .insert([validatedData])
        .select('*')
        .single()

      if (createError) {
        console.error('Error creating procedure:', createError)
        throw new ApiErrorClass('Failed to create procedure', 500)
      }

      return createSuccessResponse(
        { procedure },
        'Procedure created successfully',
        201
      )
    } catch (error) {
      if (error instanceof ApiErrorClass) {
        throw error
      }
      console.error('Unexpected error creating procedure:', error)
      throw new ApiErrorClass('Failed to create procedure', 500)
    }
  })