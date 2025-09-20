import { useState, useEffect, useCallback, useMemo } from 'react'
import { format } from 'date-fns'

interface AvailabilityResponse {
  date: string
  duration: number
  availableSlots: string[]
  businessHours: {
    start: string
    end: string
    slotDuration: number
    breakDuration: number
  }
  totalSlots: number
}

interface UseAppointmentAvailabilityOptions {
  date?: string
  duration?: number
  autoRefresh?: boolean
  refreshInterval?: number
}

interface UseAppointmentAvailabilityReturn {
  availability: AvailabilityResponse | null
  availableSlots: string[]
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  isSlotAvailable: (time: string) => boolean
  getSlotsByPeriod: () => {
    morning: string[]
    afternoon: string[]
    evening: string[]
  }
}

// Cache for availability data
const availabilityCache = new Map<string, { data: AvailabilityResponse; timestamp: number }>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

export function useAppointmentAvailability(
  options: UseAppointmentAvailabilityOptions = {}
): UseAppointmentAvailabilityReturn {
  const [availability, setAvailability] = useState<AvailabilityResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    date,
    duration = 60,
    autoRefresh = false,
    refreshInterval = 300000 // 5 minutes
  } = options

  const fetchAvailability = useCallback(async () => {
    if (!date) {
      setAvailability(null)
      return
    }

    const cacheKey = `${date}-${duration}`
    const cached = availabilityCache.get(cacheKey)

    // Return cached data if still valid
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      setAvailability(cached.data)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        date,
        duration: duration.toString()
      })

      const response = await fetch(`/api/appointments/availability?${params.toString()}`)

      if (!response.ok) {
        throw new Error('Failed to fetch availability')
      }

      const data = await response.json()

      // Cache the result
      availabilityCache.set(cacheKey, {
        data,
        timestamp: Date.now()
      })

      setAvailability(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load availability')
    } finally {
      setLoading(false)
    }
  }, [date, duration])

  // Memoized available slots
  const availableSlots = useMemo(() => {
    return availability?.availableSlots || []
  }, [availability])

  // Check if a specific time slot is available
  const isSlotAvailable = useCallback((time: string): boolean => {
    return availableSlots.includes(time)
  }, [availableSlots])

  // Group slots by time period
  const getSlotsByPeriod = useCallback(() => {
    const morning: string[] = []
    const afternoon: string[] = []
    const evening: string[] = []

    availableSlots.forEach(slot => {
      const hour = parseInt(slot.split(':')[0])

      if (hour < 12) {
        morning.push(slot)
      } else if (hour < 17) {
        afternoon.push(slot)
      } else {
        evening.push(slot)
      }
    })

    return { morning, afternoon, evening }
  }, [availableSlots])

  // Fetch availability when date or duration changes
  useEffect(() => {
    fetchAvailability()
  }, [fetchAvailability])

  // Auto refresh
  useEffect(() => {
    if (!autoRefresh || !date) return

    const interval = setInterval(fetchAvailability, refreshInterval)
    return () => clearInterval(interval)
  }, [autoRefresh, refreshInterval, fetchAvailability, date])

  return {
    availability,
    availableSlots,
    loading,
    error,
    refresh: fetchAvailability,
    isSlotAvailable,
    getSlotsByPeriod
  }
}

// Helper hook for getting availability for multiple dates
export function useMultiDateAvailability(dates: string[], duration: number = 60) {
  const [availabilityMap, setAvailabilityMap] = useState<Record<string, AvailabilityResponse>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchMultipleAvailability = useCallback(async () => {
    if (dates.length === 0) return

    setLoading(true)
    setError(null)

    try {
      const promises = dates.map(async (date) => {
        const cacheKey = `${date}-${duration}`
        const cached = availabilityCache.get(cacheKey)

        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
          return { date, data: cached.data }
        }

        const params = new URLSearchParams({
          date,
          duration: duration.toString()
        })

        const response = await fetch(`/api/appointments/availability?${params.toString()}`)

        if (!response.ok) {
          throw new Error(`Failed to fetch availability for ${date}`)
        }

        const data = await response.json()

        // Cache the result
        availabilityCache.set(cacheKey, {
          data,
          timestamp: Date.now()
        })

        return { date, data }
      })

      const results = await Promise.all(promises)
      const newAvailabilityMap: Record<string, AvailabilityResponse> = {}

      results.forEach(({ date, data }) => {
        newAvailabilityMap[date] = data
      })

      setAvailabilityMap(newAvailabilityMap)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load availability')
    } finally {
      setLoading(false)
    }
  }, [dates, duration])

  useEffect(() => {
    fetchMultipleAvailability()
  }, [fetchMultipleAvailability])

  return {
    availabilityMap,
    loading,
    error,
    refresh: fetchMultipleAvailability
  }
}

// Helper hook for today's availability
export function useTodayAvailability(duration: number = 60) {
  const today = format(new Date(), 'yyyy-MM-dd')

  return useAppointmentAvailability({
    date: today,
    duration,
    autoRefresh: true,
    refreshInterval: 60000 // 1 minute for today's availability
  })
}

// Clear availability cache (useful for manual refresh)
export function clearAvailabilityCache() {
  availabilityCache.clear()
}