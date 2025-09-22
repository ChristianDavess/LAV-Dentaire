import { useState, useCallback } from 'react'
import { ApiResponse, ApiError } from '@/types/api'
import { useToast } from '@/hooks/use-toast'

interface UseApiOptions {
  showSuccessToast?: boolean
  showErrorToast?: boolean
  successMessage?: string
}

interface UseApiState<T> {
  data: T | null
  loading: boolean
  error: ApiError | null
}

// Generic API hook for consistent API calling patterns
export function useApi<T = any>(
  apiFunction: (...args: any[]) => Promise<Response>,
  options: UseApiOptions = {}
) {
  const { showSuccessToast = false, showErrorToast = true, successMessage } = options
  const { toast } = useToast()

  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null
  })

  const execute = useCallback(async (...args: any[]) => {
    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      const response = await apiFunction(...args)

      if (!response.ok) {
        const errorData: ApiError = await response.json()
        setState(prev => ({
          ...prev,
          loading: false,
          error: errorData
        }))

        if (showErrorToast) {
          toast({
            title: 'Error',
            description: errorData.error || 'An error occurred',
            variant: 'destructive'
          })
        }

        return { success: false, error: errorData }
      }

      const result: ApiResponse<T> = await response.json()
      setState(prev => ({
        ...prev,
        loading: false,
        data: result.data || null
      }))

      if (showSuccessToast && (successMessage || result.message)) {
        toast({
          title: 'Success',
          description: successMessage || result.message || 'Operation completed successfully'
        })
      }

      return { success: true, data: result.data }
    } catch (error) {
      const apiError: ApiError = {
        error: 'Network error',
        message: 'Failed to connect to server'
      }

      setState(prev => ({
        ...prev,
        loading: false,
        error: apiError
      }))

      if (showErrorToast) {
        toast({
          title: 'Connection Error',
          description: 'Failed to connect to server',
          variant: 'destructive'
        })
      }

      return { success: false, error: apiError }
    }
  }, [apiFunction, showSuccessToast, showErrorToast, successMessage, toast])

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null
    })
  }, [])

  return {
    ...state,
    execute,
    reset
  }
}