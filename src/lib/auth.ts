import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { createClient } from './supabase/server'
import type { AdminUser } from '@/types/database'

export interface AuthResult {
  success: boolean
  user?: AdminUser
  error?: string
}

export interface JWTPayload {
  userId: string
  username: string
  email: string
}

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
    expiresIn: '7d', // Token expires in 7 days
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

// Authenticate user
export async function authenticateUser(username: string, password: string): Promise<AuthResult> {
  try {
    const supabase = await createClient()

    // Get user by username
    const { data: user, error } = await supabase
      .from('admin_users')
      .select('*')
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
      user
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
export async function getCurrentUser(token: string): Promise<AdminUser | null> {
  try {
    const payload = verifyToken(token)
    if (!payload) return null

    const supabase = await createClient()
    const { data: user, error } = await supabase
      .from('admin_users')
      .select('*')
      .eq('id', payload.userId)
      .single()

    if (error || !user) return null

    return user
  } catch (error) {
    console.error('Get current user error:', error)
    return null
  }
}

// Create admin user (for initial setup)
export async function createAdminUser(username: string, email: string, password: string): Promise<AuthResult> {
  try {
    const supabase = await createClient()

    // Check if username already exists
    const { data: existingUser } = await supabase
      .from('admin_users')
      .select('id')
      .eq('username', username)
      .single()

    if (existingUser) {
      return {
        success: false,
        error: 'Username already exists'
      }
    }

    // Hash password
    const passwordHash = await hashPassword(password)

    // Create user
    const { data: newUser, error } = await supabase
      .from('admin_users')
      .insert({
        username,
        email,
        password_hash: passwordHash
      })
      .select()
      .single()

    if (error || !newUser) {
      return {
        success: false,
        error: 'Failed to create user'
      }
    }

    return {
      success: true,
      user: newUser
    }
  } catch (error) {
    console.error('Create admin user error:', error)
    return {
      success: false,
      error: 'Failed to create user'
    }
  }
}