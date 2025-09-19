import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { createClient } from '@supabase/supabase-js'

export interface AuthResult {
  success: boolean
  user?: { id: string; username: string; email: string }
  error?: string
}

export interface JWTPayload {
  userId: string
  username: string
  email: string
}

// Supabase client for auth operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Hash password
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(12)
  return bcrypt.hash(password, salt)
}

// Verify password
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

// Generate JWT token
export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, process.env.NEXTAUTH_SECRET!, {
    expiresIn: '7d',
  })
}

// Verify JWT token
export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, process.env.NEXTAUTH_SECRET!) as JWTPayload
  } catch (error) {
    return null
  }
}

// Authenticate user (using Supabase admin_users table)
export async function authenticateUser(username: string, password: string): Promise<AuthResult> {
  try {
    // Query admin_users table
    const { data: user, error } = await supabase
      .from('admin_users')
      .select('id, username, email, password_hash')
      .eq('username', username)
      .single()

    if (error || !user) {
      return {
        success: false,
        error: 'Invalid username or password'
      }
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.password_hash)

    if (!isValidPassword) {
      return {
        success: false,
        error: 'Invalid username or password'
      }
    }

    return {
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      }
    }
  } catch (error) {
    console.error('Authentication error:', error)
    return {
      success: false,
      error: 'Authentication failed'
    }
  }
}

// Get current user from JWT token
export async function getCurrentUser(token: string): Promise<{ id: string; username: string; email: string } | null> {
  try {
    const payload = verifyToken(token)
    if (!payload) return null

    // Query user from database to ensure they still exist
    const { data: user, error } = await supabase
      .from('admin_users')
      .select('id, username, email')
      .eq('id', payload.userId)
      .single()

    if (error || !user) {
      return null
    }

    return {
      id: user.id,
      username: user.username,
      email: user.email
    }
  } catch (error) {
    console.error('Get current user error:', error)
    return null
  }
}

// Generate password reset token
export function generatePasswordResetToken(email: string): string {
  const payload = {
    email,
    type: 'password_reset',
    exp: Math.floor(Date.now() / 1000) + (60 * 60) // 1 hour expiry
  }
  return jwt.sign(payload, process.env.NEXTAUTH_SECRET!)
}

// Verify password reset token
export function verifyPasswordResetToken(token: string): { email: string } | null {
  try {
    const payload = jwt.verify(token, process.env.NEXTAUTH_SECRET!) as any
    if (payload.type !== 'password_reset') return null
    return { email: payload.email }
  } catch (error) {
    return null
  }
}

// Find user by email
export async function findUserByEmail(email: string): Promise<{ id: string; username: string; email: string } | null> {
  try {
    const { data: user, error } = await supabase
      .from('admin_users')
      .select('id, username, email')
      .eq('email', email)
      .single()

    if (error || !user) {
      return null
    }

    return {
      id: user.id,
      username: user.username,
      email: user.email
    }
  } catch (error) {
    console.error('Find user by email error:', error)
    return null
  }
}

// Update user password
export async function updateUserPassword(email: string, newPassword: string): Promise<AuthResult> {
  try {
    const hashedPassword = await hashPassword(newPassword)

    const { error } = await supabase
      .from('admin_users')
      .update({
        password_hash: hashedPassword,
        updated_at: new Date().toISOString()
      })
      .eq('email', email)

    if (error) {
      return {
        success: false,
        error: 'Failed to update password'
      }
    }

    return {
      success: true
    }
  } catch (error) {
    console.error('Update password error:', error)
    return {
      success: false,
      error: 'Failed to update password'
    }
  }
}