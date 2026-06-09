import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const { mockTimerClear } = vi.hoisted(() => {
  let currentClear: ReturnType<typeof vi.fn> = vi.fn()
  return {
    mockTimerClear: {
      get current() { return currentClear },
      set current(v: ReturnType<typeof vi.fn>) { currentClear = v },
    },
  }
})

vi.mock('once', () => ({
  default: vi.fn((fn: () => void) => fn),
}))

vi.mock('../../../../src/common/timer', () => ({
  createTimer: vi.fn(() => {
    const clear = vi.fn()
    mockTimerClear.current = clear
    return {
      promise: new Promise<void>(() => {}),
      clear,
    }
  }),
}))

const { notify } = await import('@src/plugin/connector/utils')

describe('notify', () => {
  beforeEach(() => {
    vi.stubEnv('NODE_ENV', 'development')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('tra ve undefined khi co key', () => {
    const result = notify('valid-key')
    expect(result).toBeUndefined()
  })

  it('tra ve timer object khi key la chuoi rong (falsy)', () => {
    const result = notify('')
    expect(result).toBeDefined()
    expect(typeof result!.clear).toBe('function')
  })

  it('tra ve undefined khi NODE_ENV la test', () => {
    vi.stubEnv('NODE_ENV', 'test')
    const result = notify(null)
    expect(result).toBeUndefined()
  })

  it('tra ve object co clear khi khong co key va NODE_ENV khong phai test', () => {
    vi.stubEnv('NODE_ENV', 'production')
    const result = notify(null)
    expect(result).toBeDefined()
    expect(typeof result!.clear).toBe('function')
  })

  it('goi clear khi timer duoc tao', () => {
    vi.stubEnv('NODE_ENV', 'production')
    const result = notify(null)
    expect(typeof result!.clear).toBe('function')
    expect(() => result!.clear()).not.toThrow()
  })

  it('tra ve timer object khi key la undefined (falsy)', () => {
    const result = notify(undefined)
    expect(result).toBeDefined()
    expect(typeof result!.clear).toBe('function')
  })
})
