import { NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { createApiHandler, createSuccessResponse, ApiErrorClass } from '@/lib/middleware'
import { z } from 'zod'

const validateTokenSchema = z.object({
  token: z.string().uuid()
})

// POST /api/qr-tokens/validate - Validate QR token without consuming it
export const POST = createApiHandler()
  .validateBody(validateTokenSchema)
  .handle(async (request: NextRequest, body: z.infer<typeof validateTokenSchema>) => {
    const supabase = createServiceClient()
    const { token } = body

    try {
      // Check if token exists and is valid
      const { data: tokenData, error } = await supabase
        .from('qr_registration_tokens')
        .select('id, token, expires_at, used, reusable, qr_type, usage_count, created_at')
        .eq('token', token)
        .single()

      if (error || !tokenData) {
        return createSuccessResponse({
          valid: false,
          reason: 'Token not found'
        })
      }

      // Check if non-reusable token has been used
      if (!tokenData.reusable && tokenData.used) {
        return createSuccessResponse({
          valid: false,
          reason: 'Token has already been used'
        })
      }

      // Check if token has expired
      const now = new Date()
      const expiresAt = new Date(tokenData.expires_at)

      if (now > expiresAt) {
        return createSuccessResponse({
          valid: false,
          reason: 'Token has expired'
        })
      }

      return createSuccessResponse({
        valid: true,
        token: {
          id: tokenData.id,
          expires_at: tokenData.expires_at,
          created_at: tokenData.created_at,
          reusable: tokenData.reusable,
          qr_type: tokenData.qr_type,
          usage_count: tokenData.usage_count
        }
      })

    } catch (error) {
      console.error('Unexpected error validating QR token:', error)
      throw new ApiErrorClass('Failed to validate QR token', 500)
    }
  })