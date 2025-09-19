import { NextResponse } from 'next/server'
import { createAdminUser } from '@/lib/auth'

export async function POST() {
  try {
    console.log('Setting up admin user...')

    // Create the default admin user
    const result = await createAdminUser('admin', 'admin@lavdentaire.com', 'admin123')

    console.log('Admin setup result:', result)

    if (!result.success) {
      // If user already exists, that's ok
      if (result.error === 'Username already exists') {
        return NextResponse.json({
          message: 'Admin user already exists',
          alreadyExists: true
        })
      }

      console.error('Admin setup failed:', result.error)
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json({
      message: 'Admin user created successfully',
      user: {
        id: result.user?.id,
        username: result.user?.username,
        email: result.user?.email
      }
    })
  } catch (error) {
    console.error('Admin setup error:', error)
    return NextResponse.json(
      { error: 'Failed to setup admin user', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}