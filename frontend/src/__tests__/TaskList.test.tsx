import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TaskList } from '@/components/TaskList'
import type { Task } from '@/types'

const mockOnUpdate = vi.fn()
const mockOnDelete = vi.fn()

const createTask = (overrides: Partial<Task> = {}): Task => ({
  id: `task-${Math.random()}`,
  title: 'Sample Task',
  description: 'Sample description',
  status: 'todo',
  priority: 'medium',
  createdAt: '2024-01-01T10:00:00Z',
  updatedAt: '2024-01-01T10:00:00Z',
  userId: 'user-1',
  ...overrides,
})

describe('TaskList', () => {
  it('renders three columns: To Do, In Progress, Done', () => {
    render(
      <TaskList
        tasks={[]}
        onUpdateTask={mockOnUpdate}
        onDeleteTask={mockOnDelete}
      />,
    )
    expect(screen.getByText('To Do')).toBeInTheDocument()
    expect(screen.getByText('In Progress')).toBeInTheDocument()
    expect(screen.getByText('Done')).toBeInTheDocument()
  })

  it('shows (0 tasks) count in all columns when no tasks', () => {
    render(
      <TaskList
        tasks={[]}
        onUpdateTask={mockOnUpdate}
        onDeleteTask={mockOnDelete}
      />,
    )
    const counts = screen.getAllByText('(0 tasks)')
    expect(counts).toHaveLength(3)
  })

  it('distributes tasks to correct columns by status', () => {
    const tasks = [
      createTask({ title: 'Todo Task', status: 'todo' }),
      createTask({ title: 'Progress Task', status: 'in-progress' }),
      createTask({ title: 'Done Task', status: 'done' }),
    ]
    render(
      <TaskList
        tasks={tasks}
        onUpdateTask={mockOnUpdate}
        onDeleteTask={mockOnDelete}
      />,
    )

    expect(screen.getByText('Todo Task')).toBeInTheDocument()
    expect(screen.getByText('Progress Task')).toBeInTheDocument()
    expect(screen.getByText('Done Task')).toBeInTheDocument()
  })

  it('shows correct task counts in column headers', () => {
    const tasks = [
      createTask({ status: 'todo' }),
      createTask({ status: 'todo' }),
      createTask({ status: 'in-progress' }),
    ]
    render(
      <TaskList
        tasks={tasks}
        onUpdateTask={mockOnUpdate}
        onDeleteTask={mockOnDelete}
      />,
    )

    expect(screen.getByText('(2 tasks)')).toBeInTheDocument()
    expect(screen.getByText('(1 tasks)')).toBeInTheDocument()
    expect(screen.getByText('(0 tasks)')).toBeInTheDocument()
  })

  it('renders multiple tasks in the same column', () => {
    const tasks = [
      createTask({ title: 'First Todo', status: 'todo' }),
      createTask({ title: 'Second Todo', status: 'todo' }),
      createTask({ title: 'Third Todo', status: 'todo' }),
    ]
    render(
      <TaskList
        tasks={tasks}
        onUpdateTask={mockOnUpdate}
        onDeleteTask={mockOnDelete}
      />,
    )

    expect(screen.getByText('First Todo')).toBeInTheDocument()
    expect(screen.getByText('Second Todo')).toBeInTheDocument()
    expect(screen.getByText('Third Todo')).toBeInTheDocument()
  })
})
