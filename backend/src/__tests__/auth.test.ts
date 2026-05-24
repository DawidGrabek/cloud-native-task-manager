
import request from 'supertest'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import app from '../app'
import { pool } from '../database/connection'

// Mock the database pool
jest.mock('../database/connection', () => ({
  pool: {
    query: jest.fn(),
    connect: jest.fn(),
    totalCount: 0,
    idleCount: 0,
    waitingCount: 0,
  },
}))

const mockPool = pool as jest.Mocked<typeof pool>

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

const makeToken = (payload = { userId: 'user-123', email: 'test@example.com' }) =>
  jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' })

describe('POST /api/auth/register', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns 400 when name is missing', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'test@example.com', password: 'password123' })

    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
    expect(res.body.message).toBe('Validation error')
  })

  it('returns 400 when email is invalid', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Test User', email: 'not-an-email', password: 'password123' })

    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
  })

  it('returns 400 when password is too short', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Test User', email: 'test@example.com', password: '123' })

    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
  })

  it('returns 409 when email already exists', async () => {
    (mockPool.query as jest.Mock).mockResolvedValueOnce({ rows: [{ id: 'existing-id' }] })

    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Test User', email: 'existing@example.com', password: 'password123' })

    expect(res.status).toBe(409)
    expect(res.body.success).toBe(false)
    expect(res.body.message).toBe('User with this email already exists')
  })

  it('returns 201 with token on successful registration', async () => {
    (mockPool.query as jest.Mock)
      .mockResolvedValueOnce({ rows: [] }) // no existing user
      .mockResolvedValueOnce({            // insert new user
        rows: [{
          id: 'new-user-id',
          name: 'Test User',
          email: 'newuser@example.com',
          created_at: new Date().toISOString(),
        }],
      })

    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Test User', email: 'newuser@example.com', password: 'password123' })

    expect(res.status).toBe(201)
    expect(res.body.success).toBe(true)
    expect(res.body.data).toHaveProperty('token')
    expect(res.body.data.user.email).toBe('newuser@example.com')
  })
})

describe('POST /api/auth/login', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns 400 when email is missing', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ password: 'password123' })

    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
  })

  it('returns 400 when password is missing', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com' })

    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
  })

  it('returns 401 when user is not found', async () => {
    (mockPool.query as jest.Mock).mockResolvedValueOnce({ rows: [] })

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'unknown@example.com', password: 'password123' })

    expect(res.status).toBe(401)
    expect(res.body.message).toBe('Invalid email or password')
  })

  it('returns 401 when password is incorrect', async () => {
    const passwordHash = await bcrypt.hash('correctpassword', 10)
    ;(mockPool.query as jest.Mock).mockResolvedValueOnce({
      rows: [{ id: 'user-1', name: 'Test', email: 'test@example.com', password_hash: passwordHash, created_at: new Date() }],
    })

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'wrongpassword' })

    expect(res.status).toBe(401)
    expect(res.body.message).toBe('Invalid email or password')
  })

  it('returns 200 with token on successful login', async () => {
    const passwordHash = await bcrypt.hash('password123', 10)
    ;(mockPool.query as jest.Mock).mockResolvedValueOnce({
      rows: [{ id: 'user-1', name: 'Test User', email: 'test@example.com', password_hash: passwordHash, created_at: new Date() }],
    })

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'password123' })

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data).toHaveProperty('token')
    expect(res.body.data.user.email).toBe('test@example.com')
  })
})

describe('GET /api/auth/profile', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns 401 when no token is provided', async () => {
    const res = await request(app).get('/api/auth/profile')

    expect(res.status).toBe(401)
    expect(res.body.message).toBe('Access token required')
  })

  it('returns 401 when token is invalid', async () => {
    const res = await request(app)
      .get('/api/auth/profile')
      .set('Authorization', 'Bearer invalid-token')

    expect(res.status).toBe(401)
    expect(res.body.message).toBe('Invalid token')
  })

  it('returns 404 when user is not found in DB', async () => {
    (mockPool.query as jest.Mock).mockResolvedValueOnce({ rows: [] })

    const token = makeToken()
    const res = await request(app)
      .get('/api/auth/profile')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(404)
    expect(res.body.message).toBe('User not found')
  })

  it('returns 200 with user profile on valid token', async () => {
    (mockPool.query as jest.Mock).mockResolvedValueOnce({
      rows: [{ id: 'user-123', name: 'Test User', email: 'test@example.com', created_at: new Date() }],
    })

    const token = makeToken()
    const res = await request(app)
      .get('/api/auth/profile')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data.email).toBe('test@example.com')
  })
})
