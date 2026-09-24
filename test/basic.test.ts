import { describe, expect, it, vi } from 'vitest'

describe('hi', () => {
  it('should works', () => {
    expect(1 + 1).toEqual(2)
  })
})

describe('example doubles', () => {
  it('can spin up mocked functions', () => {
    const fn = vi.fn(() => 'ok')
    expect(fn()).toBe('ok')
    expect(fn).toHaveBeenCalledTimes(1)
  })
})
