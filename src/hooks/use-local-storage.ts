'use client'

import { useState, useEffect, useCallback } from 'react'

/**
 * Custom hook for localStorage with TypeScript support and SSR safety
 * @param key - The localStorage key
 * @param defaultValue - Default value if key doesn't exist
 * @returns [value, setValue, removeValue]
 */
export function useLocalStorage<T>(
  key: string,
  defaultValue: T
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  // Initialize with default value for SSR compatibility
  const [storedValue, setStoredValue] = useState<T>(defaultValue)

  // Hydrate from localStorage on client-side mount
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const item = window.localStorage.getItem(key)
        if (item) {
          const parsed = JSON.parse(item)
          setStoredValue(parsed)
        }
      }
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error)
      setStoredValue(defaultValue)
    }
  }, [key, defaultValue])

  // Return a wrapped version of useState's setter function that persists to localStorage
  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      try {
        // Allow value to be a function so we have the same API as useState
        const valueToStore = value instanceof Function ? value(storedValue) : value
        setStoredValue(valueToStore)

        // Save to localStorage
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(key, JSON.stringify(valueToStore))
        }
      } catch (error) {
        console.warn(`Error setting localStorage key "${key}":`, error)
      }
    },
    [key, storedValue]
  )

  // Function to remove the item from localStorage
  const removeValue = useCallback(() => {
    try {
      setStoredValue(defaultValue)
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key)
      }
    } catch (error) {
      console.warn(`Error removing localStorage key "${key}":`, error)
    }
  }, [key, defaultValue])

  return [storedValue, setValue, removeValue]
}

/**
 * Hook for managing form drafts in localStorage
 * @param formKey - Unique identifier for the form
 * @param defaultValues - Default form values
 * @returns Form draft management functions
 */
export function useFormDraft<T extends Record<string, any>>(
  formKey: string,
  defaultValues: T
) {
  const key = `form-draft-${formKey}`
  const [draft, setDraft, removeDraft] = useLocalStorage<T>(key, defaultValues)

  const saveDraft = useCallback(
    (values: Partial<T>) => {
      setDraft(prev => ({ ...prev, ...values }))
    },
    [setDraft]
  )

  const clearDraft = useCallback(() => {
    removeDraft()
  }, [removeDraft])

  const hasDraft = useCallback(() => {
    return Object.keys(draft).some(key => {
      const value = draft[key]
      const defaultValue = defaultValues[key]
      return value !== defaultValue && value !== '' && value !== null && value !== undefined
    })
  }, [draft, defaultValues])

  return {
    draft,
    saveDraft,
    clearDraft,
    hasDraft: hasDraft()
  }
}

/**
 * Hook for managing user preferences
 * @param defaultPreferences - Default preference values
 * @returns User preferences management
 */
export function useUserPreferences<T extends Record<string, any>>(
  defaultPreferences: T
) {
  const [preferences, setPreferences, resetPreferences] = useLocalStorage<T>(
    'user-preferences',
    defaultPreferences
  )

  const updatePreference = useCallback(
    <K extends keyof T>(key: K, value: T[K]) => {
      setPreferences(prev => ({ ...prev, [key]: value }))
    },
    [setPreferences]
  )

  const updatePreferences = useCallback(
    (updates: Partial<T>) => {
      setPreferences(prev => ({ ...prev, ...updates }))
    },
    [setPreferences]
  )

  return {
    preferences,
    updatePreference,
    updatePreferences,
    resetPreferences
  }
}

/**
 * Hook for managing recent items (like recently viewed patients)
 * @param key - localStorage key for the recent items
 * @param maxItems - Maximum number of items to keep
 * @returns Recent items management
 */
export function useRecentItems<T extends { id: string }>(
  key: string,
  maxItems: number = 10
) {
  const [recentItems, setRecentItems] = useLocalStorage<T[]>(`recent-${key}`, [])

  const addRecentItem = useCallback(
    (item: T) => {
      setRecentItems(prev => {
        // Remove existing item if it exists
        const filtered = prev.filter(existing => existing.id !== item.id)

        // Add new item to the beginning
        const updated = [item, ...filtered]

        // Limit to maxItems
        return updated.slice(0, maxItems)
      })
    },
    [setRecentItems, maxItems]
  )

  const removeRecentItem = useCallback(
    (itemId: string) => {
      setRecentItems(prev => prev.filter(item => item.id !== itemId))
    },
    [setRecentItems]
  )

  const clearRecentItems = useCallback(() => {
    setRecentItems([])
  }, [setRecentItems])

  return {
    recentItems,
    addRecentItem,
    removeRecentItem,
    clearRecentItems
  }
}

/**
 * Hook for managing UI state like sidebar collapse, theme, etc.
 */
interface UIState {
  sidebarCollapsed: boolean
  theme: 'light' | 'dark' | 'system'
  itemsPerPage: number
  defaultView: 'list' | 'grid' | 'calendar'
}

const defaultUIState: UIState = {
  sidebarCollapsed: false,
  theme: 'system',
  itemsPerPage: 20,
  defaultView: 'list'
}

export function useUIState() {
  return useUserPreferences<UIState>(defaultUIState)
}

/**
 * Hook for managing search history
 * @param searchKey - Unique key for this search context
 * @param maxHistory - Maximum number of search terms to remember
 * @returns Search history management
 */
export function useSearchHistory(searchKey: string, maxHistory: number = 20) {
  const [searchHistory, setSearchHistory] = useLocalStorage<string[]>(
    `search-history-${searchKey}`,
    []
  )

  const addSearchTerm = useCallback(
    (term: string) => {
      const trimmedTerm = term.trim()
      if (!trimmedTerm) return

      setSearchHistory(prev => {
        // Remove existing term if it exists
        const filtered = prev.filter(existing => existing !== trimmedTerm)

        // Add new term to the beginning
        const updated = [trimmedTerm, ...filtered]

        // Limit to maxHistory
        return updated.slice(0, maxHistory)
      })
    },
    [setSearchHistory, maxHistory]
  )

  const removeSearchTerm = useCallback(
    (term: string) => {
      setSearchHistory(prev => prev.filter(existing => existing !== term))
    },
    [setSearchHistory]
  )

  const clearSearchHistory = useCallback(() => {
    setSearchHistory([])
  }, [setSearchHistory])

  return {
    searchHistory,
    addSearchTerm,
    removeSearchTerm,
    clearSearchHistory
  }
}