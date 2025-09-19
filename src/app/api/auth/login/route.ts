import { NextRequest, NextResponse } from 'next/server'
import { authenticateUser, generateToken } from '@/lib/auth-local'
import { z } from 'zod'

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input
    const { username, password } = loginSchema.parse(body)

    // Authenticate user
    const authResult = await authenticateUser(username, password)

    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { error: authResult.error || 'Authentication failed' },
        { status: 401 }
      )
    }

    // Generate JWT token
    const token = generateToken({
      userId: authResult.user.id,
      username: authResult.user.username,
      email: authResult.user.email,
    })

    // Create response with token in HTTP-only cookie
    const response = NextResponse.json({
      success: true,
      user: {
        id: authResult.user.id,
        username: authResult.user.username,
        email: authResult.user.email,
      },
    })

    // Set secure HTTP-only cookie
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Login error:', error)

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