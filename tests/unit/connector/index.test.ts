import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PluginError, MissingKeyError } from '@src/plugin/errors'

const mockEngineInstance = vi.hoisted(() => ({
  setCwd: vi.fn(),
  setArgs: vi.fn(),
  setEngineTimeout: vi.fn(),
  setRequestTimeout: vi.fn(),
  get requestTimeout() { return 5000 },
  runFunction: vi.fn(),
  kill: vi.fn(),
  on: vi.fn(),
  emit: vi.fn(),
}))

vi.mock('async-lock', () => ({
  default: class MockAsyncLock {
    acquire = vi.fn((_key: string, fn: () => Promise<unknown>) => fn())
  },
}))

vi.mock('@src/plugin/connector/engine', () => ({
  default: class MockRemoteEngine {
    constructor() {}
    setCwd = mockEngineInstance.setCwd
    setArgs = mockEngineInstance.setArgs
    setEngineTimeout = mockEngineInstance.setEngineTimeout
    setRequestTimeout = mockEngineInstance.setRequestTimeout
    get requestTimeout() { return mockEngineInstance.requestTimeout }
    runFunction = mockEngineInstance.runFunction
    kill = mockEngineInstance.kill
    on = mockEngineInstance.on
  },
}))

vi.mock('@src/plugin/connector/pcapServer/index', () => ({
  listen: vi.fn().mockResolvedValue(12345),
  close: vi.fn(),
}))

vi.mock('@src/plugin/connector/utils', () => ({
  notify: vi.fn(() => ({ clear: vi.fn() })),
}))

const { default: Connector } = await import('@src/plugin/connector/index')
const pcapServer = await import('@src/plugin/connector/pcapServer/index')

describe('Connector', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('constructor', () => {
    it('khoi tao RemoteEngine va dang ky event listeners', () => {
      new Connector()
      expect(mockEngineInstance.on).toHaveBeenCalledWith('beforeExtract', expect.any(Function))
      expect(mockEngineInstance.on).toHaveBeenCalledWith('beforeDownload', expect.any(Function))
      expect(mockEngineInstance.on).toHaveBeenCalledWith('downloadProgress', expect.any(Function))
    })
  })

  describe('requestTimeout', () => {
    it('tra ve requestTimeout tu engine', () => {
      const connector = new Connector()
      expect(connector.requestTimeout).toBe(5000)
    })
  })

  describe('setCwd', () => {
    it('delegate xuong engine', () => {
      const connector = new Connector()
      connector.setCwd('/custom/path')
      expect(mockEngineInstance.setCwd).toHaveBeenCalledWith('/custom/path')
    })
  })

  describe('setRequestTimeout', () => {
    it('delegate xuong engine', () => {
      const connector = new Connector()
      connector.setRequestTimeout(10000)
      expect(mockEngineInstance.setRequestTimeout).toHaveBeenCalledWith(10000)
    })
  })

  describe('setEngineTimeout', () => {
    it('delegate xuong engine', () => {
      const connector = new Connector()
      connector.setEngineTimeout(300000)
      expect(mockEngineInstance.setEngineTimeout).toHaveBeenCalledWith(300000)
    })
  })

  describe('api', () => {
    it('goi ensurePcapPort va runFunction', async () => {
      mockEngineInstance.runFunction.mockResolvedValue({ response: 'ok' })
      const connector = new Connector()

      const result = await connector.api('myMethod', { key: 'test-key' })

      expect(pcapServer.listen).toHaveBeenCalled()
      expect(mockEngineInstance.setArgs).toHaveBeenCalledWith(['--mock-pcap-port=12345'])
      expect(mockEngineInstance.runFunction).toHaveBeenCalledWith(
        'myMethod',
        { key: 'test-key' },
        expect.objectContaining({ requestTimeout: 5000 }),
      )
      expect(result).toBe('ok')
    })

    it('tra ve result khi khong co response', async () => {
      mockEngineInstance.runFunction.mockResolvedValue({ data: 'direct-result' })
      const connector = new Connector()

      const result = await connector.api('myMethod')
      expect(result).toEqual({ data: 'direct-result' })
    })

    it('throw MissingKeyError khi engine bao key is missing', async () => {
      mockEngineInstance.runFunction.mockResolvedValue({ error: 'key is missing' })
      const connector = new Connector()

      await expect(connector.api('needsKey', {})).rejects.toThrow(MissingKeyError)
    })

    it('throw PluginError khi engine tra ve error khac', async () => {
      mockEngineInstance.runFunction.mockResolvedValue({ error: 'internal error' })
      const connector = new Connector()

      await expect(connector.api('failingMethod', {})).rejects.toThrow(PluginError)
    })

    it('su dung requestTimeout = 0 khi perfectCanvasRequest', async () => {
      mockEngineInstance.runFunction.mockResolvedValue({ response: 'perfect' })
      const connector = new Connector()

      await connector.api('perfectCanvas', { options: { perfectCanvasRequest: true } })
      expect(mockEngineInstance.runFunction).toHaveBeenCalledWith(
        'perfectCanvas',
        expect.any(Object),
        expect.objectContaining({ requestTimeout: 0 }),
      )
    })

    it('goi notify khi bi MissingKeyError', async () => {
      const { notify } = await import('@src/plugin/connector/utils')
      mockEngineInstance.runFunction.mockResolvedValue({ error: 'key is missing' })
      const connector = new Connector()

      await expect(connector.api('needsKey', { key: 'invalid' })).rejects.toThrow(MissingKeyError)
      expect(notify).toHaveBeenCalledWith('invalid')
    })
  })

  describe('cleanup', () => {
    it('goi engine.kill', async () => {
      const connector = new Connector()
      await connector.cleanup()
      expect(mockEngineInstance.kill).toHaveBeenCalled()
    })
  })
})
