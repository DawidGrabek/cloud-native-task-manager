import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { TaskCard } from '../components/TaskCard'
import type { Task } from '../types'

const mockTask: Task = {
  id: 'task-1',
  title: 'Test Task',
  description: 'This is a test task description',
  status: 'todo',
  priority: 'medium',
  createdAt: '2024-01-01T10:00:00Z',
  updatedAt: '2024-01-01T10:00:00Z',
  userId: 'user-1',
}

const mockOnUpdate = vi.fn()
const mockOnDelete = vi.fn()

const renderTaskCard = (task: Partial<Task> = {}) => {
  return render(
    <TaskCard
      task={{ ...mockTask, ...task }}
      onUpdate={mockOnUpdate}
      onDelete={mockOnDelete}
    />,
  )
}

describe('TaskCard', () => {
  beforeEach(() => {
    mockOnUpdate.mockClear()
    mockOnDelete.mockClear()
  })

  it('renders task title and description', () => {
    renderTaskCard()
    expect(screen.getByText('Test Task')).toBeInTheDocument()
    expect(
      screen.getByText('This is a test task description'),
    ).toBeInTheDocument()
  })

  it('renders task priority badge', () => {
    renderTaskCard()
    expect(screen.getByText('medium')).toBeInTheDocument()
  })

  it('applies correct color for high priority', () => {
    renderTaskCard({ priority: 'high' })
    const badge = screen.getByText('high')
    expect(badge).toHaveClass('bg-red-100')
  })

  it('applies correct color for medium priority', () => {
    renderTaskCard({ priority: 'medium' })
    const badge = screen.getByText('medium')
    expect(badge).toHaveClass('bg-yellow-100')
  })

  it('applies correct color for low priority', () => {
    renderTaskCard({ priority: 'low' })
    const badge = screen.getByText('low')
    expect(badge).toHaveClass('bg-green-100')
  })

  it('renders status dropdown with current value', () => {
    renderTaskCard({ status: 'in-progress' })
    const statusSelect = screen.getByDisplayValue('In Progress')
    expect(statusSelect).toBeInTheDocument()
  })

  it('calls onUpdate when status changes', () => {
    renderTaskCard()
    const statusSelect = screen.getByDisplayValue('To Do')
    fireEvent.change(statusSelect, { target: { value: 'in-progress' } })
    expect(mockOnUpdate).toHaveBeenCalledWith('task-1', {
      status: 'in-progress',
    })
  })

  it('calls onUpdate when priority changes', () => {
    renderTaskCard()
    const prioritySelect = screen.getByDisplayValue('Medium')
    fireEvent.change(prioritySelect, { target: { value: 'high' } })
    expect(mockOnUpdate).toHaveBeenCalledWith('task-1', { priority: 'high' })
  })

  it('switches to edit mode when Edit button is clicked', () => {
    renderTaskCard()
    fireEvent.click(screen.getByRole('button', { name: /edit/i }))
    expect(screen.getByPlaceholderText(/task title/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/task description/i)).toBeInTheDocument()
  })

  it('restores original values when Cancel is clicked in edit mode', () => {
    renderTaskCard()
    fireEvent.click(screen.getByRole('button', { name: /edit/i }))

    fireEvent.change(screen.getByPlaceholderText(/task title/i), {
      target: { value: 'Changed Title' },
    })
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }))

    expect(screen.getByText('Test Task')).toBeInTheDocument()
    expect(screen.queryByPlaceholderText(/task title/i)).not.toBeInTheDocument()
  })

  it('calls onUpdate with new values when saving edit', () => {
    renderTaskCard()
    fireEvent.click(screen.getByRole('button', { name: /edit/i }))

    fireEvent.change(screen.getByPlaceholderText(/task title/i), {
      target: { value: 'Updated Title' },
    })
    fireEvent.change(screen.getByPlaceholderText(/task description/i), {
      target: { value: 'Updated description' },
    })
    fireEvent.click(screen.getByRole('button', { name: /save/i }))

    expect(mockOnUpdate).toHaveBeenCalledWith('task-1', {
      title: 'Updated Title',
      description: 'Updated description',
    })
  })

  it('does not save edit when title is empty', () => {
    renderTaskCard()
    fireEvent.click(screen.getByRole('button', { name: /edit/i }))

    fireEvent.change(screen.getByPlaceholderText(/task title/i), {
      target: { value: '' },
    })
    fireEvent.click(screen.getByRole('button', { name: /save/i }))

    // Should remain in edit mode - onUpdate should NOT be called for save
    expect(screen.getByPlaceholderText(/task title/i)).toBeInTheDocument()
  })

  it('calls onDelete when Delete is confirmed', () => {
    vi.spyOn(window, 'confirm').mockReturnValueOnce(true)
    renderTaskCard()
    fireEvent.click(screen.getByRole('button', { name: /delete/i }))
    expect(mockOnDelete).toHaveBeenCalledWith('task-1')
  })

  it('does not call onDelete when Delete is cancelled', () => {
    vi.spyOn(window, 'confirm').mockReturnValueOnce(false)
    renderTaskCard()
    fireEvent.click(screen.getByRole('button', { name: /delete/i }))
    expect(mockOnDelete).not.toHaveBeenCalled()
  })

  it('does not show description when it is empty', () => {
    renderTaskCard({ description: '' })
    expect(
      screen.queryByText('This is a test task description'),
    ).not.toBeInTheDocument()
  })

  it('does not show "Updated" date when createdAt equals updatedAt', () => {
    renderTaskCard({
      createdAt: '2024-01-01T10:00:00Z',
      updatedAt: '2024-01-01T10:00:00Z',
    })
    expect(screen.queryByText(/updated:/i)).not.toBeInTheDocument()
  })

  it('shows "Updated" date when the task has been modified', () => {
    renderTaskCard({
      createdAt: '2024-01-01T10:00:00Z',
      updatedAt: '2024-01-02T10:00:00Z',
    })
    expect(screen.getByText(/updated:/i)).toBeInTheDocument()
  })
})
