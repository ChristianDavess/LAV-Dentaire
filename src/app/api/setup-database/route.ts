import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'

export async function POST() {
  try {
    // Create admin client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Check if admin_users table exists by trying to query it
    const { error: tableCheckError } = await supabase
      .from('admin_users')
      .select('id')
      .limit(1)

    if (tableCheckError) {
      return NextResponse.json({
        error: 'Database tables not found. Please apply the migration first in Supabase dashboard.',
        details: 'Go to Supabase Dashboard > SQL Editor and run the migration from supabase/migrations/001_initial_schema.sql'
      }, { status: 400 })
    }

    // Create default admin user
    const hashedPassword = await bcrypt.hash('admin123', 12)

    // Check if admin user already exists
    const { data: existingUser } = await supabase
      .from('admin_users')
      .select('id')
      .eq('username', 'admin')
      .single()

    if (existingUser) {
      return NextResponse.json({
        message: 'Database already set up with admin user',
        adminCredentials: {
          username: 'admin',
          password: 'admin123'
        }
      })
    }

    const { error: insertError } = await supabase
      .from('admin_users')
      .insert({
        username: 'admin',
        email: 'admin@lavdentaire.com',
        password_hash: hashedPassword
      })

    if (insertError) {
      console.error('Admin user creation error:', insertError)
      return NextResponse.json({
        error: 'Failed to create admin user',
        details: insertError.message
      }, { status: 500 })
    }

    return NextResponse.json({
      message: 'Database setup completed successfully',
      adminCredentials: {
        username: 'admin',
        password: 'admin123'
      }
    })
  } catch (error) {
    console.error('Setup error:', error)
    return NextResponse.json({
      error: 'Failed to setup database',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}