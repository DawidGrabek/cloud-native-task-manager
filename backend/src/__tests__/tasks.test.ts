
import request from 'supertest'
import jwt from 'jsonwebtoken'
import app from '../app'
import { pool } from '../database/connection'

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

const makeToken = (userId = 'user-123') =>
  jwt.sign({ userId, email: 'test@example.com' }, JWT_SECRET, { expiresIn: '1h' })

const mockTask = {
  id: 'task-uuid-1',
  title: 'Test Task',
  description: 'Test description',
  status: 'todo',
  priority: 'medium',
  user_id: 'user-123',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

describe('GET /api/tasks', () => {
  beforeEach(() => jest.resetAllMocks())

  it('returns 401 when no auth token is provided', async () => {
    const res = await request(app).get('/api/tasks')
    expect(res.status).toBe(401)
  })

  it('returns 200 with empty array when user has no tasks', async () => {
    (mockPool.query as jest.Mock).mockResolvedValueOnce({ rows: [] })

    const res = await request(app)
      .get('/api/tasks')
      .set('Authorization', `Bearer ${makeToken()}`)

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data).toEqual([])
  })

  it('returns 200 with list of tasks', async () => {
    (mockPool.query as jest.Mock).mockResolvedValueOnce({ rows: [mockTask] })

    const res = await request(app)
      .get('/api/tasks')
      .set('Authorization', `Bearer ${makeToken()}`)

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data).toHaveLength(1)
    expect(res.body.data[0].title).toBe('Test Task')
    expect(res.body.data[0].userId).toBe('user-123')
  })

  it('returns tasks mapped to camelCase fields', async () => {
    (mockPool.query as jest.Mock).mockResolvedValueOnce({ rows: [mockTask] })

    const res = await request(app)
      .get('/api/tasks')
      .set('Authorization', `Bearer ${makeToken()}`)

    const task = res.body.data[0]
    expect(task).toHaveProperty('id')
    expect(task).toHaveProperty('title')
    expect(task).toHaveProperty('status')
    expect(task).toHaveProperty('priority')
    expect(task).toHaveProperty('userId')
    expect(task).toHaveProperty('createdAt')
    expect(task).toHaveProperty('updatedAt')
    expect(task).not.toHaveProperty('user_id')
    expect(task).not.toHaveProperty('created_at')
  })
})

describe('POST /api/tasks', () => {
  beforeEach(() => jest.resetAllMocks())

  it('returns 400 when title is missing', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ description: 'No title', priority: 'high' })

    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
    expect(res.body.message).toBe('Validation error')
  })

  it('returns 400 when priority is invalid', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ title: 'Task', priority: 'urgent' })

    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
  })

  it('returns 401 when not authenticated', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .send({ title: 'Task', priority: 'medium' })

    expect(res.status).toBe(401)
  })

  it('returns 201 with created task on valid input', async () => {
    (mockPool.query as jest.Mock).mockResolvedValueOnce({ rows: [mockTask] })

    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ title: 'Test Task', description: 'Test description', priority: 'medium' })

    expect(res.status).toBe(201)
    expect(res.body.success).toBe(true)
    expect(res.body.message).toBe('Task created successfully')
    expect(res.body.data.title).toBe('Test Task')
  })

  it('uses medium as default priority when not specified', async () => {
    (mockPool.query as jest.Mock).mockResolvedValueOnce({ rows: [{ ...mockTask, priority: 'medium' }] })

    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ title: 'Task without priority' })

    expect(res.status).toBe(201)
    expect(res.body.data.priority).toBe('medium')
  })
})

describe('PUT /api/tasks/:id', () => {
  beforeEach(() => jest.resetAllMocks())

  it('returns 401 when not authenticated', async () => {
    const res = await request(app)
      .put('/api/tasks/task-uuid-1')
      .send({ status: 'done' })

    expect(res.status).toBe(401)
  })

  it('returns 400 when body is empty', async () => {
    const res = await request(app)
      .put('/api/tasks/task-uuid-1')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({})

    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
  })

  it('returns 400 when status value is invalid', async () => {
    const res = await request(app)
      .put('/api/tasks/task-uuid-1')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ status: 'invalid-status' })

    expect(res.status).toBe(400)
  })

  it('returns 404 when task does not exist or belong to user', async () => {
    (mockPool.query as jest.Mock).mockResolvedValueOnce({ rows: [] }) // task not found

    const res = await request(app)
      .put('/api/tasks/nonexistent-task')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ status: 'done' })

    expect(res.status).toBe(404)
    expect(res.body.message).toBe('Task not found')
  })

  it('returns 200 with updated task on success', async () => {
    const updatedTask = { ...mockTask, status: 'done' }
    ;(mockPool.query as jest.Mock)
      .mockResolvedValueOnce({ rows: [{ id: mockTask.id }] }) // existing check
      .mockResolvedValueOnce({ rows: [updatedTask] })          // update result

    const res = await request(app)
      .put('/api/tasks/task-uuid-1')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ status: 'done' })

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data.status).toBe('done')
  })
})

describe('DELETE /api/tasks/:id', () => {
  beforeEach(() => jest.resetAllMocks())

  it('returns 401 when not authenticated', async () => {
    const res = await request(app).delete('/api/tasks/task-uuid-1')
    expect(res.status).toBe(401)
  })

  it('returns 404 when task does not exist', async () => {
    (mockPool.query as jest.Mock).mockResolvedValueOnce({ rows: [] })

    const res = await request(app)
      .delete('/api/tasks/nonexistent-task')
      .set('Authorization', `Bearer ${makeToken()}`)

    expect(res.status).toBe(404)
    expect(res.body.message).toBe('Task not found')
  })

  it('returns 200 with success message on deletion', async () => {
    (mockPool.query as jest.Mock).mockResolvedValueOnce({ rows: [{ id: 'task-uuid-1' }] })

    const res = await request(app)
      .delete('/api/tasks/task-uuid-1')
      .set('Authorization', `Bearer ${makeToken()}`)

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.message).toBe('Task deleted successfully')
  })
})

describe('GET /api/tasks/:id', () => {
  beforeEach(() => jest.resetAllMocks())

  it('returns 401 when not authenticated', async () => {
    const res = await request(app).get('/api/tasks/task-uuid-1')
    expect(res.status).toBe(401)
  })

  it('returns 404 when task is not found', async () => {
    (mockPool.query as jest.Mock).mockResolvedValueOnce({ rows: [] })

    const res = await request(app)
      .get('/api/tasks/nonexistent')
      .set('Authorization', `Bearer ${makeToken()}`)

    expect(res.status).toBe(404)
    expect(res.body.message).toBe('Task not found')
  })

  it('returns 200 with task data when found', async () => {
    (mockPool.query as jest.Mock).mockResolvedValueOnce({ rows: [mockTask] })

    const res = await request(app)
      .get('/api/tasks/task-uuid-1')
      .set('Authorization', `Bearer ${makeToken()}`)

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data.id).toBe('task-uuid-1')
    expect(res.body.data.title).toBe('Test Task')
  })
})
