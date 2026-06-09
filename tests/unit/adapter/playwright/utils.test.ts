import { describe, it, expect, vi, beforeEach } from 'vitest'
import { isBrowser, onClose, collectErrors, bindHooks } from '@src/adapter/playwright/utils'

describe('collectErrors', () => {
  it('trả về mảng rỗng nếu tất cả steps thành công', async () => {
    const result = await collectErrors(
      ['step1', () => 'ok'],
      ['step2', () => 42],
    )
    expect(result).toEqual([])
  })

  it('thu thập lỗi từ các steps bị lỗi', async () => {
    const result = await collectErrors(
      ['step1', () => { throw new Error('Lỗi 1') }],
      ['step2', () => 'ok'],
      ['step3', () => { throw new Error('Lỗi 2') }],
    )
    expect(result).toHaveLength(2)
    expect(result[0]).toContain('step1')
    expect(result[0]).toContain('Lỗi 1')
    expect(result[1]).toContain('step3')
    expect(result[1]).toContain('Lỗi 2')
  })

  it('tiếp tục xử lý step sau khi gặp lỗi', async () => {
    const results: number[] = []
    await collectErrors(
      ['step1', () => { throw new Error('fail') }],
      ['step2', () => { results.push(2) }],
    )
    expect(results).toEqual([2])
  })

  it('xử lý async function', async () => {
    const result = await collectErrors(
      ['async-step', async () => { throw new Error('Async error') }],
    )
    expect(result).toHaveLength(1)
    expect(result[0]).toContain('Async error')
  })

  it('trả về mảng rỗng nếu không có step nào', async () => {
    const result = await collectErrors()
    expect(result).toEqual([])
  })
})

describe('isBrowser', () => {
  it('trả về true cho object Browser-like', () => {
    const fakeBrowser = {
      isConnected: true,
      contexts: [],
      version: () => '1.0',
    }
    expect(isBrowser(fakeBrowser)).toBe(true)
  })

  it('version phải là function', () => {
    const fakeBrowser = {
      isConnected: true,
      contexts: [],
      version: () => '1.0',
    }
    expect(isBrowser(fakeBrowser)).toBe(true)
  })

  it('trả về false cho object thiếu isConnected', () => {
    expect(isBrowser({ contexts: [], version: () => '1.0' })).toBe(false)
  })

  it('trả về false cho null', () => {
    expect(isBrowser(null)).toBe(false)
  })

  it('trả về false cho undefined', () => {
    expect(isBrowser(undefined)).toBe(false)
  })

  it('trả về false cho primitive', () => {
    expect(isBrowser('browser')).toBe(false)
    expect(isBrowser(123)).toBe(false)
    expect(isBrowser(true)).toBe(false)
  })

  it('trả về false cho object rỗng', () => {
    expect(isBrowser({})).toBe(false)
  })
})

describe('onClose', () => {
  it('đăng ký disconnected listener cho Browser target', () => {
    const listeners: Record<string, () => void> = {}
    const fakeBrowser = {
      isConnected: true,
      contexts: [],
      version: () => '1.0',
      once: vi.fn((event: string, fn: () => void) => {
        listeners[event] = fn
      }),
    }
    const listener = () => {}
    onClose(fakeBrowser as any, listener)
    expect(fakeBrowser.once).toHaveBeenCalledWith('disconnected', listener)
  })

  it('đăng ký close listener cho BrowserContext target', () => {
    const listeners: Record<string, () => void> = {}
    const fakeContext = {
      once: vi.fn((event: string, fn: () => void) => {
        listeners[event] = fn
      }),
    }
    const listener = () => {}
    onClose(fakeContext as any, listener)
    expect(fakeContext.once).toHaveBeenCalledWith('close', listener)
  })
})

describe('bindHooks', () => {
  let consoleWarn: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  it('wrap newContext của Browser target với Proxy', () => {
    const originalNewContext = vi.fn()
    const fakeBrowser = {
      isConnected: true,
      contexts: [],
      version: () => '1.0',
      newContext: originalNewContext,
    }
    bindHooks(fakeBrowser as any)
    expect(fakeBrowser.newContext).not.toBe(originalNewContext)
  })

  it('gọi newContext qua Proxy và context.newPage được wrap', async () => {
    const originalNewPage = vi.fn().mockResolvedValue({ setViewportSize: vi.fn() })
    const originalNewContext = vi.fn().mockResolvedValue({ newPage: originalNewPage })
    const fakeBrowser = {
      isConnected: true,
      contexts: [],
      version: () => '1.0',
      newContext: originalNewContext,
    }
    bindHooks(fakeBrowser as any)
    const ctx = await fakeBrowser.newContext({ viewport: { width: 800, height: 600 } })
    expect(ctx.newPage).not.toBe(originalNewPage)
    expect(originalNewContext).toHaveBeenCalled()
  })

  it('reset viewport thành null khi tạo context', async () => {
    const originalNewContext = vi.fn((opts: any) => Promise.resolve({ newPage: vi.fn() }))
    const fakeBrowser = {
      isConnected: true,
      contexts: [],
      version: () => '1.0',
      newContext: originalNewContext,
    }
    bindHooks(fakeBrowser as any)
    await fakeBrowser.newContext({ headless: true })
    expect(originalNewContext).toHaveBeenCalledWith({ headless: true, viewport: null })
  })

  it('gọi hooks.onPageCreated khi tạo page mới', async () => {
    const onPageCreated = vi.fn()
    const fakePage = { setViewportSize: vi.fn() }
    const originalNewPage = vi.fn().mockResolvedValue(fakePage)
    const originalNewContext = vi.fn().mockResolvedValue({ newPage: originalNewPage })
    const fakeBrowser = {
      isConnected: true,
      contexts: [],
      version: () => '1.0',
      newContext: originalNewContext,
    }
    bindHooks(fakeBrowser as any, { onPageCreated })
    const ctx = await fakeBrowser.newContext()
    const page = await ctx.newPage()
    expect(onPageCreated).toHaveBeenCalledWith(page)
  })

  it('page.setViewportSize bị vô hiệu hoá sau bindHooks', async () => {
    const originalSetViewportSize = vi.fn()
    const fakePage = { setViewportSize: originalSetViewportSize }
    const originalNewPage = vi.fn().mockResolvedValue(fakePage)
    const originalNewContext = vi.fn().mockResolvedValue({ newPage: originalNewPage })
    const fakeBrowser = {
      isConnected: true,
      contexts: [],
      version: () => '1.0',
      newContext: originalNewContext,
    }
    bindHooks(fakeBrowser as any)
    const ctx = await fakeBrowser.newContext()
    const page = await ctx.newPage()
    page.setViewportSize({ width: 200, height: 100 })
    expect(originalSetViewportSize).not.toHaveBeenCalled()
    expect(consoleWarn).toHaveBeenCalled()
  })

  it('patchContext trực tiếp nếu target là BrowserContext không có newContext', async () => {
    const originalNewPage = vi.fn().mockResolvedValue({ setViewportSize: vi.fn() })
    const fakeContext = { newPage: originalNewPage }
    bindHooks(fakeContext as any)
    expect(fakeContext.newPage).not.toBe(originalNewPage)
    const page = await fakeContext.newPage()
    expect(page).toHaveProperty('setViewportSize')
  })
})
