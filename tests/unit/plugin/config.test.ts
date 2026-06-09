import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('async-lock', () => ({
  default: class MockAsyncLock {
    acquire = vi.fn((_key: string, fn: () => Promise<void>) => fn())
  },
}))

vi.mock('@src/plugin/browser', () => ({
  setViewport: vi.fn(),
}))

vi.mock('@src/common/timer', () => ({
  sleep: vi.fn(),
}))

vi.mock('fs/promises', () => ({
  readFile: vi.fn(),
  writeFile: vi.fn(),
}))

const { getValidPollInterval, ConfigManager } = await import('@src/plugin/config')

describe('getValidPollInterval', () => {
  it('trả về giá trị mặc định nếu interval là undefined', () => {
    expect(getValidPollInterval(undefined)).toBe(500)
  })

  it('trả về giá trị mặc định nếu interval là NaN', () => {
    expect(getValidPollInterval(NaN)).toBe(500)
  })

  it('trả về giá trị mặc định nếu interval là số âm', () => {
    expect(getValidPollInterval(-1)).toBe(500)
  })

  it('trả về giá trị mặc định nếu interval không phải number', () => {
    expect(getValidPollInterval('abc' as any)).toBe(500)
  })

  it('không cho phép nhỏ hơn MIN_POLL_INTERVAL (100)', () => {
    expect(getValidPollInterval(0)).toBe(100)
    expect(getValidPollInterval(50)).toBe(100)
  })

  it('trả về đúng interval nếu >= 100', () => {
    expect(getValidPollInterval(200)).toBe(200)
    expect(getValidPollInterval(1000)).toBe(1000)
    expect(getValidPollInterval(100)).toBe(100)
  })
})

describe('ConfigManager.configure', () => {
  beforeEach(async () => {
    const { setViewport } = await import('@src/plugin/browser')
    ;(setViewport as unknown as ReturnType<typeof vi.fn>).mockClear()
  })

  it('đăng ký cleanup khi browser process exit', async () => {
    const cleanup = vi.fn()
    const onOnce = vi.fn()
    const browser = { process: { once: onOnce } }
    const configManager = new ConfigManager()

    await configManager.configure(cleanup, browser as any)

    expect(onOnce).toHaveBeenCalledWith('exit', expect.any(Function))
    const exitHandler = onOnce.mock.calls[0][1]
    exitHandler()
    expect(cleanup).toHaveBeenCalledWith(browser)
  })

  it('gọi setViewport qua sync khi có bounds', async () => {
    const { setViewport } = await import('@src/plugin/browser')
    const browser = {
      process: { once: vi.fn() },
      configure: vi.fn(),
    }
    const configManager = new ConfigManager()
    const sync = vi.fn((fn: () => unknown) => fn()) as any

    await configManager.configure(vi.fn(), browser as any, { width: 1280, height: 720 }, sync)

    expect(browser.configure).not.toBeUndefined()
    expect(sync).toHaveBeenCalled()
    expect(setViewport).toHaveBeenCalledWith(browser, { width: 1280, height: 720 })
  })

  it('không gọi setViewport nếu bounds không có width/height', async () => {
    const { setViewport } = await import('@src/plugin/browser')
    const browser = {
      process: { once: vi.fn() },
      configure: vi.fn(),
    }
    const configManager = new ConfigManager()
    const sync = vi.fn()

    await configManager.configure(vi.fn(), browser as any, {}, sync)

    expect(sync).not.toHaveBeenCalled()
    expect(setViewport).not.toHaveBeenCalled()
  })

  it('sử dụng sync mặc định nếu không truyền sync', async () => {
    const browser = {
      process: { once: vi.fn() },
      configure: vi.fn(),
    }
    const configManager = new ConfigManager()

    await expect(configManager.configure(vi.fn(), browser as any)).resolves.toBeUndefined()
  })
})

describe('ConfigManager.synchronize', () => {
  it('đọc file ini và thay thế availWidth/availHeight', async () => {
    const { readFile, writeFile } = await import('fs/promises')
    const { sleep } = await import('@src/common/timer')
    ;(readFile as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      'availWidth=800\navailHeight=600\n'
    )

    const configManager = new ConfigManager()
    await configManager.synchronize('test-id', '/tmp/pwd', { width: 1024, height: 768 })

    expect(readFile).toHaveBeenCalledWith('/tmp/pwd/s/test-id1.ini', 'utf8')
    expect(writeFile).toHaveBeenCalledTimes(2)
    expect(sleep).toHaveBeenCalled()
  })

  it('ghi BAS_NOT_SET cho lần reset đầu tiên', async () => {
    const { readFile, writeFile } = await import('fs/promises')
    ;(readFile as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      'availWidth=800\navailHeight=600\n'
    )

    const configManager = new ConfigManager()
    await configManager.synchronize('test-id', '/tmp/pwd', { width: 1024, height: 768 })

    expect((writeFile as unknown as ReturnType<typeof vi.fn>).mock.calls[0][1]).toContain('BAS_NOT_SET')
  })

  it('ghi giá trị bounds cho lần reset thứ hai', async () => {
    const { readFile, writeFile } = await import('fs/promises')
    ;(readFile as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      'availWidth=800\navailHeight=600\n'
    )

    const configManager = new ConfigManager()
    await configManager.synchronize('test-id', '/tmp/pwd', { width: 1024, height: 768 })

    expect((writeFile as unknown as ReturnType<typeof vi.fn>).mock.calls[1][1]).toContain('1024')
    expect((writeFile as unknown as ReturnType<typeof vi.fn>).mock.calls[1][1]).toContain('768')
  })

  it('gọi action callback sau lần reset đầu', async () => {
    const { readFile } = await import('fs/promises')
    ;(readFile as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      'availWidth=800\navailHeight=600\n'
    )

    const action = vi.fn()
    const configManager = new ConfigManager()
    await configManager.synchronize('test-id', '/tmp/pwd', { width: 1024, height: 768 }, action)

    expect(action).toHaveBeenCalledTimes(1)
  })
})
