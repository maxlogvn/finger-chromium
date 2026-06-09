import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockFingerprintConstructor = vi.fn()

vi.mock('../../../../src/plugin', () => ({
  __esModule: true,
  default: class MockFingerprintPlugin {
    _launch = vi.fn().mockResolvedValue({})
    constructor(launcher?: unknown, connector?: unknown) {
      mockFingerprintConstructor(launcher, connector)
    }
    setServiceKey = vi.fn()
    setWorkingFolder = vi.fn()
    useProfile = vi.fn()
    useProxy = vi.fn()
    useFingerprint = vi.fn()
    cleanup = vi.fn()
    fetch = vi.fn()
  },
  BaseLaunchOptions: {},
}))

const mockLoad = vi.fn()
vi.mock('../../../../src/adapter/playwright/loader', () => ({
  __esModule: true,
  default: { load: mockLoad },
}))

const mockBindHooks = vi.fn()
const mockOnClose = vi.fn()
const mockGetViewport = vi.fn()
const mockSetViewport = vi.fn()
vi.mock('../../../../src/adapter/playwright/utils', () => ({
  bindHooks: mockBindHooks,
  getViewport: mockGetViewport,
  onClose: mockOnClose,
  setViewport: mockSetViewport,
}))

const { PlaywrightFingerprintPlugin, IGNORED_ARGUMENTS, UNSUPPORTED_OPTIONS, LAUNCH_FALLBACK_WARNING } = await import('../../../../src/adapter/playwright/bridge')
const { PluginError } = await import('@src/plugin/errors')

describe('PlaywrightFingerprintPlugin', () => {
  let plugin: any

  beforeEach(() => {
    vi.clearAllMocks()
    mockLoad.mockReturnValue({
      launch: vi.fn(),
      launchPersistentContext: vi.fn(),
    })
    plugin = new PlaywrightFingerprintPlugin()
  })

  describe('constructor', () => {
    it('tạo default launcher từ loader khi không truyền đối số', () => {
      expect(mockFingerprintConstructor).toHaveBeenCalledWith(undefined, undefined)
      expect(mockLoad).toHaveBeenCalled()
    })

    it('sử dụng launcher được cung cấp thay vì loader', () => {
      const callsBefore = mockLoad.mock.calls.length
      const fakeLauncher = { launch: vi.fn(), launchPersistentContext: vi.fn() }
      new PlaywrightFingerprintPlugin(fakeLauncher)
      expect(mockLoad.mock.calls.length).toBe(callsBefore)
    })

    it('sử dụng connector được cung cấp', () => {
      const fakeConnector = { api: vi.fn() }
      new PlaywrightFingerprintPlugin(undefined, fakeConnector as any)
      expect(mockFingerprintConstructor).toHaveBeenCalledWith(undefined, fakeConnector)
    })
  })

  describe('launch', () => {
    it('gọi launchPersistentContext với chuỗi rỗng và options', async () => {
      const lpcSpy = vi.spyOn(plugin, 'launchPersistentContext' as any).mockResolvedValue({} as any)
      await plugin.launch({ headless: true })
      expect(lpcSpy).toHaveBeenCalledWith('', { headless: true })
    })

    it('throw PluginError khi truyền unsupported option', async () => {
      await expect(plugin.launch({ proxy: 'http://p:8080' } as any)).rejects.toThrow(PluginError)
    })

    it('throw PluginError cho channel option', async () => {
      await expect(plugin.launch({ channel: 'chrome' } as any)).rejects.toThrow(PluginError)
    })

    it('throw PluginError cho firefoxUserPrefs option', async () => {
      await expect(plugin.launch({ firefoxUserPrefs: {} } as any)).rejects.toThrow(PluginError)
    })

    it('không throw cho options hợp lệ', async () => {
      vi.spyOn(plugin, 'launchPersistentContext' as any).mockResolvedValue({} as any)
      await expect(plugin.launch({ headless: true, args: ['--no-sandbox'] })).resolves.toBeDefined()
    })
  })

  describe('launchPersistentContext', () => {
    it('gọi _launch với useDefaultLauncher=false', async () => {
      await plugin.launchPersistentContext('/tmp/data', { headless: true })
      expect((plugin as any)._launch).toHaveBeenCalledWith(false, expect.objectContaining({
        userDataDir: '/tmp/data',
        viewport: null,
      }))
    })

    it('lọc --user-data-dir khỏi args của launcher', async () => {
      const mockBrowserType = {
        launch: vi.fn(),
        launchPersistentContext: vi.fn().mockResolvedValue({}),
      }
      mockLoad.mockReturnValue(mockBrowserType)
      const p = new PlaywrightFingerprintPlugin()
      await p.launchPersistentContext('/tmp/data', { args: ['--user-data-dir=/custom', '--no-sandbox'] })
      const launchOpts = (p as any)._launch.mock.calls[0][1]
      const innerLauncher = launchOpts.launcher
      await innerLauncher.launch({ args: ['--user-data-dir=/custom', '--no-sandbox'] })
      expect(mockBrowserType.launchPersistentContext).toHaveBeenCalledWith('/tmp/data', expect.objectContaining({
        args: ['--no-sandbox'],
      }))
    })

    it('thêm IGNORED_ARGUMENTS vào ignoreDefaultArgs', async () => {
      await plugin.launchPersistentContext('/tmp/data', { ignoreDefaultArgs: ['--mute-audio'] })
      const launchOpts = (plugin as any)._launch.mock.calls[0][1]
      expect(launchOpts.ignoreDefaultArgs).toContain('--mute-audio')
      expect(launchOpts.ignoreDefaultArgs).toContain('--disable-extensions')
    })

    it('dùng IGNORED_ARGUMENTS làm ignoreDefaultArgs mặc định', async () => {
      await plugin.launchPersistentContext('/tmp/data')
      const launchOpts = (plugin as any)._launch.mock.calls[0][1]
      expect(launchOpts.ignoreDefaultArgs).toEqual(IGNORED_ARGUMENTS)
    })

    it('throw PluginError khi có unsupported option', async () => {
      await expect(plugin.launchPersistentContext('/tmp/data', { proxy: 'http://p:8080' } as any)).rejects.toThrow(PluginError)
    })
  })

  describe('configure', () => {
    it('gọi onClose với callback cleanup', async () => {
      const cleanup = vi.fn()
      const mockContext = { on: vi.fn(), pages: vi.fn().mockReturnValue([]) }
      await (plugin as any).configure(cleanup, mockContext, { width: 0, height: 0 }, vi.fn())
      expect(mockOnClose).toHaveBeenCalledWith(mockContext, expect.any(Function))
    })

    it('không bindHooks hay resize khi bounds không hợp lệ', async () => {
      await (plugin as any).configure(vi.fn(), {}, { width: 0, height: 0 }, vi.fn())
      expect(mockBindHooks).not.toHaveBeenCalled()
    })

    it('bindHooks với onPageCreated và resize firstPage khi có bounds', async () => {
      const cleanup = vi.fn()
      const mockPage = {}
      const mockContext = { on: vi.fn(), pages: vi.fn().mockReturnValue([mockPage]) }
      mockGetViewport.mockResolvedValue({ width: 800, height: 600 })
      await (plugin as any).configure(cleanup, mockContext, { width: 1024, height: 768 }, vi.fn((fn: any) => fn()))
      expect(mockBindHooks).toHaveBeenCalledWith(mockContext, { onPageCreated: expect.any(Function) })
      expect(mockGetViewport).toHaveBeenCalledWith(mockPage)
    })

    it('gọi sync + setViewport khi viewport khác bounds', async () => {
      const mockSync = vi.fn((fn: any) => fn())
      const mockPage = {}
      const mockContext = { on: vi.fn(), pages: vi.fn().mockReturnValue([mockPage]) }
      mockGetViewport.mockResolvedValue({ width: 800, height: 600 })
      await (plugin as any).configure(vi.fn(), mockContext, { width: 1024, height: 768 }, mockSync)
      expect(mockSync).toHaveBeenCalled()
      expect(mockSetViewport).toHaveBeenCalledWith(mockPage, { width: 1024, height: 768 })
    })

    it('không gọi setViewport khi viewport đã khớp bounds', async () => {
      const mockPage = {}
      const mockContext = { on: vi.fn(), pages: vi.fn().mockReturnValue([mockPage]) }
      mockGetViewport.mockResolvedValue({ width: 1024, height: 768 })
      await (plugin as any).configure(vi.fn(), mockContext, { width: 1024, height: 768 }, vi.fn())
      expect(mockSetViewport).not.toHaveBeenCalled()
    })
  })

  describe('constants', () => {
    it('IGNORED_ARGUMENTS chứa --disable-extensions', () => {
      expect(IGNORED_ARGUMENTS).toEqual(['--disable-extensions'])
    })

    it('UNSUPPORTED_OPTIONS chứa proxy, channel, firefoxUserPrefs', () => {
      expect(UNSUPPORTED_OPTIONS).toContain('proxy')
      expect(UNSUPPORTED_OPTIONS).toContain('channel')
      expect(UNSUPPORTED_OPTIONS).toContain('firefoxUserPrefs')
    })

    it('LAUNCH_FALLBACK_WARNING là string không rỗng', () => {
      expect(LAUNCH_FALLBACK_WARNING).toBeTruthy()
      expect(typeof LAUNCH_FALLBACK_WARNING).toBe('string')
    })
  })
})
