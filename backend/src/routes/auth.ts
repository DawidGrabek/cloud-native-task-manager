
import { Router, Request, Response } from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import Joi from 'joi'
import { pool } from '../database/connection'
import { authenticateToken } from '../middleware/auth'
import logger from '../utils/logger'

const router = Router()

// Validation schemas
const registerSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).max(100).required(),
})

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
})

// Register new user
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  const { error } = registerSchema.validate(req.body)
  if (error) {
    logger.warn('Registration validation failed', {
      validationError: error.details?.[0]?.message,
    })
    res.status(400).json({
      success: false,
      message: 'Validation error',
      error: error.details?.[0]?.message,
    })
    return
  }

  const { name, email, password } = req.body

  logger.info('User registration attempt', { email })

  try {
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase()]
    )

    if (existingUser.rows.length > 0) {
      logger.warn('Registration rejected: email already in use', { email })
      res.status(409).json({
        success: false,
        message: 'User with this email already exists',
      })
      return
    }

    const saltRounds = 10
    const passwordHash = await bcrypt.hash(password, saltRounds)

    const newUser = await pool.query(
      'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email, created_at',
      [name.trim(), email.toLowerCase(), passwordHash]
    )

    const user = newUser.rows[0]

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'your-secret-key',
      {
        expiresIn: process.env.JWT_EXPIRES_IN || '24h',
        algorithm: 'HS256',
      } as jwt.SignOptions
    )

    logger.info('User registered successfully', { userId: user.id, email: user.email })

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          createdAt: user.created_at,
        },
        token,
      },
    })
  } catch (error) {
    logger.error('Registration failed', {
      email,
      error: error instanceof Error ? error.message : String(error),
    })
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error:
        process.env.NODE_ENV === 'development' && error instanceof Error
          ? error.message
          : undefined,
    })
  }
})

// Login user
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const { error } = loginSchema.validate(req.body)
  if (error) {
    logger.warn('Login validation failed', {
      validationError: error.details?.[0]?.message,
    })
    res.status(400).json({
      success: false,
      message: 'Validation error',
      error: error.details?.[0]?.message,
    })
    return
  }

  const { email, password } = req.body

  logger.info('Login attempt', { email })

  try {
    const userResult = await pool.query(
      'SELECT id, name, email, password_hash, created_at FROM users WHERE email = $1',
      [email.toLowerCase()]
    )

    if (userResult.rows.length === 0) {
      logger.warn('Login failed: user not found', { email })
      res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      })
      return
    }

    const user = userResult.rows[0]

    const isValidPassword = await bcrypt.compare(password, user.password_hash)
    if (!isValidPassword) {
      logger.warn('Login failed: incorrect password', { email, userId: user.id })
      res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      })
      return
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'your-secret-key',
      {
        expiresIn: process.env.JWT_EXPIRES_IN || '24h',
        algorithm: 'HS256',
      } as jwt.SignOptions
    )

    logger.info('Login successful', { userId: user.id, email: user.email })

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          createdAt: user.created_at,
        },
        token,
      },
    })
  } catch (error) {
    logger.error('Login error', {
      email,
      error: error instanceof Error ? error.message : String(error),
    })
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error:
        process.env.NODE_ENV === 'development' && error instanceof Error
          ? error.message
          : undefined,
    })
  }
})

// Get current user profile
router.get(
  '/profile',
  authenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    const userId = (req as any).user.userId

    logger.info('Profile requested', { userId })

    try {
      const userResult = await pool.query(
        'SELECT id, name, email, created_at FROM users WHERE id = $1',
        [userId]
      )

      if (userResult.rows.length === 0) {
        logger.warn('Profile not found', { userId })
        res.status(404).json({
          success: false,
          message: 'User not found',
        })
        return
      }

      const user = userResult.rows[0]

      logger.info('Profile retrieved', { userId })

      res.json({
        success: true,
        data: {
          id: user.id,
          name: user.name,
          email: user.email,
          createdAt: user.created_at,
        },
      })
    } catch (error) {
      logger.error('Profile retrieval failed', {
        userId,
        error: error instanceof Error ? error.message : String(error),
      })
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error:
          process.env.NODE_ENV === 'development' && error instanceof Error
            ? error.message
            : undefined,
      })
    }
  }
)

export { router as authRoutes }
