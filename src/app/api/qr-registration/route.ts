import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { createApiHandler, createSuccessResponse, ApiErrorClass } from '@/lib/middleware'
import { patientSchema } from '@/lib/validations'
import { z } from 'zod'
import { v4 as uuidv4 } from 'uuid'

// QR Token generation schema (for query parameters - strings need to be coerced)
const generateTokenSchema = z.object({
  expiration_hours: z.coerce.number().min(1).max(168).default(24), // 1 hour to 1 week
  note: z.string().optional(),
  qr_type: z.string().optional().default('single-use'),
  reusable: z.coerce.boolean().optional().default(false)
})

// Patient registration with QR token schema
const qrRegistrationSchema = z.object({
  token: z.string().uuid(),
  patient_data: patientSchema
})

// GET /api/qr-registration - Generate QR registration token
export const GET = createApiHandler()
  .requireAuth()
  .handle(async (request: NextRequest, user: any) => {
    const supabase = createServiceClient()

    // Parse query parameters
    const url = new URL(request.url)
    const queryParams = Object.fromEntries(url.searchParams.entries())
    const validatedQuery = generateTokenSchema.parse(queryParams)
    const { expiration_hours, note, qr_type, reusable } = validatedQuery

    try {
      // Generate unique token
      const token = uuidv4()

      // Calculate expiration time
      const expiresAt = new Date()
      expiresAt.setHours(expiresAt.getHours() + expiration_hours)

      // Insert token into database
      const { data: tokenData, error } = await supabase
        .from('qr_registration_tokens')
        .insert([
          {
            token,
            expires_at: expiresAt.toISOString(),
            used: false,
            reusable,
            qr_type,
            usage_count: 0
          }
        ])
        .select()
        .single()

      if (error) {
        console.error('Error creating QR token:', error)
        throw new ApiErrorClass('Failed to generate QR token', 500)
      }

      // Generate registration URL
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
      const registrationUrl = `${baseUrl}/patient-registration/${token}`

      return createSuccessResponse({
        token: tokenData.token,
        expires_at: tokenData.expires_at,
        registration_url: registrationUrl,
        expiration_hours,
        note
      }, 'QR token generated successfully', 201)

    } catch (error) {
      if (error instanceof ApiErrorClass) {
        throw error
      }
      console.error('Unexpected error generating QR token:', error)
      throw new ApiErrorClass('Failed to generate QR token', 500)
    }
  })

// POST /api/qr-registration - Validate QR token and create patient
export const POST = createApiHandler()
  .validateBody(qrRegistrationSchema)
  .handle(async (request: NextRequest, body: z.infer<typeof qrRegistrationSchema>) => {
    const supabase = createServiceClient()
    const { token, patient_data } = body

    try {
      // Validate and check token
      const { data: tokenData, error: tokenError } = await supabase
        .from('qr_registration_tokens')
        .select('*')
        .eq('token', token)
        .single()

      if (tokenError || !tokenData) {
        throw new ApiErrorClass('Invalid or expired QR token', 400)
      }

      // Check if non-reusable token has been used
      if (!tokenData.reusable && tokenData.used) {
        throw new ApiErrorClass('QR token has already been used', 400)
      }

      // Check if token has expired
      const now = new Date()
      const expiresAt = new Date(tokenData.expires_at)

      if (now > expiresAt) {
        throw new ApiErrorClass('QR token has expired', 400)
      }

      // Generate patient ID (reuse existing logic)
      const generatePatientId = async (): Promise<string> => {
        const { data: latestPatient, error } = await supabase
          .from('patients')
          .select('patient_id')
          .order('created_at', { ascending: false })
          .limit(1)

        if (error && error.code !== 'PGRST116') {
          throw new ApiErrorClass('Failed to generate patient ID', 500)
        }

        let nextNumber = 1

        if (latestPatient && latestPatient.length > 0) {
          const latestId = latestPatient[0].patient_id
          const numberMatch = latestId.match(/P(\d+)/)
          if (numberMatch) {
            nextNumber = parseInt(numberMatch[1]) + 1
          }
        }

        return `P${nextNumber.toString().padStart(3, '0')}`
      }

      const patientId = await generatePatientId()

      // Create patient with registration source tracking
      const { data: patient, error: patientError } = await supabase
        .from('patients')
        .insert([
          {
            ...patient_data,
            patient_id: patientId,
            registration_source: 'qr-token'
          }
        ])
        .select()
        .single()

      if (patientError) {
        console.error('Error creating patient from QR:', patientError)
        throw new ApiErrorClass('Failed to create patient', 500)
      }

      // Update token usage based on type
      if (tokenData.reusable) {
        // For reusable tokens, increment usage count
        const { error: updateError } = await supabase
          .from('qr_registration_tokens')
          .update({ usage_count: tokenData.usage_count + 1 })
          .eq('token', token)

        if (updateError) {
          console.error('Error updating token usage count:', updateError)
          // Don't throw here, patient was created successfully
        }
      } else {
        // For single-use tokens, mark as used
        const { error: updateError } = await supabase
          .from('qr_registration_tokens')
          .update({ used: true })
          .eq('token', token)

        if (updateError) {
          console.error('Error marking token as used:', updateError)
          // Don't throw here, patient was created successfully
        }
      }

      return createSuccessResponse(
        {
          patient,
          message: 'Patient registered successfully via QR code'
        },
        'Patient registration completed',
        201
      )

    } catch (error) {
      if (error instanceof ApiErrorClass) {
        throw error
      }
      console.error('Unexpected error in QR registration:', error)
      throw new ApiErrorClass('Failed to process QR registration', 500)
    }
  })

// DELETE /api/qr-registration - Clean up expired tokens
export const DELETE = createApiHandler()
  .requireAuth()
  .handle(async (request: NextRequest, user: any) => {
    const supabase = createServiceClient()

    try {
      const now = new Date().toISOString()

      // Delete expired tokens
      const { data: deletedTokens, error } = await supabase
        .from('qr_registration_tokens')
        .delete()
        .lt('expires_at', now)
        .select('id')

      if (error) {
        console.error('Error cleaning up expired tokens:', error)
        throw new ApiErrorClass('Failed to cleanup expired tokens', 500)
      }

      const cleanedCount = deletedTokens?.length || 0

      return createSuccessResponse(
        { cleaned_tokens: cleanedCount },
        `Successfully cleaned up ${cleanedCount} expired tokens`
      )

    } catch (error) {
      if (error instanceof ApiErrorClass) {
        throw error
      }
      console.error('Unexpected error cleaning up tokens:', error)
      throw new ApiErrorClass('Failed to cleanup expired tokens', 500)
    }
  })