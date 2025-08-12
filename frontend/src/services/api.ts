// src/services/api.ts
import axios, { type AxiosResponse } from 'axios'
import type {
  Task,
  CreateTaskDto,
  UpdateTaskDto,
  AuthResponse,
  LoginDto,
  RegisterDto,
  ApiResponse,
  User,
} from '../types'

const API_BASE_URL =
  import.meta.env.REACT_APP_API_URL || 'http://localhost:5000/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken')
  if (token) {
    config.headers.Authorization = `Bearer $\{token}`
  }
  return config
})

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Health check
export const healthCheck = async (): Promise<
  ApiResponse<{ status: string; timestamp: string }>
> => {
  const response: AxiosResponse<
    ApiResponse<{ status: string; timestamp: string }>
  > = await api.get('/health')
  return response.data
}

// Auth API
export const authApi = {
  login: async (credentials: LoginDto): Promise<AuthResponse> => {
    const response: AxiosResponse<ApiResponse<AuthResponse>> = await api.post(
      '/auth/login',
      credentials
    )
    return response.data.data
  },

  register: async (userData: RegisterDto): Promise<AuthResponse> => {
    const response: AxiosResponse<ApiResponse<AuthResponse>> = await api.post(
      '/auth/register',
      userData
    )
    return response.data.data
  },

  getProfile: async (): Promise<User> => {
    const response: AxiosResponse<ApiResponse<User>> = await api.get(
      '/auth/profile'
    )
    return response.data.data
  },

  logout: () => {
    localStorage.removeItem('authToken')
    localStorage.removeItem('user')
  },
}

// Tasks API
export const tasksApi = {
  getTasks: async (): Promise<Task[]> => {
    const response: AxiosResponse<ApiResponse<Task[]>> = await api.get('/tasks')
    return response.data.data
  },

  createTask: async (task: CreateTaskDto): Promise<Task> => {
    const response: AxiosResponse<ApiResponse<Task>> = await api.post(
      '/tasks',
      task
    )
    return response.data.data
  },

  updateTask: async (id: string, updates: UpdateTaskDto): Promise<Task> => {
    const response: AxiosResponse<ApiResponse<Task>> = await api.put(
      `/tasks/$\{id}`,
      updates
    )
    return response.data.data
  },

  deleteTask: async (id: string): Promise<void> => {
    await api.delete(`/tasks/$\{id}`)
  },

  getTaskById: async (id: string): Promise<Task> => {
    const response: AxiosResponse<ApiResponse<Task>> = await api.get(
      `/tasks/$\{id}`
    )
    return response.data.data
  },
}

export default api
