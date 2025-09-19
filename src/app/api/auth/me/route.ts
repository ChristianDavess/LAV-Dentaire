import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-local'

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value

    if (!token) {
      return NextResponse.json(
        { error: 'No authentication token' },
        { status: 401 }
      )
    }

    const user = await getCurrentUser(token)

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
    })
  } catch (error) {
    console.error('Get current user error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}