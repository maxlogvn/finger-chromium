import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest'

const mockNativeModule = { create: vi.fn(), close: vi.fn() }

vi.mock('../../../../src/plugin/utils', () => ({
  resolvePackageRoot: () => '/fake/package/root',
}))

const mockRequire = vi.fn()
vi.mock('module', () => ({
  createRequire: () => mockRequire,
}))

let mutex: typeof import('../../../../src/plugin/mutex')

beforeAll(async () => {
  mockRequire.mockImplementation((p: string) => {
    if (p.endsWith('.node')) return mockNativeModule
    if (p.endsWith('package.json') || p.includes('package.json')) {
      return { name: 'fingerprint-chromium-engine' }
    }
    throw new Error('MODULE_NOT_FOUND')
  })

  mutex = await import('../../../../src/plugin/mutex')
})

describe('mutex module', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('exports default là native module', () => {
    expect(mutex.default).toBe(mockNativeModule)
  })

  it('exports create và release là functions', () => {
    expect(typeof mutex.create).toBe('function')
    expect(typeof mutex.release).toBe('function')
  })

  it('create gọi native module create', () => {
    mutex.create('BASProcess456')
    expect(mockNativeModule.create).toHaveBeenCalledWith('BASProcess456')
  })

  it('release gọi native module close', () => {
    mutex.release('BASProcess789')
    expect(mockNativeModule.close).toHaveBeenCalledWith('BASProcess789')
  })

  it('release có thể gọi nhiều lần', () => {
    mutex.release('m1')
    mutex.release('m2')
    expect(mockNativeModule.close).toHaveBeenCalledTimes(2)
  })
})

describe('mutex module without close', () => {
  it('không throw khi native module không có close', async () => {
    const mockNoClose = { create: vi.fn() }

    vi.doMock('module', () => ({
      createRequire: () => (p: string) => {
        if (p.endsWith('.node')) return mockNoClose
        if (p.endsWith('package.json') || p.includes('package.json')) {
          return { name: 'fingerprint-chromium-engine' }
        }
        throw new Error('MODULE_NOT_FOUND')
      },
    }))

    vi.doMock('../../../../src/plugin/utils', () => ({
      resolvePackageRoot: () => '/fake/package/root',
    }))

    const mod = await import('../../../../src/plugin/mutex')
    expect(() => mod.release('test')).not.toThrow()
    expect(mockNoClose.create).toBeDefined()
  })
})
