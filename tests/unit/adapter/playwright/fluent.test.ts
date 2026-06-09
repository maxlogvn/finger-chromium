import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PluginError } from '@src/plugin/errors'
import type { Launcher } from '@src/adapter/playwright/fluent'

const { mockPluginMethods, mockPluginConstructor, mockDataManagerMethods, mockCollectErrors } = vi.hoisted(() => ({
  mockPluginMethods: {
    setServiceKey: vi.fn(),
    setWorkingFolder: vi.fn(),
    useProfile: vi.fn(),
    useProxy: vi.fn(),
    useFingerprint: vi.fn(),
    launchPersistentContext: vi.fn().mockResolvedValue({ on: vi.fn() }),
    cleanup: vi.fn(),
    fetch: vi.fn().mockResolvedValue('mock-fingerprint-data'),
  },
  mockPluginConstructor: vi.fn(),
  mockDataManagerMethods: {
    map: vi.fn((src: string, _dest?: string) => src),
    dispose: vi.fn(),
  },
  mockCollectErrors: vi.fn(),
}))

vi.mock('@src/adapter/playwright/bridge', () => ({
  PlaywrightFingerprintPlugin: class MockPlugin {
    constructor(launcher?: unknown, connector?: unknown) {
      mockPluginConstructor(launcher, connector)
    }
    setServiceKey = mockPluginMethods.setServiceKey
    setWorkingFolder = mockPluginMethods.setWorkingFolder
    useProfile = mockPluginMethods.useProfile
    useProxy = mockPluginMethods.useProxy
    useFingerprint = mockPluginMethods.useFingerprint
    launchPersistentContext = mockPluginMethods.launchPersistentContext
    cleanup = mockPluginMethods.cleanup
    fetch = mockPluginMethods.fetch
  },
}))

vi.mock('@src/adapter/playwright/data', () => ({
  AdapterDataManager: class MockDataManager {
    map = mockDataManagerMethods.map
    dispose = mockDataManagerMethods.dispose
  },
}))

vi.mock('@src/adapter/playwright/utils', () => ({
  collectErrors(...args: [string, () => unknown][]) {
    return mockCollectErrors(args)
  },
}))

vi.stubEnv('BABLOSOFT_KEY', 'test-key-123')

const { BrowserEngine } = await import('@src/adapter/playwright/fluent')

function setupRealCollectErrors() {
  mockCollectErrors.mockImplementation((steps: [string, () => unknown][]) => {
    const errors: string[] = []
    for (const [, fn] of steps) {
      try { const r = fn(); if (r instanceof Promise) void r } catch (err) { errors.push(String(err)) }
    }
    return []
  })
}

describe('BrowserEngine.newFingerprint', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('tao engine, set key va working folder, goi fetch', async () => {
    const result = await BrowserEngine.newFingerprint({ tags: ['Windows 10'] })
    expect(mockPluginMethods.setServiceKey).toHaveBeenCalledWith('test-key-123')
    expect(mockPluginMethods.setWorkingFolder).toHaveBeenCalled()
    expect(mockPluginMethods.fetch).toHaveBeenCalledWith({ tags: ['Windows 10'] })
    expect(result).toBe('mock-fingerprint-data')
  })

  it('dung DEFAULT_FINGERPRINT_OPTIONS khi khong truyen options', async () => {
    await BrowserEngine.newFingerprint()
    expect(mockPluginMethods.fetch).toHaveBeenCalledWith({
      tags: ['Microsoft Windows', 'Chrome'],
    })
  })
})

describe('BrowserEngine fluent config', () => {
  let engine: InstanceType<typeof BrowserEngine>

  beforeEach(() => {
    vi.clearAllMocks()
    engine = new BrowserEngine()
  })

  describe('useFingerprint', () => {
    it('luu fingerprintData va tra ve this', () => {
      const result = engine.useFingerprint('fp-data', { emulateDeviceScaleFactor: true })
      expect(result).toBe(engine)
    })
  })

  describe('useProxy', () => {
    it('luu proxyData va tra ve this', () => {
      const result = engine.useProxy('http://proxy:8080', { changeBrowserLanguage: true })
      expect(result).toBe(engine)
    })
  })

  describe('useProfile', () => {
    it('luu profileDirPath, saveProfileDirPath, options va tra ve this', () => {
      const result = engine.useProfile('/tmp/profile', { loadProxy: false })
      expect(result).toBe(engine)
    })
  })

  describe('useLauncher', () => {
    it('luu launcher va connector', () => {
      const fakeLauncher = { launch: vi.fn() } as unknown as Launcher
      const fakeConnector = { api: vi.fn() }
      const result = engine.useLauncher(fakeLauncher, fakeConnector as any)
      expect(result).toBe(engine)
    })
  })
})

describe('BrowserEngine.launch', () => {
  let engine: InstanceType<typeof BrowserEngine>

  beforeEach(() => {
    vi.clearAllMocks()
    engine = new BrowserEngine()
  })

  it('khoi tao engine va dataManager', () => {
    engine.launch()
    expect(mockPluginConstructor).toHaveBeenCalledWith(undefined, undefined)
    expect(mockPluginMethods.setServiceKey).toHaveBeenCalledWith('test-key-123')
    expect(mockPluginMethods.setWorkingFolder).toHaveBeenCalled()
  })

  it('apply profile mac dinh khi khong goi useProfile', () => {
    engine.launch()
    expect(mockDataManagerMethods.map).toHaveBeenCalled()
    expect(mockPluginMethods.useProfile).toHaveBeenCalled()
  })

  it('apply fingerprint khi da goi useFingerprint', () => {
    engine.useFingerprint('fp-data', { emulateDeviceScaleFactor: true })
    engine.launch()
    expect(mockPluginMethods.useFingerprint).toHaveBeenCalledWith('fp-data', { emulateDeviceScaleFactor: true })
  })

  it('apply proxy khi da goi useProxy', () => {
    engine.useProxy('http://proxy:8080', { changeBrowserLanguage: true })
    engine.launch()
    expect(mockPluginMethods.useProxy).toHaveBeenCalledWith('http://proxy:8080', { changeBrowserLanguage: true })
  })

  it('throw PluginError khi goi lan hai', () => {
    engine.launch()
    expect(() => engine.launch()).toThrow(PluginError)
  })

  it('truyen launcher va connector vao engine', () => {
    const fakeLauncher = { launch: vi.fn() } as unknown as Launcher
    const fakeConnector = { api: vi.fn() }
    engine.useLauncher(fakeLauncher, fakeConnector as any)
    engine.launch()
    expect(mockPluginConstructor).toHaveBeenCalledWith(fakeLauncher, fakeConnector)
  })

  it('tra ve this de chain', () => {
    const result = engine.launch()
    expect(result).toBe(engine)
  })
})

describe('BrowserEngine.newContext', () => {
  let engine: InstanceType<typeof BrowserEngine>

  beforeEach(() => {
    vi.clearAllMocks()
    engine = new BrowserEngine()
  })

  it('throw PluginError neu chua launch', async () => {
    await expect(engine.newContext()).rejects.toThrow(PluginError)
  })

  it('tao context sau khi launch', async () => {
    engine.launch()
    const ctx = await engine.newContext()
    expect(mockPluginMethods.launchPersistentContext).toHaveBeenCalled()
    expect(ctx).toBeDefined()
  })

  it('throw PluginError neu context da ton tai', async () => {
    engine.launch()
    await engine.newContext()
    await expect(engine.newContext()).rejects.toThrow(PluginError)
  })
})

describe('BrowserEngine.close', () => {
  let engine: InstanceType<typeof BrowserEngine>

  beforeEach(() => {
    vi.clearAllMocks()
    setupRealCollectErrors()
    engine = new BrowserEngine()
  })

  it('no-op neu chua launch', async () => {
    await expect(engine.close()).resolves.toBeUndefined()
  })

  it('close context, save profile, cleanup engine', async () => {
    engine.launch()
    await engine.newContext()
    await engine.close()
    expect(mockPluginMethods.cleanup).toHaveBeenCalled()
    expect(mockDataManagerMethods.dispose).toHaveBeenCalled()
  })

  it('throw PluginError khi collectErrors co loi', async () => {
    engine.launch()
    mockCollectErrors.mockResolvedValue(['cleanup-engine failed'])
    await expect(engine.close()).rejects.toThrow(PluginError)
  })

  it('co the goi close nhieu lan (idempotent)', async () => {
    engine.launch()
    await engine.newContext()
    await engine.close()
    await engine.close()
  })
})
