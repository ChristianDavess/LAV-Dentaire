'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

/**
 * Custom hook for debouncing a value
 * @param value - The value to debounce
 * @param delay - Delay in milliseconds (default: 300)
 * @returns Debounced value
 */
export function useDebounced<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

/**
 * Custom hook for debouncing a callback function
 * @param callback - The function to debounce
 * @param delay - Delay in milliseconds (default: 300)
 * @returns Debounced callback function
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 300
): T {
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      timeoutRef.current = setTimeout(() => {
        callback(...args)
      }, delay)
    },
    [callback, delay]
  ) as T

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return debouncedCallback
}

/**
 * Custom hook for debounced search functionality
 * @param onSearch - Search callback function
 * @param delay - Delay in milliseconds (default: 300)
 * @returns Search state and functions
 */
export function useDebouncedSearch<T>(
  onSearch: (query: string) => Promise<T[]> | T[],
  delay: number = 300
) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<T[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const debouncedQuery = useDebounced(query, delay)

  // Perform search when debounced query changes
  useEffect(() => {
    const performSearch = async () => {
      if (!debouncedQuery.trim()) {
        setResults([])
        setLoading(false)
        setError(null)
        return
      }

      setLoading(true)
      setError(null)

      try {
        const searchResults = await onSearch(debouncedQuery)
        setResults(searchResults)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Search failed')
        setResults([])
      } finally {
        setLoading(false)
      }
    }

    performSearch()
  }, [debouncedQuery, onSearch])

  const clearSearch = useCallback(() => {
    setQuery('')
    setResults([])
    setError(null)
  }, [])

  return {
    query,
    setQuery,
    results,
    loading,
    error,
    clearSearch
  }
}

/**
 * Custom hook for debounced form auto-save
 * @param onSave - Save callback function
 * @param delay - Delay in milliseconds (default: 1000)
 * @returns Auto-save functions
 */
export function useDebouncedAutoSave<T>(
  onSave: (data: T) => Promise<void> | void,
  delay: number = 1000
) {
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)

  const debouncedSave = useDebouncedCallback(async (data: T) => {
    setIsSaving(true)
    setSaveError(null)

    try {
      await onSave(data)
      setLastSaved(new Date())
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Auto-save failed')
    } finally {
      setIsSaving(false)
    }
  }, delay)

  const triggerSave = useCallback((data: T) => {
    debouncedSave(data)
  }, [debouncedSave])

  return {
    triggerSave,
    isSaving,
    lastSaved,
    saveError
  }
}

/**
 * Custom hook for debounced API calls with loading state
 * @param apiCall - API function to call
 * @param delay - Delay in milliseconds (default: 300)
 * @returns API call state and function
 */
export function useDebouncedApi<TParams, TResult>(
  apiCall: (params: TParams) => Promise<TResult>,
  delay: number = 300
) {
  const [data, setData] = useState<TResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const debouncedApiCall = useDebouncedCallback(async (params: TParams) => {
    setLoading(true)
    setError(null)

    try {
      const result = await apiCall(params)
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'API call failed')
      setData(null)
    } finally {
      setLoading(false)
    }
  }, delay)

  const reset = useCallback(() => {
    setData(null)
    setError(null)
    setLoading(false)
  }, [])

  return {
    data,
    loading,
    error,
    call: debouncedApiCall,
    reset
  }
}

/**
 * Custom hook for debounced input validation
 * @param validator - Validation function
 * @param delay - Delay in milliseconds (default: 500)
 * @returns Validation state and function
 */
export function useDebouncedValidation<T>(
  validator: (value: T) => boolean | string | Promise<boolean | string>,
  delay: number = 500
) {
  const [isValid, setIsValid] = useState<boolean | null>(null)
  const [validationMessage, setValidationMessage] = useState<string | null>(null)
  const [isValidating, setIsValidating] = useState(false)

  const debouncedValidate = useDebouncedCallback(async (value: T) => {
    setIsValidating(true)
    setValidationMessage(null)

    try {
      const result = await validator(value)

      if (typeof result === 'boolean') {
        setIsValid(result)
        setValidationMessage(result ? null : 'Invalid value')
      } else {
        setIsValid(false)
        setValidationMessage(result)
      }
    } catch (err) {
      setIsValid(false)
      setValidationMessage(err instanceof Error ? err.message : 'Validation error')
    } finally {
      setIsValidating(false)
    }
  }, delay)

  const validate = useCallback((value: T) => {
    if (!value || (typeof value === 'string' && !value.trim())) {
      setIsValid(null)
      setValidationMessage(null)
      setIsValidating(false)
      return
    }

    debouncedValidate(value)
  }, [debouncedValidate])

  const reset = useCallback(() => {
    setIsValid(null)
    setValidationMessage(null)
    setIsValidating(false)
  }, [])

  return {
    isValid,
    validationMessage,
    isValidating,
    validate,
    reset
  }
}