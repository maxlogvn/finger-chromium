import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PluginError } from '@src/plugin/errors'

vi.mock('compare-versions', () => ({
  compare: vi.fn((a: string, b: string, op: string) => {
    if (op === '<') {
      const [majorA, minorA, patchA = 0] = a.split('.').map(Number)
      const [majorB, minorB, patchB = 0] = b.split('.').map(Number)
      if (majorA !== majorB) return majorA < majorB
      if (minorA !== minorB) return minorA < minorB
      return patchA < patchB
    }
    return false
  }),
}))

const mockRequire = vi.fn()
vi.mock('module', () => ({
  createRequire: () => mockRequire,
}))

const { default: Loader } = await import('@src/loader/index')

describe('Loader.import', () => {
  beforeEach(() => {
    mockRequire.mockReset()
  })

  it('trả về module nếu tìm thấy package', () => {
    mockRequire.mockImplementation((id: string) => {
      if (id === 'playwright-core') return { chromium: 'chromium-mock' }
      if (id === 'playwright-core/package.json') return { version: '1.40.0' }
      throw new Error('not found')
    })
    const result = Loader.import(['playwright-core'])
    expect(result).toBeDefined()
    expect(result![0]).toEqual({ chromium: 'chromium-mock' })
    expect(result![1]).toBe('1.40.0')
  })

  it('thử từng package cho đến khi tìm thấy', () => {
    let callCount = 0
    mockRequire.mockImplementation((id: string) => {
      callCount++
      if (id === 'playwright/package.json') return { version: '1.50.0' }
      if (id === 'playwright') return { chromium: 'chromium-v2' }
      throw new Error('not found')
    })
    const result = Loader.import(['playwright-core', 'playwright'])
    expect(callCount).toBe(3)
    expect(result![0]).toEqual({ chromium: 'chromium-v2' })
    expect(result![1]).toBe('1.50.0')
  })

  it('ném lỗi nếu không tìm thấy package nào', () => {
    mockRequire.mockImplementation(() => { throw new Error('MODULE_NOT_FOUND') })
    expect(() => Loader.import(['playwright-core', 'playwright'])).toThrow(PluginError)
  })

  it('ném lỗi với message chứa danh sách packages', () => {
    mockRequire.mockImplementation(() => { throw new Error('not found') })
    expect(() => Loader.import(['pkg-a', 'pkg-b'])).toThrow('pkg-a')
    expect(() => Loader.import(['pkg-a', 'pkg-b'])).toThrow('pkg-b')
  })

  it('trả về undefined nếu packages rỗng', () => {
    const result = Loader.import([])
    expect(result).toBeUndefined()
  })
})

describe('Loader instance', () => {
  let loader: InstanceType<typeof Loader>

  beforeEach(() => {
    mockRequire.mockReset()
    loader = new Loader('playwright-core', '1.40.0', ['playwright'])
  })

  it('load trả về property từ module', () => {
    mockRequire.mockImplementation((id: string) => {
      if (id === 'playwright-core') return { chromium: 'chromium-mock' }
      if (id === 'playwright-core/package.json') return { version: '1.50.0' }
      throw new Error('not found')
    })
    const result = loader.load('chromium')
    expect(result).toBe('chromium-mock')
    expect(mockRequire).toHaveBeenCalledWith('playwright-core')
    expect(mockRequire).toHaveBeenCalledWith('playwright-core/package.json')
  })

  it('load trả về module nếu property không tồn tại', () => {
    mockRequire.mockImplementation((id: string) => {
      if (id === 'playwright-core') return { chromium: 'chromium-mock' }
      if (id === 'playwright-core/package.json') return { version: '1.50.0' }
      throw new Error('not found')
    })
    const result = loader.load('nonexistent')
    expect(result).toEqual({ chromium: 'chromium-mock' })
  })

  it('ném lỗi nếu version thấp hơn yêu cầu', () => {
    mockRequire.mockImplementation((id: string) => {
      if (id === 'playwright-core') return { chromium: 'chromium-mock' }
      if (id === 'playwright-core/package.json') return { version: '1.20.0' }
      throw new Error('not found')
    })
    expect(() => loader.load('chromium')).toThrow(PluginError)
  })

  it('ném lỗi nếu không thể require package nào', () => {
    mockRequire.mockImplementation(() => { throw new Error('MODULE_NOT_FOUND') })
    expect(() => loader.load('chromium')).toThrow(PluginError)
  })
})

describe('Loader load không version check', () => {
  beforeEach(() => {
    mockRequire.mockReset()
  })

  it('bỏ qua version check nếu version rỗng', () => {
    mockRequire.mockImplementation((id: string) => {
      if (id === 'playwright-core') return { chromium: 'chromium-mock' }
      if (id === 'playwright-core/package.json') return { version: '0.1.0' }
      throw new Error('not found')
    })
    const loader = new Loader('playwright-core', '', [])
    const result = loader.load('chromium')
    expect(result).toBe('chromium-mock')
  })

  it('bỏ qua version check nếu target version rỗng', () => {
    mockRequire.mockImplementation((id: string) => {
      if (id === 'playwright-core') return { chromium: 'chromium-mock' }
      if (id === 'playwright-core/package.json') return { version: '0.1.0' }
      throw new Error('not found')
    })
    const loader = new Loader('playwright-core', '', [])
    const result = loader.load()
    expect(result).toBe('chromium-mock')
  })
})
