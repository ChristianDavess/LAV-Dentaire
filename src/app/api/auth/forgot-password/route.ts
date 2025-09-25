import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { Resend } from 'resend'
import { findUserByEmail, generatePasswordResetToken } from '@/lib/auth-local'

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
})

const resend = new Resend(process.env.RESEND_API_KEY!)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input
    const { email } = forgotPasswordSchema.parse(body)

    // Find user by email (since this is a single-user system)
    const user = await findUserByEmail(email)
    console.log('Looking for user with email:', email)
    console.log('User found:', user ? 'Yes' : 'No')

    // Always return success to prevent email enumeration attacks
    // But only send email if user exists
    if (user) {
      // Generate password reset token
      const resetToken = generatePasswordResetToken(email)

      // Create reset URL
      const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password/${resetToken}`

      // Send email using Resend
      try {
        const emailResult = await resend.emails.send({
          from: `LAV Dentaire <${process.env.FROM_EMAIL}>`,
          to: email,
          subject: 'Password Reset Request - LAV Dentaire',
          html: `
            <!DOCTYPE html>
            <html>
              <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Password Reset - LAV Dentaire</title>
              </head>
              <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
                <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 40px; border-radius: 8px; margin-top: 40px; margin-bottom: 40px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">

                  <!-- Header -->
                  <div style="text-align: center; margin-bottom: 40px;">
                    <h1 style="color: #1a1a1a; font-size: 28px; margin: 0; font-weight: 600;">LAV Dentaire</h1>
                    <p style="color: #666; margin-top: 8px; font-size: 16px;">Dental Clinic Management</p>
                  </div>

                  <!-- Main Content -->
                  <div style="margin-bottom: 40px;">
                    <h2 style="color: #1a1a1a; font-size: 24px; margin-bottom: 20px; font-weight: 600;">Password Reset Request</h2>

                    <p style="color: #333; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                      We received a request to reset your password for your LAV Dentaire admin account.
                    </p>

                    <p style="color: #333; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
                      Click the button below to reset your password. This link will expire in 1 hour for security purposes.
                    </p>

                    <!-- Reset Button -->
                    <div style="text-align: center; margin: 30px 0;">
                      <a href="${resetUrl}" style="display: inline-block; background-color: #0066cc; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
                        Reset Password
                      </a>
                    </div>

                    <p style="color: #666; font-size: 14px; line-height: 1.6; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                      If you didn't request this password reset, you can safely ignore this email. Your password will remain unchanged.
                    </p>

                    <p style="color: #666; font-size: 14px; line-height: 1.6; margin-top: 15px;">
                      If the button doesn't work, you can copy and paste this link into your browser:<br>
                      <span style="color: #0066cc; word-break: break-all;">${resetUrl}</span>
                    </p>
                  </div>

                  <!-- Footer -->
                  <div style="text-align: center; padding-top: 30px; border-top: 1px solid #eee;">
                    <p style="color: #999; font-size: 14px; margin: 0;">
                      This email was sent from LAV Dentaire Clinic Management System
                    </p>
                  </div>
                </div>
              </body>
            </html>
          `,
        })
        console.log('Password reset email sent successfully to:', email)
        console.log('Resend response:', emailResult)
      } catch (emailError) {
        console.error('Failed to send password reset email:', emailError)
        // Don't return error to prevent email enumeration
      }
    }

    // Always return success response
    return NextResponse.json({
      success: true,
      message: 'If an account with that email exists, we have sent a password reset link.'
    })

  } catch (error) {
    console.error('Forgot password error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}