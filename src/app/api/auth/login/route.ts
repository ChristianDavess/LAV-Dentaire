import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Sign in with Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const { data: adminData, error: adminError } = await supabase
      .from('admins')
      .select('*')
      .eq('email', email)
      .single();

    if (adminError || !adminData) {
      // Sign out if not admin
      await supabase.auth.signOut();
      return NextResponse.json(
        { error: 'Unauthorized. Admin access only.' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      user: data.user,
      admin: adminData,
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}