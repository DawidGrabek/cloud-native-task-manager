// src/components/TaskCard.tsx
import React, { useState } from 'react'
import type { Task, TaskStatus, TaskPriority } from '../types'

interface TaskCardProps {
  task: Task
  onUpdate: (taskId: string, updates: Partial<Task>) => void
  onDelete: (taskId: string) => void
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onUpdate,
  onDelete,
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(task.title)
  const [editDescription, setEditDescription] = useState(task.description)

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const handleStatusChange = (newStatus: TaskStatus) => {
    onUpdate(task.id, { status: newStatus })
  }

  const handlePriorityChange = (newPriority: TaskPriority) => {
    onUpdate(task.id, { priority: newPriority })
  }

  const handleSaveEdit = () => {
    if (editTitle.trim()) {
      onUpdate(task.id, {
        title: editTitle.trim(),
        description: editDescription.trim(),
      })
      setIsEditing(false)
    }
  }

  const handleCancelEdit = () => {
    setEditTitle(task.title)
    setEditDescription(task.description)
    setIsEditing(false)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200">
      {isEditing ? (
        <div className="space-y-3">
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Task title"
          />
          <textarea
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            rows={3}
            placeholder="Task description"
          />
          <div className="flex space-x-2">
            <button
              onClick={handleSaveEdit}
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 px-3 rounded-md text-sm font-medium transition duration-200"
            >
              Save
            </button>
            <button
              onClick={handleCancelEdit}
              className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 px-3 rounded-md text-sm font-medium transition duration-200"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-start mb-3">
            <h4 className="font-semibold text-gray-900 flex-1 pr-2">
              {task.title}
            </h4>
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium border $\{getPriorityColor(task.priority)}`}
            >
              {task.priority}
            </span>
          </div>

          {task.description && (
            <p className="text-gray-600 text-sm mb-3 leading-relaxed">
              {task.description}
            </p>
          )}

          <div className="flex justify-between items-center mb-3">
            <select
              value={task.status}
              onChange={(e) => handleStatusChange(e.target.value as TaskStatus)}
              className="text-xs bg-white border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="todo">To Do</option>
              <option value="in-progress">In Progress</option>
              <option value="done">Done</option>
            </select>

            <select
              value={task.priority}
              onChange={(e) =>
                handlePriorityChange(e.target.value as TaskPriority)
              }
              className="text-xs bg-white border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          <div className="flex justify-between items-center text-xs text-gray-500 mb-3">
            <span>Created: {formatDate(task.createdAt)}</span>
            {task.updatedAt !== task.createdAt && (
              <span>Updated: {formatDate(task.updatedAt)}</span>
            )}
          </div>

          <div className="flex space-x-2">
            <button
              onClick={() => setIsEditing(true)}
              className="flex-1 bg-blue-100 hover:bg-blue-200 text-blue-700 py-2 px-3 rounded-md text-sm font-medium transition duration-200"
            >
              Edit
            </button>
            <button
              onClick={() => {
                if (
                  window.confirm('Are you sure you want to delete this task?')
                ) {
                  onDelete(task.id)
                }
              }}
              className="flex-1 bg-red-100 hover:bg-red-200 text-red-700 py-2 px-3 rounded-md text-sm font-medium transition duration-200"
            >
              Delete
            </button>
          </div>
        </>
      )}
    </div>
  )
}
