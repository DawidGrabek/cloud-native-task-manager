
import request from 'supertest'
import app from '@/app'
import { pool } from '@/database/connection'

jest.mock('@/database/connection', () => ({
  pool: {
    query: jest.fn(),
    connect: jest.fn(),
    totalCount: 2,
    idleCount: 1,
    waitingCount: 0,
  },
}))

const mockPool = pool as jest.Mocked<typeof pool>

describe('GET /api/health', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns 200 with healthy status when DB is reachable', async () => {
    const mockClient = {
      query: jest.fn()
        .mockResolvedValueOnce({})                             // SELECT 1
        .mockResolvedValueOnce({ rows: [{ count: '5' }] })    // COUNT users
        .mockResolvedValueOnce({ rows: [{ count: '10' }] }),  // COUNT tasks
      release: jest.fn(),
    }
    ;(mockPool.connect as jest.Mock).mockResolvedValueOnce(mockClient)

    const res = await request(app).get('/api/health')

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data.status).toBe('healthy')
  })

  it('returns required fields in health response', async () => {
    const mockClient = {
      query: jest.fn()
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({ rows: [{ count: '0' }] })
        .mockResolvedValueOnce({ rows: [{ count: '0' }] }),
      release: jest.fn(),
    }
    ;(mockPool.connect as jest.Mock).mockResolvedValueOnce(mockClient)

    const res = await request(app).get('/api/health')

    expect(res.body.data).toHaveProperty('status')
    expect(res.body.data).toHaveProperty('timestamp')
    expect(res.body.data).toHaveProperty('version')
    expect(res.body.data).toHaveProperty('uptime')
    expect(res.body.data).toHaveProperty('memory')
    expect(res.body.data).toHaveProperty('services')
  })

  it('returns 503 with unhealthy status when DB is unreachable', async () => {
    (mockPool.connect as jest.Mock).mockRejectedValueOnce(new Error('Connection refused'))

    const res = await request(app).get('/api/health')

    expect(res.status).toBe(503)
    expect(res.body.data.status).toBe('unhealthy')
  })

  it('has services.database and services.api in the response', async () => {
    const mockClient = {
      query: jest.fn()
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({ rows: [{ count: '1' }] })
        .mockResolvedValueOnce({ rows: [{ count: '2' }] }),
      release: jest.fn(),
    }
    ;(mockPool.connect as jest.Mock).mockResolvedValueOnce(mockClient)

    const res = await request(app).get('/api/health')

    expect(res.body.data.services).toHaveProperty('database')
    expect(res.body.data.services).toHaveProperty('api')
    expect(res.body.data.services.database.healthy).toBe(true)
  })
})

describe('GET /api/health/db', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns 200 when DB is reachable', async () => {
    const mockClient = {
      query: jest.fn()
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({ rows: [{ count: '0' }] })
        .mockResolvedValueOnce({ rows: [{ count: '0' }] }),
      release: jest.fn(),
    }
    ;(mockPool.connect as jest.Mock).mockResolvedValueOnce(mockClient)

    const res = await request(app).get('/api/health/db')

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data.healthy).toBe(true)
  })

  it('returns 503 when DB is unreachable', async () => {
    (mockPool.connect as jest.Mock).mockRejectedValueOnce(new Error('ECONNREFUSED'))

    const res = await request(app).get('/api/health/db')

    expect(res.status).toBe(503)
    expect(res.body.success).toBe(false)
    expect(res.body.data.healthy).toBe(false)
  })
})

describe('GET /api/health/system', () => {
  it('returns system info in non-production environment', async () => {
    const originalEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'development'

    const res = await request(app).get('/api/health/system')

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data).toHaveProperty('node')
    expect(res.body.data).toHaveProperty('memory')
    expect(res.body.data).toHaveProperty('uptime')

    process.env.NODE_ENV = originalEnv
  })

  it('returns 403 in production environment', async () => {
    const originalEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'production'

    const res = await request(app).get('/api/health/system')

    expect(res.status).toBe(403)
    expect(res.body.success).toBe(false)

    process.env.NODE_ENV = originalEnv
  })
})

describe('GET / (root endpoint)', () => {
  it('returns API info', async () => {
    const res = await request(app).get('/')

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.message).toBe('Task Manager API')
    expect(res.body).toHaveProperty('version')
  })
})

describe('GET /nonexistent-route', () => {
  it('returns 404 for unknown routes', async () => {
    const res = await request(app).get('/api/nonexistent')

    expect(res.status).toBe(404)
    expect(res.body.success).toBe(false)
  })
})