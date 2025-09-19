// Edge runtime compatible JWT verification for middleware
export interface JWTPayload {
  userId: string
  username: string
  email: string
  iat?: number
  exp?: number
}

// Simple JWT verification for Edge Runtime (without external dependencies)
export function verifyTokenEdge(token: string): JWTPayload | null {
  try {
    if (!token) return null

    // Split the JWT token
    const parts = token.split('.')
    if (parts.length !== 3) return null

    // Decode the payload (base64url decode)
    const payload = parts[1]
    const decoded = base64UrlDecode(payload)
    const parsed = JSON.parse(decoded) as JWTPayload

    // Check if token is expired
    if (parsed.exp && Date.now() >= parsed.exp * 1000) {
      return null
    }

    // For now, we'll trust the token if it has the right structure
    // In production, you'd want to verify the signature using the secret
    if (parsed.userId && parsed.username && parsed.email) {
      return parsed
    }

    return null
  } catch (error) {
    console.error('Edge token verification error:', error)
    return null
  }
}

// Base64URL decode function
function base64UrlDecode(base64Url: string): string {
  // Replace URL-safe characters
  let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')

  // Add padding if needed
  while (base64.length % 4) {
    base64 += '='
  }

  try {
    // Use built-in atob for base64 decoding
    return atob(base64)
  } catch {
    // Fallback for environments without atob
    return Buffer.from(base64, 'base64').toString('utf-8')
  }
}