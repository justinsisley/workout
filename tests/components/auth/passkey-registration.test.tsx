import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

import { PasskeyRegistration } from '@/components/auth/passkey-registration'

// Mock the auth actions
vi.mock('@/actions/auth', () => ({
  checkUsernameAvailability: vi.fn(),
  generatePasskeyRegistrationOptions: vi.fn(),
  verifyPasskeyRegistration: vi.fn(),
}))

// Mock the WebAuthN browser API
vi.mock('@simplewebauthn/browser', () => ({
  startRegistration: vi.fn(),
  browserSupportsWebAuthn: vi.fn(() => true),
}))

describe('PasskeyRegistration', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Mock browser environment to support passkeys
    Object.defineProperty(window, 'isSecureContext', {
      value: true,
      writable: true,
    })

    Object.defineProperty(navigator, 'credentials', {
      value: {
        create: vi.fn(),
        get: vi.fn(),
      },
      writable: true,
    })
  })

  it('renders username input form', () => {
    render(<PasskeyRegistration />)

    expect(screen.getByText('Create Your Account')).toBeInTheDocument()
    expect(screen.getByLabelText('Username')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /create account with passkey/i })).toBeInTheDocument()
  })

  it('validates username input', async () => {
    render(<PasskeyRegistration />)

    const usernameInput = screen.getByLabelText('Username')
    const submitButton = screen.getByRole('button', { name: /create account with passkey/i })

    // Test empty input
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Username must be at least 3 characters')).toBeInTheDocument()
    })

    // Test short username
    fireEvent.change(usernameInput, { target: { value: 'ab' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Username must be at least 3 characters')).toBeInTheDocument()
    })

    // Test invalid characters
    fireEvent.change(usernameInput, { target: { value: 'test@user' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(
        screen.getByText('Username can only contain letters, numbers, underscores, and hyphens'),
      ).toBeInTheDocument()
    })
  })

  it('shows mobile-optimized interface elements', () => {
    render(<PasskeyRegistration />)

    const usernameInput = screen.getByLabelText('Username')
    const submitButton = screen.getByRole('button', { name: /create account with passkey/i })
    const card = screen.getByText('Create Your Account').closest('.border')

    // Check for mobile-friendly classes
    expect(usernameInput).toHaveClass('text-base') // Better for mobile
    expect(submitButton).toHaveClass('w-full') // Full width button
    expect(card).toHaveClass('max-w-md') // Responsive card width
  })

  it('shows passkey guidance text', () => {
    render(<PasskeyRegistration />)

    expect(screen.getByText(/your device will prompt you to create a passkey/i)).toBeInTheDocument()
  })

  it('handles registration completion', () => {
    const mockOnComplete = vi.fn()
    render(<PasskeyRegistration onRegistrationComplete={mockOnComplete} />)

    // Component should render without errors when onRegistrationComplete is provided
    expect(screen.getByText('Create Your Account')).toBeInTheDocument()
  })
})
