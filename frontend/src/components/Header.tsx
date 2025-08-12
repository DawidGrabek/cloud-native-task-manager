// src/components/Header.tsx
import React from 'react'
import type { User } from '../types'

interface HeaderProps {
  user: User
  onLogout: () => void
  healthStatus: string
}

export const Header: React.FC<HeaderProps> = ({
  user,
  onLogout,
  healthStatus,
}) => {
  const getHealthStatusColor = () => {
    switch (healthStatus) {
      case 'healthy':
        return 'bg-green-500'
      case 'unhealthy':
        return 'bg-red-500'
      default:
        return 'bg-yellow-500'
    }
  }

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-gray-900">
              🎯 Task Manager
            </h1>
            <div className="flex items-center space-x-2">
              <div
                className={`w-2 h-2 rounded-full $\{getHealthStatusColor()}`}
              ></div>
              <span className="text-sm text-gray-600">API: {healthStatus}</span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">
                Welcome, {user.name}
              </p>
              <p className="text-xs text-gray-500">{user.email}</p>
            </div>
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">
                {user.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <button
              onClick={onLogout}
              className="bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-lg transition duration-200 text-sm"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
