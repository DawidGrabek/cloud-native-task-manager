// src/components/TaskList.tsx
import React from 'react'
import { TaskCard } from './TaskCard'
import type { Task } from '../types'

interface TaskListProps {
  tasks: Task[]
  onUpdateTask: (taskId: string, updates: Partial<Task>) => void
  onDeleteTask: (taskId: string) => void
}

export const TaskList: React.FC<TaskListProps> = ({
  tasks,
  onUpdateTask,
  onDeleteTask,
}) => {
  const todoTasks = tasks.filter((task) => task.status === 'todo')
  const inProgressTasks = tasks.filter((task) => task.status === 'in-progress')
  const doneTasks = tasks.filter((task) => task.status === 'done')

  const TaskColumn: React.FC<{
    title: string
    tasks: Task[]
    status: 'todo' | 'in-progress' | 'done'
    bgColor: string
  }> = ({ title, tasks, status, bgColor }) => (
    <div className="flex-1 bg-white rounded-lg shadow-md p-4">
      <div
        className={`${bgColor} text-white text-center py-2 px-4 rounded-lg mb-4`}
      >
        <h3 className="font-semibold text-lg">{title}</h3>
        <span className="text-sm opacity-90">({tasks.length} tasks)</span>
      </div>

      <div className="space-y-3 min-h-[400px]">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onUpdate={onUpdateTask}
            onDelete={onDeleteTask}
          />
        ))}

        {tasks.length === 0 && (
          <div className="text-center text-gray-400 py-8">
            <div className="text-3xl mb-2">
              {status === 'todo' && '📋'}
              {status === 'in-progress' && '⚡'}
              {status === 'done' && '✅'}
            </div>
            <p className="text-sm">No {status} tasks</p>
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <TaskColumn
        title="To Do"
        tasks={todoTasks}
        status="todo"
        bgColor="bg-red-500"
      />
      <TaskColumn
        title="In Progress"
        tasks={inProgressTasks}
        status="in-progress"
        bgColor="bg-yellow-500"
      />
      <TaskColumn
        title="Done"
        tasks={doneTasks}
        status="done"
        bgColor="bg-green-500"
      />
    </div>
  )
}
