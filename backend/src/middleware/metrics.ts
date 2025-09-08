// src/middleware/metrics.ts
import { Request, Response, NextFunction } from 'express'
import { Pool } from 'pg'
import promClient from 'prom-client'

// Create a Registry which registers the metrics
export const register = new promClient.Registry()

// Add a default label which is added to all metrics
register.setDefaultLabels({
  app: 'taskmanager' // Tutaj możesz ustawić nazwę aplikacji
})

// Enable the collection of default metrics
promClient.collectDefaultMetrics({
  // app: 'taskmanager-backend',
  prefix: 'taskmanager_',
  gcDurationBuckets: [0.001, 0.01, 0.1, 1, 2, 5],
  register
});

// Custom metrics
const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
  registers: [register]
})

const httpRequestsTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status'],
  registers: [register]
})

const dbConnectionsActive = new promClient.Gauge({
  name: 'db_connections_active',
  help: 'Number of active database connections',
  registers: [register]
})

const tasksTotal = new promClient.Gauge({
  name: 'tasks_total',
  help: 'Total number of tasks',
  labelNames: ['status'],
  registers: [register]
})

export const taskOperations = new promClient.Counter({
  name: 'taskmanager_task_operations_total',
  help: 'Total number of task operations',
  labelNames: ['operation', 'status'] // create, update, delete + success/error
});


// Middleware to collect HTTP metrics
export const collectHttpMetrics = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now()
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000
    const route = req.route?.path || req.path
    
    httpRequestDuration
      .labels(req.method, route, res.statusCode.toString())
      .observe(duration)
    
    httpRequestsTotal
      .labels(req.method, route, res.statusCode.toString())
      .inc()
  })
  
  next()
}

// Update database metrics
export const updateDbMetrics = (pool: Pool) => {
  dbConnectionsActive.set(pool.totalCount - pool.idleCount)
}

// Update task metrics
export const updateTaskMetrics = async (pool: Pool) => {
  try {
    const result = await pool.query(`
      SELECT status, COUNT(*) as count 
      FROM tasks 
      GROUP BY status
    `)
    
    // Reset all gauges
    tasksTotal.reset()
    
    // Set new values
    result.rows.forEach(row => {
      tasksTotal.labels(row.status).set(parseInt(row.count))
    })
  } catch (error) {
    console.error('Failed to update task metrics:', error)
  }
}
