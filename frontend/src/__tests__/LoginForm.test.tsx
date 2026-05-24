import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { LoginForm } from '../components/LoginForm'

const mockOnLogin = vi.fn()

const renderLoginForm = (healthStatus = 'healthy') => {
  return render(<LoginForm onLogin={mockOnLogin} healthStatus={healthStatus} />)
}

describe('LoginForm', () => {
  beforeEach(() => {
    mockOnLogin.mockClear()
  })

  it('renders the login form with all fields', () => {
    renderLoginForm()

    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('displays the API health status', () => {
    renderLoginForm('healthy')
    expect(screen.getByText(/api status: healthy/i)).toBeInTheDocument()
  })

  it('displays unhealthy API status warning', () => {
    renderLoginForm('unhealthy')
    expect(screen.getByText(/api status: unhealthy/i)).toBeInTheDocument()
    expect(screen.getByText(/api is currently unhealthy/i)).toBeInTheDocument()
  })

  it('disables submit button when API is not healthy', () => {
    renderLoginForm('unhealthy')
    const submitButton = screen.getByRole('button', { name: /sign in/i })
    expect(submitButton).toBeDisabled()
  })

  it('enables submit button when API is healthy', () => {
    renderLoginForm('healthy')
    const submitButton = screen.getByRole('button', { name: /sign in/i })
    expect(submitButton).not.toBeDisabled()
  })

  it('shows email validation error when submitting empty email', async () => {
    renderLoginForm()
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument()
    })
  })

  it('shows invalid email format error', async () => {
    renderLoginForm()
    // Use an email that passes jsdom's type="email" sanitization (has local@domain)
    // but fails the react-hook-form regex which requires TLD of 2+ chars
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'test@test.c' },
    })
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(screen.getByText(/invalid email address/i)).toBeInTheDocument()
    })
  })

  it('shows password validation error when submitting empty password', async () => {
    renderLoginForm()
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'test@example.com' },
    })
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(screen.getByText(/password is required/i)).toBeInTheDocument()
    })
  })

  it('shows password too short error', async () => {
    renderLoginForm()
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'test@example.com' },
    })
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: '123' },
    })
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(
        screen.getByText(/password must be at least 6 characters/i),
      ).toBeInTheDocument()
    })
  })

  it('calls onLogin with correct credentials on valid submit', async () => {
    mockOnLogin.mockResolvedValueOnce(undefined)
    renderLoginForm()

    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'user@example.com' },
    })
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' },
    })
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(mockOnLogin).toHaveBeenCalledWith(
        'user@example.com',
        'password123',
      )
    })
  })

  it('shows error message when login fails', async () => {
    mockOnLogin.mockRejectedValueOnce(new Error('Invalid credentials'))
    renderLoginForm()

    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'user@example.com' },
    })
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'wrongpassword' },
    })
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument()
    })
  })

  it('toggles demo credentials panel visibility', () => {
    renderLoginForm()
    const demoButton = screen.getByRole('button', { name: /demo credentials/i })

    expect(screen.queryByText(/for demo purposes/i)).not.toBeInTheDocument()
    fireEvent.click(demoButton)
    expect(screen.getByText(/for demo purposes/i)).toBeInTheDocument()
    fireEvent.click(demoButton)
    expect(screen.queryByText(/for demo purposes/i)).not.toBeInTheDocument()
  })

  it('fills in demo credentials when clicking Use Demo Login', () => {
    renderLoginForm()
    fireEvent.click(screen.getByRole('button', { name: /demo credentials/i }))
    fireEvent.click(screen.getByRole('button', { name: /use demo login/i }))

    expect(
      (screen.getByLabelText(/email address/i) as HTMLInputElement).value,
    ).toBe('demo@taskmanager.com')
    expect((screen.getByLabelText(/password/i) as HTMLInputElement).value).toBe(
      'demo123',
    )
  })
})
