// src/App.tsx
import React, { useState, useEffect } from 'react'
import { TaskList } from './components/TaskList'
import { TaskForm } from './components/TaskForm'
import { Header } from './components/Header'
import { LoginForm } from './components/LoginForm'
import type { Task, User } from './types'
import { tasksApi, authApi, healthCheck } from './services/api'
import './App.css'

function App() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showTaskForm, setShowTaskForm] = useState(false)
  const [healthStatus, setHealthStatus] = useState<string>('checking')

  useEffect(() => {
    initializeApp()
  }, [])

  const initializeApp = async () => {
    try {
      // Check API health
      const health = await healthCheck()
      setHealthStatus(health.data.status)

      // Check if user is logged in
      const token = localStorage.getItem('authToken')
      const userData = localStorage.getItem('user')

      if (token && userData) {
        try {
          const userProfile = await authApi.getProfile()
          setUser(userProfile)
          await loadTasks()
        } catch (error) {
          console.error('Invalid token, logging out:', error)
          handleLogout()
        }
      }
    } catch (error) {
      console.error('Failed to initialize app:', error)
      setHealthStatus('unhealthy')
    } finally {
      setIsLoading(false)
    }
  }

  const loadTasks = async () => {
    try {
      const tasksData = await tasksApi.getTasks()
      setTasks(tasksData)
    } catch (error) {
      console.error('Failed to load tasks:', error)
    }
  }

  const handleLogin = async (email: string, password: string) => {
    try {
      const authResponse = await authApi.login({ email, password })
      localStorage.setItem('authToken', authResponse.token)
      localStorage.setItem('user', JSON.stringify(authResponse.user))
      setUser(authResponse.user)
      await loadTasks()
    } catch (error) {
      console.error('Login failed:', error)
      throw error
    }
  }

  const handleLogout = () => {
    authApi.logout()
    setUser(null)
    setTasks([])
  }

  const handleCreateTask = async (
    title: string,
    description: string,
    priority: 'low' | 'medium' | 'high'
  ) => {
    try {
      const newTask = await tasksApi.createTask({
        title,
        description,
        priority,
      })
      setTasks((prevTasks) => [...prevTasks, newTask])
      setShowTaskForm(false)
    } catch (error) {
      console.error('Failed to create task:', error)
      throw error
    }
  }

  const handleUpdateTask = async (taskId: string, updates: Partial<Task>) => {
    try {
      const updatedTask = await tasksApi.updateTask(taskId, updates)
      setTasks((prevTasks) =>
        prevTasks.map((task) => (task.id === taskId ? updatedTask : task))
      )
    } catch (error) {
      console.error('Failed to update task:', error)
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    try {
      await tasksApi.deleteTask(taskId)
      setTasks((prevTasks) => prevTasks.filter((task) => task.id !== taskId))
    } catch (error) {
      console.error('Failed to delete task:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Task Manager...</p>
          <p className="text-sm text-gray-500">API Status: {healthStatus}</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-100">
        <LoginForm onLogin={handleLogin} healthStatus={healthStatus} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Header user={user} onLogout={handleLogout} healthStatus={healthStatus} />

      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Tasks</h1>
          <button
            onClick={() => setShowTaskForm(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition duration-200"
          >
            Add New Task
          </button>
        </div>

        {showTaskForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <TaskForm
                onSubmit={handleCreateTask}
                onCancel={() => setShowTaskForm(false)}
              />
            </div>
          </div>
        )}

        <TaskList
          tasks={tasks}
          onUpdateTask={handleUpdateTask}
          onDeleteTask={handleDeleteTask}
        />

        {tasks.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📝</div>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              No tasks yet
            </h3>
            <p className="text-gray-500 mb-6">
              Create your first task to get started!
            </p>
            <button
              onClick={() => setShowTaskForm(true)}
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg transition duration-200"
            >
              Create First Task
            </button>
          </div>
        )}
      </main>
    </div>
  )
}

export default App
