import { NextRequest, NextResponse } from 'next/server'
import { ZodSchema, ZodError } from 'zod'
import { ApiError } from '@/types/api'

// Validation middleware for request body
export async function withValidation<T>(
  request: NextRequest,
  schema: ZodSchema<T>,
  handler: (request: NextRequest, validatedData: T) => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    const body = await request.json()
    const validatedData = schema.parse(body)

    // Create a new request with the validated data attached to avoid consuming the body multiple times
    const newRequest = new NextRequest(request.url, {
      method: request.method,
      headers: request.headers,
      body: JSON.stringify(validatedData)
    })

    return await handler(newRequest, validatedData)
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          message: 'Invalid request data',
          details: error.issues
        } as ApiError,
        { status: 400 }
      )
    }

    console.error('Validation middleware error:', error)
    return NextResponse.json(
      { error: 'Failed to process request' } as ApiError,
      { status: 400 }
    )
  }
}

// Query parameter validation middleware
export function withQueryValidation<T>(
  request: NextRequest,
  schema: ZodSchema<T>,
  handler: (request: NextRequest, validatedQuery: T) => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    const url = new URL(request.url)
    const queryParams = Object.fromEntries(url.searchParams.entries())
    const validatedQuery = schema.parse(queryParams)

    return handler(request, validatedQuery)
  } catch (error) {
    if (error instanceof ZodError) {
      return Promise.resolve(NextResponse.json(
        {
          error: 'Invalid query parameters',
          message: 'Query validation failed',
          details: error.issues
        } as ApiError,
        { status: 400 }
      ))
    }

    console.error('Query validation middleware error:', error)
    return Promise.resolve(NextResponse.json(
      { error: 'Failed to process query parameters' } as ApiError,
      { status: 400 }
    ))
  }
}