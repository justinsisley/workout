import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import WorkoutErrorBoundary from '@/components/workout/workout-error-boundary'
import { useRouter } from 'next/navigation'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}))

// Mock child component that throws errors
const ThrowError = ({ shouldThrow, errorType }: { shouldThrow: boolean; errorType?: string }) => {
  if (shouldThrow) {
    throw new Error(errorType || 'Test error')
  }
  return <div data-testid="child-component">Child component</div>
}

const mockPush = vi.fn()
const mockRouter = {
  push: mockPush,
  back: vi.fn(),
  forward: vi.fn(),
  refresh: vi.fn(),
  replace: vi.fn(),
  prefetch: vi.fn(),
}

describe('WorkoutErrorBoundary', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useRouter).mockReturnValue(mockRouter)

    // Mock console.error to avoid noise in test output
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders children when no error occurs', () => {
    render(
      <WorkoutErrorBoundary>
        <ThrowError shouldThrow={false} />
      </WorkoutErrorBoundary>,
    )

    expect(screen.getByTestId('child-component')).toBeInTheDocument()
  })

  it('catches and displays error with default error type', () => {
    render(
      <WorkoutErrorBoundary>
        <ThrowError shouldThrow={true} />
      </WorkoutErrorBoundary>,
    )

    expect(screen.getByText('Workout Error')).toBeInTheDocument()
    expect(
      screen.getByText('Something went wrong during your workout session.'),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
  })

  it('displays progression-specific error message', () => {
    render(
      <WorkoutErrorBoundary errorType="progression">
        <ThrowError shouldThrow={true} />
      </WorkoutErrorBoundary>,
    )

    expect(screen.getByText('Workout Progression Error')).toBeInTheDocument()
    expect(
      screen.getByText(
        'Unable to advance your workout progress. Your current exercise data has been saved.',
      ),
    ).toBeInTheDocument()
  })

  it('displays data-specific error message', () => {
    render(
      <WorkoutErrorBoundary errorType="data">
        <ThrowError shouldThrow={true} />
      </WorkoutErrorBoundary>,
    )

    expect(screen.getByText('Data Sync Error')).toBeInTheDocument()
    expect(
      screen.getByText("Unable to save your workout data. We'll keep trying in the background."),
    ).toBeInTheDocument()
  })

  it('displays exercise-specific error message', () => {
    render(
      <WorkoutErrorBoundary errorType="exercise">
        <ThrowError shouldThrow={true} />
      </WorkoutErrorBoundary>,
    )

    expect(screen.getByText('Exercise Loading Error')).toBeInTheDocument()
    expect(
      screen.getByText(
        'Unable to load exercise details. Please check your connection and try again.',
      ),
    ).toBeInTheDocument()
  })

  it('calls onError callback when error occurs', () => {
    const onError = vi.fn()

    render(
      <WorkoutErrorBoundary onError={onError}>
        <ThrowError shouldThrow={true} errorType="Test callback error" />
      </WorkoutErrorBoundary>,
    )

    expect(onError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        componentStack: expect.any(String),
      }),
    )
  })

  it('handles retry functionality with exponential backoff', async () => {
    vi.useFakeTimers()

    const { rerender } = render(
      <WorkoutErrorBoundary maxRetries={2}>
        <ThrowError shouldThrow={true} />
      </WorkoutErrorBoundary>,
    )

    // First retry - should work immediately
    fireEvent.click(screen.getByRole('button', { name: /try again/i }))

    // Wait for the timeout (1 second for first retry)
    vi.advanceTimersByTime(1000)

    rerender(
      <WorkoutErrorBoundary maxRetries={2}>
        <ThrowError shouldThrow={false} />
      </WorkoutErrorBoundary>,
    )

    await waitFor(() => {
      expect(screen.getByTestId('child-component')).toBeInTheDocument()
    })

    vi.useRealTimers()
  })

  it('disables retry button after max retries', () => {
    const { rerender } = render(
      <WorkoutErrorBoundary maxRetries={1}>
        <ThrowError shouldThrow={true} />
      </WorkoutErrorBoundary>,
    )

    // Click retry once
    fireEvent.click(screen.getByRole('button', { name: /try again/i }))

    // Component still throws error
    rerender(
      <WorkoutErrorBoundary maxRetries={1}>
        <ThrowError shouldThrow={true} />
      </WorkoutErrorBoundary>,
    )

    // After max retries, button should be disabled/hidden
    expect(screen.queryByRole('button', { name: /try again/i })).not.toBeInTheDocument()
  })

  it('navigates to dashboard when dashboard button is clicked', () => {
    render(
      <WorkoutErrorBoundary>
        <ThrowError shouldThrow={true} />
      </WorkoutErrorBoundary>,
    )

    fireEvent.click(screen.getByRole('button', { name: /dashboard/i }))
    expect(mockPush).toHaveBeenCalledWith('/workout/dashboard')
  })

  it('navigates to home when home button is clicked', () => {
    render(
      <WorkoutErrorBoundary>
        <ThrowError shouldThrow={true} />
      </WorkoutErrorBoundary>,
    )

    fireEvent.click(screen.getByRole('button', { name: /home/i }))
    expect(mockPush).toHaveBeenCalledWith('/')
  })

  it('resets error state when reset button is clicked', () => {
    const { rerender } = render(
      <WorkoutErrorBoundary>
        <ThrowError shouldThrow={true} />
      </WorkoutErrorBoundary>,
    )

    expect(screen.getByText('Workout Error')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /reset/i }))

    // After reset, should render children without error
    rerender(
      <WorkoutErrorBoundary>
        <ThrowError shouldThrow={false} />
      </WorkoutErrorBoundary>,
    )

    expect(screen.getByTestId('child-component')).toBeInTheDocument()
  })

  it('uses custom fallback component when provided', () => {
    const customFallback = (error: Error, retry: () => void, retryCount: number) => (
      <div data-testid="custom-fallback">
        Custom fallback: {error.message}, attempts: {retryCount}
        <button onClick={retry}>Custom retry</button>
      </div>
    )

    render(
      <WorkoutErrorBoundary fallback={customFallback}>
        <ThrowError shouldThrow={true} errorType="Custom error" />
      </WorkoutErrorBoundary>,
    )

    expect(screen.getByTestId('custom-fallback')).toBeInTheDocument()
    expect(screen.getByText('Custom fallback: Custom error, attempts: 0')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /custom retry/i })).toBeInTheDocument()
  })

  it('displays error ID when available', () => {
    const errorWithDigest = new Error('Test error')
    ;(errorWithDigest as any).digest = 'error-123'

    render(
      <WorkoutErrorBoundary>
        <div>
          {(() => {
            throw errorWithDigest
          })()}
        </div>
      </WorkoutErrorBoundary>,
    )

    expect(screen.getByText('Error ID: error-123')).toBeInTheDocument()
  })

  it('shows retry count when retrying', async () => {
    vi.useFakeTimers()

    render(
      <WorkoutErrorBoundary maxRetries={3}>
        <ThrowError shouldThrow={true} />
      </WorkoutErrorBoundary>,
    )

    // First retry
    fireEvent.click(screen.getByRole('button', { name: /try again/i }))
    vi.advanceTimersByTime(1000)

    expect(screen.getByText('Retry attempt 1 of 3')).toBeInTheDocument()

    vi.useRealTimers()
  })

  it('cleans up timeouts on unmount', () => {
    const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout')

    const { unmount } = render(
      <WorkoutErrorBoundary>
        <ThrowError shouldThrow={true} />
      </WorkoutErrorBoundary>,
    )

    // Trigger a retry to create a timeout
    fireEvent.click(screen.getByRole('button', { name: /try again/i }))

    unmount()

    expect(clearTimeoutSpy).toHaveBeenCalled()
    clearTimeoutSpy.mockRestore()
  })
})
