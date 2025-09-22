import { NextRequest, NextResponse } from 'next/server'
import { ApiError } from '@/types/api'

// Enhanced error class for API responses
export class ApiErrorClass extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

// Error handling middleware
export function withErrorHandling(
  handler: (request: NextRequest, ...args: any[]) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: any[]): Promise<NextResponse> => {
    try {
      return await handler(request, ...args)
    } catch (error) {
      console.error('API Error:', error)

      if (error instanceof ApiErrorClass) {
        return NextResponse.json(
          {
            error: error.message,
            details: error.details,
            statusCode: error.statusCode
          } as ApiError,
          { status: error.statusCode }
        )
      }

      if (error instanceof Error) {
        return NextResponse.json(
          {
            error: 'Internal server error',
            message: error.message
          } as ApiError,
          { status: 500 }
        )
      }

      return NextResponse.json(
        {
          error: 'Unknown error occurred',
          message: 'An unexpected error occurred'
        } as ApiError,
        { status: 500 }
      )
    }
  }
}

// Success response helper
export function createSuccessResponse<T>(data: T, message?: string, status = 200) {
  return NextResponse.json(
    {
      success: true,
      data,
      message
    },
    { status }
  )
}

// Error response helper
export function createErrorResponse(
  error: string,
  statusCode = 500,
  details?: any
) {
  return NextResponse.json(
    {
      error,
      details,
      statusCode
    } as ApiError,
    { status: statusCode }
  )
}