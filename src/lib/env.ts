import { z } from 'zod'

// Environment variables validation schema
const envSchema = z.object({
  // Database
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('Invalid Supabase URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'Supabase anon key is required'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'Supabase service role key is required'),

  // Authentication
  JWT_SECRET: z.string().min(32, 'JWT secret must be at least 32 characters'),
  NEXTAUTH_SECRET: z.string().min(32, 'NextAuth secret must be at least 32 characters').optional(),
  NEXTAUTH_URL: z.string().url('Invalid NextAuth URL').optional(),

  // Email (if using email service)
  RESEND_API_KEY: z.string().optional(),
  FROM_EMAIL: z.string().email('Invalid from email').optional(),

  // Application
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  NEXT_PUBLIC_APP_URL: z.string().url('Invalid app URL').optional(),

  // Security
  BCRYPT_ROUNDS: z.coerce.number().min(10).max(15).default(12),

  // Feature flags
  NEXT_PUBLIC_ENABLE_QR_REGISTRATION: z.coerce.boolean().default(true),
  NEXT_PUBLIC_ENABLE_ANALYTICS: z.coerce.boolean().default(true),
})

// Validate and export environment variables
function validateEnv() {
  try {
    return envSchema.parse(process.env)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.issues.map(issue =>
        `${issue.path.join('.')}: ${issue.message}`
      )
      throw new Error(
        `Environment validation failed:\n${missingVars.join('\n')}`
      )
    }
    throw error
  }
}

// Export validated environment variables
export const env = validateEnv()

// Utility functions for environment checks
export const isDevelopment = env.NODE_ENV === 'development'
export const isProduction = env.NODE_ENV === 'production'
export const isTest = env.NODE_ENV === 'test'

// Security helpers
export function maskSecret(secret: string, visibleChars = 4): string {
  if (secret.length <= visibleChars * 2) {
    return '*'.repeat(secret.length)
  }
  return `${secret.slice(0, visibleChars)}${'*'.repeat(secret.length - visibleChars * 2)}${secret.slice(-visibleChars)}`
}

// Environment info for debugging (safe for logging)
export function getEnvInfo() {
  return {
    nodeEnv: env.NODE_ENV,
    hasSupabaseUrl: !!env.NEXT_PUBLIC_SUPABASE_URL,
    hasSupabaseKey: !!env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    hasServiceRoleKey: !!env.SUPABASE_SERVICE_ROLE_KEY,
    hasJwtSecret: !!env.JWT_SECRET,
    hasResendKey: !!env.RESEND_API_KEY,
    enableQrRegistration: env.NEXT_PUBLIC_ENABLE_QR_REGISTRATION,
    enableAnalytics: env.NEXT_PUBLIC_ENABLE_ANALYTICS,
    bcryptRounds: env.BCRYPT_ROUNDS,
  }
}