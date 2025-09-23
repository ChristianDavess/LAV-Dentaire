import { NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { createApiHandler, createSuccessResponse, ApiErrorClass } from '@/lib/middleware'
import { z } from 'zod'

const tokenIdSchema = z.object({
  id: z.string().uuid()
})

// GET /api/qr-tokens/[id] - Get individual QR token details
export const GET = createApiHandler()
  .requireAuth()
  .handle(async (request: NextRequest, user: any, context: { params: { id: string } }) => {
    const supabase = createServiceClient()

    try {
      // Validate token ID
      const { id } = tokenIdSchema.parse({ id: context.params.id })

      // Fetch token details
      const { data: token, error } = await supabase
        .from('qr_registration_tokens')
        .select('*')
        .eq('id', id)
        .single()

      if (error || !token) {
        throw new ApiErrorClass('QR token not found', 404)
      }

      // Generate registration URL for the token
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
      let registrationUrl: string

      if (token.qr_type === 'generic') {
        registrationUrl = `${baseUrl}/patient-registration`
      } else {
        registrationUrl = `${baseUrl}/patient-registration/${token.token}`
      }

      // Add computed fields
      const now = new Date()
      const expiresAt = new Date(token.expires_at)
      const isExpired = token.qr_type !== 'generic' && now > expiresAt
      const isUsed = !token.reusable && token.used

      return createSuccessResponse({
        ...token,
        registration_url: registrationUrl,
        is_expired: isExpired,
        is_used: isUsed,
        status: isUsed ? 'used' : isExpired ? 'expired' : 'active'
      })

    } catch (error) {
      if (error instanceof ApiErrorClass) {
        throw error
      }
      console.error('Unexpected error fetching QR token:', error)
      throw new ApiErrorClass('Failed to fetch QR token', 500)
    }
  })

// DELETE /api/qr-tokens/[id] - Delete individual QR token
export const DELETE = createApiHandler()
  .requireAuth()
  .handle(async (request: NextRequest, user: any, context: { params: { id: string } }) => {
    const supabase = createServiceClient()

    try {
      // Validate token ID
      const { id } = tokenIdSchema.parse({ id: context.params.id })

      // First, check if token exists and get its details
      const { data: token, error: fetchError } = await supabase
        .from('qr_registration_tokens')
        .select('*')
        .eq('id', id)
        .single()

      if (fetchError || !token) {
        throw new ApiErrorClass('QR token not found', 404)
      }

      // Check how many registrations used this token (for analytics)
      const { count: registrationCount, error: countError } = await supabase
        .from('patients')
        .select('id', { count: 'exact', head: true })
        .eq('registration_source', 'qr-token')
        // Note: We can't directly link to specific token without additional tracking

      if (countError) {
        console.warn('Could not count registrations for token:', countError)
      }

      // Delete the token
      const { error: deleteError } = await supabase
        .from('qr_registration_tokens')
        .delete()
        .eq('id', id)

      if (deleteError) {
        console.error('Error deleting QR token:', deleteError)
        throw new ApiErrorClass('Failed to delete QR token', 500)
      }

      return createSuccessResponse({
        message: 'QR token deleted successfully',
        deleted_token: {
          id: token.id,
          qr_type: token.qr_type,
          usage_count: token.usage_count,
          was_used: token.used
        }
      })

    } catch (error) {
      if (error instanceof ApiErrorClass) {
        throw error
      }
      console.error('Unexpected error deleting QR token:', error)
      throw new ApiErrorClass('Failed to delete QR token', 500)
    }
  })