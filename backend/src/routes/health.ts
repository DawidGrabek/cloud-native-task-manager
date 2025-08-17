// src/routes/health.ts
import { Router, Request, Response } from 'express'
import { pool } from '../database/connection'

const router = Router()

// Basic health check
router.get('/', async (req: Request, res: Response) => {
  try {
    const dbHealth = await checkDatabaseHealth()

    const healthStatus = {
      status: dbHealth.healthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      services: {
        database: dbHealth,
        api: {
          healthy: true,
          responseTime: process.hrtime()[1] / 1000000, // ms
        },
      },
      uptime: process.uptime(),
      memory: {
        used:
          Math.round((process.memoryUsage().heapUsed / 1024 / 1024) * 100) /
          100,
        total:
          Math.round((process.memoryUsage().heapTotal / 1024 / 1024) * 100) /
          100,
      },
    }

    const statusCode = healthStatus.status === 'healthy' ? 200 : 503

    res.status(statusCode).json({
      success: healthStatus.status === 'healthy',
      data: healthStatus,
    })
  } catch (error) {
    console.error('Health check error:', error)
    res.status(503).json({
      success: false,
      data: {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Health check failed',
      },
    })
  }
})

// Database health check
router.get('/db', async (req: Request, res: Response) => {
  try {
    const dbHealth = await checkDatabaseHealth()

    res.status(dbHealth.healthy ? 200 : 503).json({
      success: dbHealth.healthy,
      data: dbHealth,
    })
  } catch (error) {
    console.error('Database health check error:', error)
    res.status(503).json({
      success: false,
      data: {
        healthy: false,
        error: 'Database health check failed',
        timestamp: new Date().toISOString(),
      },
    })
  }
})

// Detailed system info (development only)
router.get('/system', (req: Request, res: Response) => {
  if (process.env.NODE_ENV === 'production') {
    res.status(403).json({
      success: false,
      message: 'System info not available in production',
    })
    return
  }

  const systemInfo = {
    node: {
      version: process.version,
      platform: process.platform,
      arch: process.arch,
    },
    environment: process.env.NODE_ENV,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    cpu: process.cpuUsage(),
    pid: process.pid,
    timestamp: new Date().toISOString(),
  }

  res.json({
    success: true,
    data: systemInfo,
  })
})

// Helper function to check database health
async function checkDatabaseHealth() {
  try {
    const start = Date.now()

    // Test basic connection
    const client = await pool.connect()

    // Test query execution
    await client.query('SELECT 1')

    // Test user table access
    const userCount = await client.query('SELECT COUNT(*) FROM users')

    // Test tasks table access
    const taskCount = await client.query('SELECT COUNT(*) FROM tasks')

    const responseTime = Date.now() - start

    client.release()

    return {
      healthy: true,
      responseTime,
      connectionPool: {
        total: pool.totalCount,
        idle: pool.idleCount,
        waiting: pool.waitingCount,
      },
      tables: {
        users: parseInt(userCount.rows[0].count),
        tasks: parseInt(taskCount.rows[0].count),
      },
      timestamp: new Date().toISOString(),
    }
  } catch (error) {
    return {
      healthy: false,
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
    }
  }
}

export { router as healthRoutes }
