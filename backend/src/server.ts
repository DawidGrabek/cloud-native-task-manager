import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import compression from 'compression'
import rateLimit from 'express-rate-limit'
import dotenv from 'dotenv'

import { authRoutes } from './routes/auth'
import { taskRoutes } from './routes/tasks'  
import { healthRoutes } from './routes/health'
import { errorHandler } from './middleware/errorHandler'
import { authenticateToken } from './middleware/auth'
import { connectDatabase, initializeDatabase, pool } from './database/connection' // ← DODAJ pool
import { collectHttpMetrics, register, updateDbMetrics, updateTaskMetrics } from './middleware/metrics'

// Load environment variables
dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

// Security middleware
app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
  })
)

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
})
app.use(limiter)

// Metrics middleware
app.use(collectHttpMetrics)

// Metrics endpoint
app.get('/api/metrics', async (req, res) => {
  try {
    res.set('Content-Type', register.contentType)
    const metrics = await register.metrics()
    res.end(metrics)
  } catch (error) {
    console.error('Error getting metrics:', error)
    res.status(500).end('Error getting metrics')
  }
})

// Update metrics periodically
setInterval(async () => {
  try {
    await updateTaskMetrics(pool)
    updateDbMetrics(pool)
  } catch (error) {
    console.error('Error updating metrics:', error)
  }
}, 30000) // Every 30 seconds

// CORS configuration
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    optionsSuccessStatus: 200,
  })
)

// Parsing middleware
app.use(compression())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Logging middleware
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'))

// API Routes
app.use('/api/health', healthRoutes)
app.use('/api/auth', authRoutes)
app.use('/api/tasks', authenticateToken, taskRoutes)

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Task Manager API',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  })
})

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
    error: 'Not Found',
  })
})

// Error handling middleware (must be last)
app.use(errorHandler)

// Database connection and server startup
const startServer = async () => {
  try {
    console.log('🔌 Connecting to database...')
    await connectDatabase()

    console.log('🗄️  Initializing database schema...')
    await initializeDatabase()

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`)
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`)
      console.log(
        `🌍 CORS enabled for: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`
      )
      console.log(`📋 API Documentation: http://localhost:${PORT}/api/health`)
      console.log(`📈 Metrics available at: http://localhost:${PORT}/api/metrics`)
    })
  } catch (error) {
    console.error('❌ Failed to start server:', error)
    process.exit(1)
  }
}

// Graceful shutdown
const gracefulShutdown = (signal: string) => {
  console.log(`🛑 ${signal} received, shutting down gracefully`)
  
  // Stop accepting new connections
  process.exit(0)
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
process.on('SIGINT', () => gracefulShutdown('SIGINT'))

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason)
  process.exit(1)
})

// Start the server
startServer()

export default app
