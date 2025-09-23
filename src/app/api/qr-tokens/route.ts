import { NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { createApiHandler, createSuccessResponse, ApiErrorClass } from '@/lib/middleware'
import { z } from 'zod'

// Query parameters validation schema for token listing
const getTokensQuerySchema = z.object({
  status: z.enum(['all', 'active', 'used', 'expired']).default('all'),
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
  sort_by: z.enum(['created_at', 'expires_at']).default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc')
})

// GET /api/qr-tokens - List QR tokens with filtering
export const GET = createApiHandler()
  .requireAuth()
  .handle(async (request: NextRequest, user: any) => {
    const supabase = createServiceClient()

    // Parse and validate query parameters
    const url = new URL(request.url)
    const queryParams = Object.fromEntries(url.searchParams.entries())
    const validatedQuery = getTokensQuerySchema.parse(queryParams)
    const { status, limit, offset, sort_by, sort_order } = validatedQuery

    try {
      let query = supabase
        .from('qr_registration_tokens')
        .select('*', { count: 'exact' })
        .order(sort_by, { ascending: sort_order === 'asc' })
        .range(offset, offset + limit - 1)

      // Apply status filter
      const now = new Date().toISOString()
      if (status === 'active') {
        query = query.eq('used', false).gt('expires_at', now)
      } else if (status === 'used') {
        query = query.eq('used', true)
      } else if (status === 'expired') {
        query = query.eq('used', false).lt('expires_at', now)
      }

      const { data: tokens, error, count } = await query

      if (error) {
        console.error('Error fetching QR tokens:', error)
        throw new ApiErrorClass('Failed to fetch QR tokens', 500)
      }

      return createSuccessResponse({
        tokens: tokens || [],
        pagination: {
          limit,
          offset,
          total: count || 0,
          hasMore: (count || 0) > offset + limit
        }
      })

    } catch (error) {
      if (error instanceof ApiErrorClass) {
        throw error
      }
      console.error('Unexpected error fetching QR tokens:', error)
      throw new ApiErrorClass('Failed to fetch QR tokens', 500)
    }
  })