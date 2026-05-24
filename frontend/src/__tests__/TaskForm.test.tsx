import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { TaskForm } from '../components/TaskForm'

const mockOnSubmit = vi.fn()
const mockOnCancel = vi.fn()

const renderTaskForm = () => {
  return render(<TaskForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />)
}

describe('TaskForm', () => {
  beforeEach(() => {
    mockOnSubmit.mockClear()
    mockOnCancel.mockClear()
  })

  it('renders all form fields', () => {
    renderTaskForm()
    expect(screen.getByLabelText(/title/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/priority/i)).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /create task/i }),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
  })

  it('has "medium" as default priority', () => {
    renderTaskForm()
    const prioritySelect = screen.getByLabelText(
      /priority/i,
    ) as HTMLSelectElement
    expect(prioritySelect.value).toBe('medium')
  })

  it('shows validation error when title is empty', async () => {
    renderTaskForm()
    fireEvent.click(screen.getByRole('button', { name: /create task/i }))

    await waitFor(() => {
      expect(screen.getByText(/title is required/i)).toBeInTheDocument()
    })
  })

  it('shows validation error when title is too short', async () => {
    renderTaskForm()
    fireEvent.change(screen.getByLabelText(/title/i), {
      target: { value: 'ab' },
    })
    fireEvent.click(screen.getByRole('button', { name: /create task/i }))

    await waitFor(() => {
      expect(
        screen.getByText(/title must be at least 3 characters/i),
      ).toBeInTheDocument()
    })
  })

  it('shows validation error when title is too long', async () => {
    renderTaskForm()
    fireEvent.change(screen.getByLabelText(/title/i), {
      target: { value: 'a'.repeat(101) },
    })
    fireEvent.click(screen.getByRole('button', { name: /create task/i }))

    await waitFor(() => {
      expect(
        screen.getByText(/title must be less than 100 characters/i),
      ).toBeInTheDocument()
    })
  })

  it('shows validation error when description is too long', async () => {
    renderTaskForm()
    fireEvent.change(screen.getByLabelText(/title/i), {
      target: { value: 'Valid Title' },
    })
    fireEvent.change(screen.getByLabelText(/description/i), {
      target: { value: 'a'.repeat(501) },
    })
    fireEvent.click(screen.getByRole('button', { name: /create task/i }))

    await waitFor(() => {
      expect(
        screen.getByText(/description must be less than 500 characters/i),
      ).toBeInTheDocument()
    })
  })

  it('calls onSubmit with correct values on valid submit', async () => {
    mockOnSubmit.mockResolvedValueOnce(undefined)
    renderTaskForm()

    fireEvent.change(screen.getByLabelText(/title/i), {
      target: { value: 'New Feature' },
    })
    fireEvent.change(screen.getByLabelText(/description/i), {
      target: { value: 'Implement a new feature' },
    })
    fireEvent.change(screen.getByLabelText(/priority/i), {
      target: { value: 'high' },
    })
    fireEvent.click(screen.getByRole('button', { name: /create task/i }))

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        'New Feature',
        'Implement a new feature',
        'high',
      )
    })
  })

  it('resets form after successful submission', async () => {
    mockOnSubmit.mockResolvedValueOnce(undefined)
    renderTaskForm()

    fireEvent.change(screen.getByLabelText(/title/i), {
      target: { value: 'New Task' },
    })
    fireEvent.click(screen.getByRole('button', { name: /create task/i }))

    await waitFor(() => {
      const titleInput = screen.getByLabelText(/title/i) as HTMLInputElement
      expect(titleInput.value).toBe('')
    })
  })

  it('shows error message when submission fails', async () => {
    mockOnSubmit.mockRejectedValueOnce(new Error('Network error'))
    renderTaskForm()

    fireEvent.change(screen.getByLabelText(/title/i), {
      target: { value: 'New Task' },
    })
    fireEvent.click(screen.getByRole('button', { name: /create task/i }))

    await waitFor(() => {
      expect(screen.getByText(/network error/i)).toBeInTheDocument()
    })
  })

  it('calls onCancel when Cancel button is clicked', () => {
    renderTaskForm()
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }))
    expect(mockOnCancel).toHaveBeenCalledOnce()
  })
})
