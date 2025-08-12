// src/components/LoginForm.tsx
import React, { useState } from 'react'
import { useForm } from 'react-hook-form'

interface LoginFormData {
  email: string
  password: string
}

interface LoginFormProps {
  onLogin: (email: string, password: string) => Promise<void>
  healthStatus: string
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onLogin,
  healthStatus,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showDemo, setShowDemo] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<LoginFormData>()

  const onFormSubmit = async (data: LoginFormData) => {
    try {
      setIsSubmitting(true)
      setError(null)
      await onLogin(data.email, data.password)
    } catch (err) {
      console.error('Login error:', err)
      setError('Invalid email or password. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const useDemoCredentials = () => {
    setValue('email', 'demo@taskmanager.com')
    setValue('password', 'demo123')
    setShowDemo(false)
  }

  const getHealthStatusColor = () => {
    switch (healthStatus) {
      case 'healthy':
        return 'text-green-600'
      case 'unhealthy':
        return 'text-red-600'
      default:
        return 'text-yellow-600'
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="text-6xl mb-4">🎯</div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Task Manager
          </h2>
          <p className="text-gray-600 mb-4">DevOps Portfolio Project</p>
          <div className="flex items-center justify-center space-x-2 mb-6">
            <div
              className={`w-2 h-2 rounded-full $\{
              healthStatus === 'healthy' ? 'bg-green-500' : 
              healthStatus === 'unhealthy' ? 'bg-red-500' : 'bg-yellow-500'
            }`}
            ></div>
            <span className={`text-sm font-medium $\{getHealthStatusColor()}`}>
              API Status: {healthStatus}
            </span>
          </div>
        </div>

        <div className="bg-white p-8 rounded-lg shadow-lg border border-gray-200">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email Address
              </label>
              <input
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address',
                  },
                })}
                type="email"
                id="email"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your email"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Password
              </label>
              <input
                {...register('password', {
                  required: 'Password is required',
                  minLength: {
                    value: 6,
                    message: 'Password must be at least 6 characters',
                  },
                })}
                type="password"
                id="password"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your password"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.password.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting || healthStatus !== 'healthy'}
              className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-bold py-3 px-4 rounded-lg transition duration-200"
            >
              {isSubmitting ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="text-center">
              <button
                type="button"
                onClick={() => setShowDemo(!showDemo)}
                className="text-blue-500 hover:text-blue-600 text-sm font-medium"
              >
                Demo Credentials
              </button>
              {showDemo && (
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800 mb-2">
                    For demo purposes:
                  </p>
                  <button
                    type="button"
                    onClick={useDemoCredentials}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium transition duration-200"
                  >
                    Use Demo Login
                  </button>
                </div>
              )}
            </div>
          </div>

          {healthStatus !== 'healthy' && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                ⚠️ API is currently {healthStatus}. Please check the backend
                service.
              </p>
            </div>
          )}
        </div>

        <div className="text-center text-sm text-gray-500">
          <p>
            DevOps Project by <strong>Dawid Grabek</strong>
          </p>
          <p>React + Node.js + PostgreSQL + Docker</p>
        </div>
      </div>
    </div>
  )
}
