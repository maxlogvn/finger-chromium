import { describe, it, expect, vi } from 'vitest'

const mockLoader = vi.fn()
vi.mock('../../../../src/loader', () => ({
  default: class {
    constructor(target: string, version: string, packages: string[]) {
      mockLoader(target, version, packages)
    }
    load = vi.fn()
  },
}))

const { default: defaultLoader } = await import('@src/adapter/playwright/loader')

describe('playwright loader singleton', () => {
  it('khởi tạo Loader với target là playwright', () => {
    expect(mockLoader).toHaveBeenCalledWith('playwright', '1.27.1', ['playwright-core'])
  })

  it('default export có method load', () => {
    expect(defaultLoader).toHaveProperty('load')
    expect(typeof defaultLoader.load).toBe('function')
  })

  it('load có thể gọi được', () => {
    expect(() => defaultLoader.load()).not.toThrow()
  })
})
