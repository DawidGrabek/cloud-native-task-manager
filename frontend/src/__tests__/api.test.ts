import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { authApi, tasksApi, healthCheck } from '@/services/api'

// Mock axios module
vi.mock('axios', async () => {
  const actual = await vi.importActual<typeof import('axios')>('axios')
  return {
    ...actual,
    default: {
      create: () => ({
        get: vi.fn(),
        post: vi.fn(),
        put: vi.fn(),
        delete: vi.fn(),
        interceptors: {
          request: { use: vi.fn() },
          response: { use: vi.fn() },
        },
      }),
    },
  }
})

describe('authApi.logout', () => {
  beforeEach(() => {
    localStorage.setItem('authToken', 'test-token')
    localStorage.setItem(
      'user',
      JSON.stringify({ id: '1', email: 'test@test.com' }),
    )
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('removes authToken from localStorage on logout', () => {
    authApi.logout()
    expect(localStorage.getItem('authToken')).toBeNull()
  })

  it('removes user from localStorage on logout', () => {
    authApi.logout()
    expect(localStorage.getItem('user')).toBeNull()
  })
})

describe('API module structure', () => {
  it('exports healthCheck function', () => {
    expect(typeof healthCheck).toBe('function')
  })

  it('exports authApi with login, register, getProfile, logout methods', () => {
    expect(typeof authApi.login).toBe('function')
    expect(typeof authApi.register).toBe('function')
    expect(typeof authApi.getProfile).toBe('function')
    expect(typeof authApi.logout).toBe('function')
  })

  it('exports tasksApi with CRUD methods', () => {
    expect(typeof tasksApi.getTasks).toBe('function')
    expect(typeof tasksApi.createTask).toBe('function')
    expect(typeof tasksApi.updateTask).toBe('function')
    expect(typeof tasksApi.deleteTask).toBe('function')
    expect(typeof tasksApi.getTaskById).toBe('function')
  })
})
