import { describe, it, expect } from 'vitest'

describe('Simple Test', () => {
  it('should pass', () => {
    expect(1 + 1).toBe(2)
  })

  it('should test a simple function', () => {
    function add(a: number, b: number): number {
      return a + b
    }

    expect(add(2, 3)).toBe(5)
    expect(add(-1, 1)).toBe(0)
  })
})
