// src/middleware/auth.ts
import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string
    email: string
  }
}

export const authenticateToken = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1] // Bearer TOKEN

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Access token required',
        error: 'Unauthorized',
      })
      return
    }

    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key'

    jwt.verify(token, jwtSecret, (err: any, decoded: any) => {
      if (err) {
        console.error('Token verification error:', err.message)

        if (err.name === 'TokenExpiredError') {
          res.status(401).json({
            success: false,
            message: 'Token expired',
            error: 'TokenExpired',
          })
          return
        }

        if (err.name === 'JsonWebTokenError') {
          res.status(401).json({
            success: false,
            message: 'Invalid token',
            error: 'InvalidToken',
          })
          return
        }

        res.status(401).json({
          success: false,
          message: 'Token verification failed',
          error: 'Unauthorized',
        })
        return
      }

      // Add user info to request object
      req.user = {
        userId: decoded.userId,
        email: decoded.email,
      }

      next()
    })
  } catch (error) {
    console.error('Authentication middleware error:', error)
    res.status(500).json({
      success: false,
      message: 'Internal server error during authentication',
      error:
        process.env.NODE_ENV === 'development' && error instanceof Error
          ? error.message
          : undefined,
    })
  }
}

// Optional authentication middleware (doesn't require token)
export const optionalAuth = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]

    if (!token) {
      next()
      return
    }

    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key'

    jwt.verify(token, jwtSecret, (err: any, decoded: any) => {
      if (!err && decoded) {
        req.user = {
          userId: decoded.userId,
          email: decoded.email,
        }
      }
      next()
    })
  } catch (error) {
    console.error('Optional auth middleware error:', error)
    next()
  }
}
