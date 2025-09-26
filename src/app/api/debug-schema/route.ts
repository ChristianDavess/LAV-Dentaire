import { NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { createApiHandler, createSuccessResponse, ApiErrorClass } from '@/lib/middleware'

// GET /api/debug-schema - Check current table schema
export const GET = createApiHandler()
  .requireAuth()
  .handle(async (request: NextRequest, user: any) => {
    const supabase = createServiceClient()

    try {
      console.log('🔍 Checking table schema...')

      // Try to select from qr_registration_tokens to see what columns exist
      const { data: tokens, error: tokensError } = await supabase
        .from('qr_registration_tokens')
        .select('*')
        .limit(1)

      if (tokensError) {
        console.error('Tokens query error:', tokensError)
      }

      // Try to get table structure via information_schema (if accessible)
      const { data: columns, error: columnsError } = await supabase
        .rpc('sql', {
          query: `SELECT column_name, data_type, is_nullable
                  FROM information_schema.columns
                  WHERE table_name = 'qr_registration_tokens'
                  ORDER BY ordinal_position`
        })

      if (columnsError) {
        console.error('Columns query error:', columnsError)
      }

      return createSuccessResponse({
        tokens_sample: tokens,
        tokens_error: tokensError?.message,
        columns,
        columns_error: columnsError?.message,
        message: 'Schema debugging info'
      })

    } catch (error) {
      console.error('Debug schema failed:', error)
      throw new ApiErrorClass('Failed to debug schema', 500)
    }
  })