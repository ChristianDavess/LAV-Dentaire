import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { verifyPasswordResetToken, updateUserPassword } from '@/lib/auth-local'

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .max(100, 'Password must be less than 100 characters'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input
    const { token, password } = resetPasswordSchema.parse(body)

    // Verify reset token
    const tokenData = verifyPasswordResetToken(token)

    if (!tokenData) {
      return NextResponse.json(
        { error: 'Invalid or expired reset token' },
        { status: 400 }
      )
    }

    // Update user password
    const result = await updateUserPassword(tokenData.email, password)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to update password' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Password updated successfully'
    })

  } catch (error) {
    console.error('Reset password error:', error)

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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { error: 'Reset token is required' },
        { status: 400 }
      )
    }

    // Verify reset token
    const tokenData = verifyPasswordResetToken(token)

    if (!tokenData) {
      return NextResponse.json(
        { error: 'Invalid or expired reset token' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      email: tokenData.email
    })

  } catch (error) {
    console.error('Validate reset token error:', error)

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}