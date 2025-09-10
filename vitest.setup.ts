// Any setup scripts you might need go here

// Load .env files
import 'dotenv/config'

// Add jest-dom matchers
import '@testing-library/jest-dom'

// Mock CSS imports for vitest
Object.defineProperty(require, 'extensions', {
  value: {
    '.css': () => ({}),
    '.scss': () => ({}),
    '.sass': () => ({}),
  },
  writable: false,
})

// Mock CSS modules
import { vi } from 'vitest'

vi.mock('*.css', () => ({}))
vi.mock('*.scss', () => ({}))
vi.mock('*.sass', () => ({}))
