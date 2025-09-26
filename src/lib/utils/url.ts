/**
 * Utility functions for URL generation and domain detection
 */

/**
 * Gets the correct base URL for the application
 * Handles both client-side and server-side environments
 * Automatically detects production vs development
 */
export function getBaseUrl(): string {
  // 1. Use explicitly set environment variable if available
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL
  }

  // 2. Client-side: Check browser location for intelligent detection
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname

    // Production: lavdentaire.com or any subdomain
    if (hostname.includes('lavdentaire.com')) {
      return `https://${hostname}`
    }

    // Localhost variations
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return `${window.location.protocol}//${window.location.host}`
    }

    // Other domains - assume HTTPS in production
    return `https://${hostname}`
  }

  // 3. Server-side: Environment-based detection
  if (process.env.NODE_ENV === 'production') {
    return 'https://lavdentaire.com'
  }

  // 4. Development fallback
  return 'http://localhost:3000'
}

/**
 * Generates a complete URL for a given path
 * @param path - The path to append to the base URL (should start with /)
 */
export function getFullUrl(path: string): string {
  const baseUrl = getBaseUrl()
  // Ensure path starts with /
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  return `${baseUrl}${cleanPath}`
}

/**
 * Gets the correct base URL for QR code generation
 * This is an alias for getBaseUrl for semantic clarity
 */
export function getQRBaseUrl(): string {
  return getBaseUrl()
}