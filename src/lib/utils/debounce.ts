/**
 * Debounce utility for preventing excessive API calls and improving performance
 */

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      if (timeout) {
        clearTimeout(timeout)
        timeout = null
      }
      func(...args)
    }

    if (timeout) {
      clearTimeout(timeout)
    }
    timeout = setTimeout(later, wait)
  }
}

/**
 * Throttle utility for limiting function execution frequency
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

/**
 * Cache utility for API responses
 */
class SimpleCache<T> {
  private cache = new Map<string, { data: T; timestamp: number }>()
  private ttl: number

  constructor(ttlMs: number = 5 * 60 * 1000) { // Default 5 minutes
    this.ttl = ttlMs
  }

  get(key: string): T | null {
    const item = this.cache.get(key)
    if (!item) return null

    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key)
      return null
    }

    return item.data
  }

  set(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    })
  }

  clear(): void {
    this.cache.clear()
  }

  delete(key: string): boolean {
    return this.cache.delete(key)
  }
}

// Export a default cache instance for API responses
export const apiCache = new SimpleCache(3 * 60 * 1000) // 3 minutes default

/**
 * Higher-order function to add caching to async functions
 */
export function withCache<T extends (...args: any[]) => Promise<any>>(
  func: T,
  generateKey: (...args: Parameters<T>) => string,
  cache?: SimpleCache<Awaited<ReturnType<T>>>
) {
  const cacheInstance = cache || new SimpleCache<Awaited<ReturnType<T>>>()

  return async (...args: Parameters<T>): Promise<Awaited<ReturnType<T>>> => {
    const key = generateKey(...args)
    const cached = cacheInstance.get(key)

    if (cached) {
      return cached
    }

    const result = await func(...args)
    cacheInstance.set(key, result)
    return result
  }
}