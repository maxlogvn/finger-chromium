import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PluginError } from '@src/plugin/errors'

const mockCdpClient = vi.hoisted(() => ({
  Browser: {
    getWindowForTarget: vi.fn(),
    setWindowBounds: vi.fn(),
  },
  Runtime: {
    evaluate: vi.fn(),
  },
  close: vi.fn(),
}))

vi.mock('chrome-remote-interface', () => ({
  default: vi.fn(),
}))

vi.mock('debug', () => ({
  default: vi.fn(() => vi.fn()),
}))

const { setViewport, getViewport, MAX_RESIZE_RETRIES } = await import('@src/plugin/browser')

async function resetMocks() {
  const mod = await import('chrome-remote-interface')
  ;(mod.default as unknown as ReturnType<typeof vi.fn>).mockImplementation(() => mockCdpClient)
  mockCdpClient.Browser.getWindowForTarget.mockResolvedValue({ windowId: 42 })
  mockCdpClient.Browser.setWindowBounds.mockResolvedValue({})
  mockCdpClient.Runtime.evaluate.mockResolvedValue({ result: { value: { width: 800, height: 600 } } })
  mockCdpClient.close.mockReturnThis()
}

describe('MAX_RESIZE_RETRIES', () => {
  it('la hang so 3', () => {
    expect(MAX_RESIZE_RETRIES).toBe(3)
  })
})

describe('setViewport', () => {
  const fakeBrowser = { process: {}, port: 0, close: vi.fn(), configure: vi.fn() } as any

  beforeEach(async () => {
    vi.clearAllMocks()
    await resetMocks()
  })

  it('ket noi CDP va lay windowId', async () => {
    mockCdpClient.Runtime.evaluate.mockResolvedValue({ result: { value: { width: 800, height: 600 } } })
    await setViewport(fakeBrowser, { width: 800, height: 600 })
    expect(mockCdpClient.Browser.getWindowForTarget).toHaveBeenCalled()
  })

  it('set window bounds voi DEFAULT_DIFF', async () => {
    mockCdpClient.Runtime.evaluate.mockResolvedValue({ result: { value: { width: 1024, height: 768 } } })
    await setViewport(fakeBrowser, { width: 1024, height: 768 })
    expect(mockCdpClient.Browser.setWindowBounds).toHaveBeenCalledWith({
      windowId: 42,
      bounds: { width: 1040, height: 856 },
    })
  })

  it('su dung diff tu custom options', async () => {
    mockCdpClient.Runtime.evaluate.mockResolvedValue({ result: { value: { width: 800, height: 600 } } })
    await setViewport(fakeBrowser, { width: 800, height: 600, diff: { width: 10, height: 20 } })
    expect(mockCdpClient.Browser.setWindowBounds).toHaveBeenCalledWith({
      windowId: 42,
      bounds: { width: 810, height: 620 },
    })
  })

  it('thanh cong ngay lan dau neu viewport khop', async () => {
    mockCdpClient.Runtime.evaluate.mockResolvedValue({ result: { value: { width: 800, height: 600 } } })
    await expect(setViewport(fakeBrowser, { width: 800, height: 600 })).resolves.toBeUndefined()
    expect(mockCdpClient.Browser.setWindowBounds).toHaveBeenCalledTimes(1)
  })

  it('retry khi viewport khong khop', async () => {
    mockCdpClient.Runtime.evaluate
      .mockResolvedValueOnce({ result: { value: {} } })
      .mockResolvedValueOnce({ result: { value: {} } })
      .mockResolvedValueOnce({ result: { value: { width: 800, height: 600 } } })

    await setViewport(fakeBrowser, { width: 800, height: 600 })
    expect(mockCdpClient.Browser.setWindowBounds).toHaveBeenCalledTimes(2)
  })

  it('throw PluginError khi viewport khong bao gio khop', async () => {
    mockCdpClient.Runtime.evaluate.mockResolvedValue({ result: { value: { width: 100, height: 100 } } })
    await expect(setViewport(fakeBrowser, { width: 800, height: 600 })).rejects.toThrow(PluginError)
    expect(mockCdpClient.Browser.setWindowBounds).toHaveBeenCalledTimes(MAX_RESIZE_RETRIES)
  })

  it('throw PluginError khi connect CDP that bai', async () => {
    const mod = await import('chrome-remote-interface')
    ;(mod.default as unknown as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('CDP connection refused'))

    await expect(setViewport(fakeBrowser, { width: 800, height: 600 })).rejects.toThrow(PluginError)
  })

  it('close CDP connection khi getWindowForTarget that bai', async () => {
    mockCdpClient.Browser.getWindowForTarget.mockRejectedValue(new Error('Target not found'))

    await expect(setViewport(fakeBrowser, { width: 800, height: 600 })).rejects.toThrow(PluginError)
    expect(mockCdpClient.close).toHaveBeenCalled()
  })

  it('close CDP connection khi setWindowBounds that bai', async () => {
    mockCdpClient.Browser.setWindowBounds.mockRejectedValue(new Error('Invalid window'))

    await expect(setViewport(fakeBrowser, { width: 800, height: 600 })).rejects.toThrow(PluginError)
    expect(mockCdpClient.close).toHaveBeenCalled()
  })

  it('close CDP connection sau khi thanh cong', async () => {
    mockCdpClient.Runtime.evaluate.mockResolvedValue({ result: { value: { width: 800, height: 600 } } })
    await setViewport(fakeBrowser, { width: 800, height: 600 })
    expect(mockCdpClient.close).toHaveBeenCalled()
  })
})

describe('getViewport', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    mockCdpClient.Runtime.evaluate.mockReset()
  })

  it('goi Runtime.evaluate va tra ve width/height', async () => {
    mockCdpClient.Runtime.evaluate.mockResolvedValue({ result: { value: { width: 1920, height: 1080 } } })

    const result = await getViewport(mockCdpClient as any)
    expect(mockCdpClient.Runtime.evaluate).toHaveBeenCalledWith({
      expression: expect.stringContaining('innerWidth'),
      returnByValue: true,
    })
    expect(result).toEqual({ width: 1920, height: 1080 })
  })

  it('throw PluginError khi Runtime.evaluate that bai', async () => {
    mockCdpClient.Runtime.evaluate.mockRejectedValue(new Error('Execution failed'))

    await expect(getViewport(mockCdpClient as any)).rejects.toThrow(PluginError)
  })
})
