'use client'

import { useState, useEffect, useCallback } from 'react'

// QR Token interfaces
export interface QRToken {
  id: string
  token: string
  expires_at: string
  used: boolean
  reusable: boolean
  qr_type: string
  usage_count: number
  created_at: string
}

export interface QRTokenGeneration {
  expiration_hours: number
  note?: string
  qr_type?: string
  reusable?: boolean
}

export interface QRTokenResponse {
  token: string
  expires_at: string
  registration_url: string
  expiration_hours: number
  note?: string
}

export interface QRTokenListResponse {
  tokens: QRToken[]
  pagination?: {
    limit: number
    offset: number
    total: number
    hasMore: boolean
  }
}

export function useQRTokens() {
  const [tokens, setTokens] = useState<QRToken[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Generate new QR token
  const generateToken = useCallback(async (params: QRTokenGeneration): Promise<QRTokenResponse> => {
    setIsLoading(true)
    setError(null)

    try {
      const queryParams = new URLSearchParams({
        expiration_hours: params.expiration_hours.toString(),
        ...(params.note && { note: params.note }),
        ...(params.qr_type && { qr_type: params.qr_type }),
        ...(params.reusable !== undefined && { reusable: params.reusable.toString() })
      })

      const response = await fetch(`/api/qr-registration?${queryParams}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate QR token')
      }

      const data = await response.json()
      return data.data

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate token'
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Validate QR token
  const validateToken = useCallback(async (token: string): Promise<boolean> => {
    try {
      // For validation, we'll make a simple check to the database
      // This is used by the patient registration page to check if token is valid
      const response = await fetch('/api/qr-tokens/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      })

      return response.ok
    } catch (err) {
      console.error('Token validation error:', err)
      return false
    }
  }, [])

  // Register patient with QR token
  const registerPatient = useCallback(async (token: string, patientData: any) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/qr-registration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          token,
          patient_data: patientData
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to register patient')
      }

      const data = await response.json()
      return data.data

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Registration failed'
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Fetch all QR tokens (for admin management)
  const fetchTokens = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/qr-tokens', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch tokens')
      }

      const data = await response.json()
      setTokens(data.data.tokens || [])
      return data.data

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch tokens'
      setError(errorMessage)
      return { tokens: [] }
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Clean up expired tokens
  const cleanupExpiredTokens = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/qr-registration', {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to cleanup tokens')
      }

      const data = await response.json()

      // Refresh tokens after cleanup
      await fetchTokens()

      return data.data

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to cleanup tokens'
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [fetchTokens])

  // Get token statistics
  const getTokenStats = useCallback(() => {
    const now = new Date()
    const stats = {
      total: tokens.length,
      active: 0,
      expired: 0,
      used: 0
    }

    tokens.forEach(token => {
      if (token.used) {
        stats.used++
      } else if (token.qr_type === 'generic') {
        // Generic tokens never expire
        stats.active++
      } else if (new Date(token.expires_at) < now) {
        stats.expired++
      } else {
        stats.active++
      }
    })

    return stats
  }, [tokens])

  // Fetch individual QR token details
  const fetchToken = useCallback(async (tokenId: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/qr-tokens/${tokenId}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch QR token')
      }

      const data = await response.json()
      return data.data

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch token'
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Delete individual QR token
  const deleteToken = useCallback(async (tokenId: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/qr-tokens/${tokenId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete QR token')
      }

      const data = await response.json()

      // Refresh tokens after deletion
      await fetchTokens()

      return data.data

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete token'
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [fetchTokens])

  return {
    tokens,
    isLoading,
    error,
    generateToken,
    validateToken,
    registerPatient,
    fetchTokens,
    fetchToken,
    deleteToken,
    cleanupExpiredTokens,
    getTokenStats,
    setError
  }
}

// Token status helper
export const getTokenStatus = (token: QRToken): 'active' | 'expired' | 'used' => {
  if (token.used) return 'used'
  // Generic tokens never expire
  if (token.qr_type === 'generic') return 'active'
  if (new Date(token.expires_at) < new Date()) return 'expired'
  return 'active'
}

// Token expiration helper
export const getTimeUntilExpiration = (expiresAt: string): string => {
  const now = new Date()
  const expiry = new Date(expiresAt)
  const diffMs = expiry.getTime() - now.getTime()

  if (diffMs <= 0) return 'Expired'

  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))

  if (diffHours > 24) {
    const days = Math.floor(diffHours / 24)
    return `${days}d ${diffHours % 24}h`
  } else if (diffHours > 0) {
    return `${diffHours}h ${diffMinutes}m`
  } else {
    return `${diffMinutes}m`
  }
}