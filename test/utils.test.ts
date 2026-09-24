import { describe, expect, it } from 'vitest'
import { genId, hashString } from '../src/utils/hash'
import { normalizeQueryParam } from '../src/utils/params'

const allowed = ['realtime', 'day', 'week', 'month']

describe('normalizeQueryParam', () => {
  it('keeps valid values', () => {
    expect(normalizeQueryParam('week', allowed, 'realtime')).toBe('week')
    expect(normalizeQueryParam('realtime', allowed, 'realtime')).toBe('realtime')
  })

  it('falls back for unknown values', () => {
    expect(normalizeQueryParam('year', allowed, 'realtime')).toBe('realtime')
    expect(normalizeQueryParam('cat', allowed, 'realtime')).toBe('realtime')
  })

  it('falls back for empty string', () => {
    expect(normalizeQueryParam('', allowed, 'realtime')).toBe('realtime')
  })

  it('falls back for non-string values', () => {
    expect(normalizeQueryParam(undefined, allowed, 'realtime')).toBe('realtime')
    expect(normalizeQueryParam(null, allowed, 'realtime')).toBe('realtime')
    expect(normalizeQueryParam(['day'], allowed, 'realtime')).toBe('realtime')
    expect(normalizeQueryParam(42, allowed, 'realtime')).toBe('realtime')
  })
})

describe('hashString', () => {
  it('is deterministic', () => {
    expect(hashString('abc')).toBe(hashString('abc'))
    expect(hashString('今日快讯')).toBe(hashString('今日快讯'))
  })

  it('returns non-negative numbers', () => {
    expect(hashString('')).toBe(0)
    expect(hashString('anything')).toBeGreaterThanOrEqual(0)
  })

  it('distributes different inputs', () => {
    expect(hashString('n01')).not.toBe(hashString('n02'))
  })
})

describe('genId', () => {
  it('respects the prefix and stays unique', () => {
    const a = genId('n')
    const b = genId('n')
    expect(a.startsWith('n')).toBe(true)
    expect(a).not.toBe(b)
    expect(genId('cat').startsWith('cat')).toBe(true)
  })
})
