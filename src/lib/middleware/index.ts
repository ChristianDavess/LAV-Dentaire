import { NextRequest, NextResponse } from 'next/server'
import { withAuth, withOptionalAuth } from './auth'
import { withValidation, withQueryValidation } from './validation'
import { withErrorHandling, ApiErrorClass } from './error-handler'
import { ZodSchema } from 'zod'

// Middleware composer for easy API route setup
export class ApiHandler {
  private middlewares: ((req: NextRequest, ...args: any[]) => Promise<NextResponse>)[] = []

  // Add authentication requirement
  requireAuth() {
    this.middlewares.push((req: NextRequest, handler: any, ...args: any[]) => {
      return withAuth(req, (req: NextRequest, user: any) => {
        return handler(req, user, ...args)
      })
    })
    return this
  }

  // Add optional authentication
  optionalAuth() {
    this.middlewares.push(withOptionalAuth)
    return this
  }

  // Add body validation
  validateBody<T>(schema: ZodSchema<T>) {
    this.middlewares.push((req: NextRequest, handler: any, ...args: any[]) =>
      withValidation(req, schema, (r: NextRequest, validatedBody: T) => {
        return handler(r, ...args, validatedBody)
      })
    )
    return this
  }

  // Add query validation
  validateQuery<T>(schema: ZodSchema<T>) {
    this.middlewares.push((req: NextRequest, handler: any, ...args: any[]) =>
      withQueryValidation(req, schema, (r: NextRequest, validatedQuery: T) =>
        handler(r, ...args, validatedQuery)
      )
    )
    return this
  }

  // Execute with error handling
  handle(handler: (request: NextRequest, ...args: any[]) => Promise<NextResponse>) {
    return withErrorHandling(async (request: NextRequest) => {
      let finalHandler = handler


      // Apply middleware in reverse order (last added, first applied)
      for (let i = this.middlewares.length - 1; i >= 0; i--) {
        const middleware = this.middlewares[i]
        const nextHandler = finalHandler
        finalHandler = (req: NextRequest, ...middlewareArgs: any[]) =>
          middleware(req, nextHandler, ...middlewareArgs)
      }

      return await finalHandler(request)
    })
  }
}

// Convenience function to create an API handler
export function createApiHandler() {
  return new ApiHandler()
}

// Export middleware components
export { withAuth, withOptionalAuth } from './auth'
export { withValidation, withQueryValidation } from './validation'
export { withErrorHandling, ApiErrorClass, createSuccessResponse, createErrorResponse } from './error-handler'

// Common HTTP method handlers with standard patterns
export function createRouteHandlers<T = any>(handlers: {
  GET?: (request: NextRequest, ...args: any[]) => Promise<NextResponse>
  POST?: (request: NextRequest, ...args: any[]) => Promise<NextResponse>
  PUT?: (request: NextRequest, ...args: any[]) => Promise<NextResponse>
  DELETE?: (request: NextRequest, ...args: any[]) => Promise<NextResponse>
  PATCH?: (request: NextRequest, ...args: any[]) => Promise<NextResponse>
}) {
  const wrappedHandlers: any = {}

  Object.entries(handlers).forEach(([method, handler]) => {
    if (handler) {
      wrappedHandlers[method] = withErrorHandling(handler)
    }
  })

  return wrappedHandlers
}