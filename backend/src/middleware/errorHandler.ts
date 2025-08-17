// src/middleware/errorHandler.ts
import { Request, Response, NextFunction } from 'express'

interface CustomError extends Error {
  statusCode?: number
  code?: string
}

export const errorHandler = (
  error: CustomError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error('Error occurred:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString(),
  })

  // Default error response
  let statusCode = error.statusCode || 500
  let message = 'Internal server error'
  let errorCode = 'INTERNAL_ERROR'

  // Handle specific error types
  if (error.name === 'ValidationError') {
    statusCode = 400
    message = 'Validation error'
    errorCode = 'VALIDATION_ERROR'
  } else if (error.name === 'UnauthorizedError') {
    statusCode = 401
    message = 'Unauthorized'
    errorCode = 'UNAUTHORIZED'
  } else if (error.name === 'CastError') {
    statusCode = 400
    message = 'Invalid data format'
    errorCode = 'INVALID_FORMAT'
  } else if (error.code === 'ECONNREFUSED') {
    statusCode = 500
    message = 'Database connection failed'
    errorCode = 'DB_CONNECTION_ERROR'
  } else if (error.code === '23505') {
    // PostgreSQL unique violation
    statusCode = 409
    message = 'Resource already exists'
    errorCode = 'DUPLICATE_RESOURCE'
  } else if (error.code === '23503') {
    // PostgreSQL foreign key violation
    statusCode = 400
    message = 'Invalid reference'
    errorCode = 'INVALID_REFERENCE'
  } else if (error.code === '23502') {
    // PostgreSQL not null violation
    statusCode = 400
    message = 'Required field missing'
    errorCode = 'MISSING_REQUIRED_FIELD'
  }

  // Production vs Development error response
  const errorResponse: any = {
    success: false,
    message,
    error: errorCode,
    timestamp: new Date().toISOString(),
    path: req.url,
    method: req.method,
  }

  // Include detailed error info in development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.details = {
      originalMessage: error.message,
      stack: error.stack,
      code: error.code,
    }
  }

  // Log error details for monitoring
  if (statusCode >= 500) {
    console.error('🚨 Server Error:', {
      error: error.message,
      stack: error.stack,
      statusCode,
      url: req.url,
      method: req.method,
      body: req.body,
      query: req.query,
      params: req.params,
    })
  } else if (statusCode >= 400) {
    console.warn('⚠️ Client Error:', {
      error: error.message,
      statusCode,
      url: req.url,
      method: req.method,
    })
  }

  res.status(statusCode).json(errorResponse)
}

// Async error wrapper
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}

// 404 Not Found handler
export const notFoundHandler = (req: Request, res: Response) => {
  const message = `Route $\{req.originalUrl} not found`

  console.warn('🔍 404 Not Found:', {
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  })

  res.status(404).json({
    success: false,
    message,
    error: 'NOT_FOUND',
    timestamp: new Date().toISOString(),
    path: req.url,
    method: req.method,
  })
}
