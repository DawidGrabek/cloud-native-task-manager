
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import rateLimit from 'express-rate-limit'

import { authRoutes } from './routes/auth'
import { taskRoutes } from './routes/tasks'
import { healthRoutes } from './routes/health'
import { errorHandler } from './middleware/errorHandler'
import { authenticateToken } from './middleware/auth'
import { collectHttpMetrics, register } from './middleware/metrics'

const app = express()

app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: false,
  })
)

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000, // higher limit in tests
  standardHeaders: true,
  legacyHeaders: false,
})
app.use(limiter)

app.use(collectHttpMetrics)

app.get('/api/metrics', async (req, res) => {
  try {
    res.set('Content-Type', register.contentType)
    const metrics = await register.metrics()
    res.end(metrics)
  } catch (error) {
    res.status(500).end('Error getting metrics')
  }
})

app.use(
  cors({
    origin: '*',
    credentials: true,
    optionsSuccessStatus: 200,
  })
)

app.use(compression())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

app.use('/api/health', healthRoutes)
app.use('/api/auth', authRoutes)
app.use('/api/tasks', authenticateToken, taskRoutes)

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Task Manager API',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  })
})

app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
    error: 'Not Found',
  })
})

app.use(errorHandler)

export default app
