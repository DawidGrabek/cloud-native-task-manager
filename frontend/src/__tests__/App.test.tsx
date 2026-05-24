import { describe, it, expect } from 'vitest'
import type { Task, TaskStatus, TaskPriority } from '../types'

describe('Type definitions', () => {
  it('TaskStatus accepts valid values', () => {
    const statuses: TaskStatus[] = ['todo', 'in-progress', 'done']
    expect(statuses).toHaveLength(3)
  })

  it('TaskPriority accepts valid values', () => {
    const priorities: TaskPriority[] = ['low', 'medium', 'high']
    expect(priorities).toHaveLength(3)
  })

  it('Task object has required fields', () => {
    const task: Task = {
      id: '1',
      title: 'Test',
      description: 'Desc',
      status: 'todo',
      priority: 'medium',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      userId: 'user-1',
    }
    expect(task.id).toBe('1')
    expect(task.status).toBe('todo')
    expect(task.priority).toBe('medium')
  })
})