import { toast } from '@/hooks/use-toast'

export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public isOperational: boolean = true
  ) {
    super(message)
    this.name = 'AppError'
    Object.setPrototypeOf(this, AppError.prototype)
  }
}

export const handleError = (error: unknown, showToast = true) => {
  console.error('Application Error:', error)

  let message = 'An unexpected error occurred'
  let title = 'Error'

  if (error instanceof AppError) {
    message = error.message
    title = error.statusCode >= 500 ? 'Server Error' : 'Error'
  } else if (error instanceof Error) {
    message = error.message
  } else if (typeof error === 'string') {
    message = error
  }

  if (showToast) {
    toast({
      title,
      description: message,
      variant: 'destructive',
    })
  }

  return { message, title }
}

export const handleApiError = async (response: Response, showToast = true) => {
  try {
    const errorData = await response.json()
    const error = new AppError(
      errorData.message || `Request failed with status ${response.status}`,
      response.status
    )
    return handleError(error, showToast)
  } catch {
    const error = new AppError(
      `Request failed with status ${response.status}`,
      response.status
    )
    return handleError(error, showToast)
  }
}

export const showSuccessToast = (message: string, title = 'Success') => {
  toast({
    title,
    description: message,
  })
}

export const showInfoToast = (message: string, title = 'Info') => {
  toast({
    title,
    description: message,
  })
}