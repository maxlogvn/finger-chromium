import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { PluginError } from '@src/plugin/errors'

const { mockChildProcess, mockReadline } = vi.hoisted(() => {
  const readline: {
    on: ReturnType<typeof vi.fn>
    close: ReturnType<typeof vi.fn>
    _lineHandler: ((line: string) => void) | null
  } = {
    on: vi.fn((event: string, handler: (line: string) => void) => {
      if (event === 'line') readline._lineHandler = handler
    }),
    close: vi.fn(),
    _lineHandler: null,
  }

  const child: {
    pid: number
    killed: boolean
    kill: ReturnType<typeof vi.fn>
    on: ReturnType<typeof vi.fn>
    once: ReturnType<typeof vi.fn>
    exitCode: number | null
    stderr: { on: ReturnType<typeof vi.fn> }
    stdout: { on: ReturnType<typeof vi.fn> }
  } = {
    pid: 98765,
    killed: false,
    kill: vi.fn(),
    on: vi.fn(),
    once: vi.fn(),
    exitCode: null,
    stderr: { on: vi.fn() },
    stdout: { on: vi.fn() },
  }

  return { mockChildProcess: child, mockReadline: readline }
})

vi.mock('node:readline', () => ({
  createInterface: vi.fn(() => mockReadline),
}))

const mockExec = vi.fn((_cmd: string, cb: (err: Error | null) => void) => cb(null))
vi.mock('node:child_process', () => ({
  spawn: vi.fn(() => mockChildProcess),
  exec: mockExec,
}))

const DEVTOOLS_URL = 'DevTools listening on ws://127.0.0.1:9222/devtools/browser/abc123'

const { launch } = await import('@src/plugin/launcher/index')

describe('launch', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockReadline._lineHandler = null
    mockChildProcess.exitCode = null
    mockChildProcess.killed = false
  })

  it('spawn child process voi executablePath va args', async () => {
    const promise = launch({ executablePath: '/path/to/chrome', args: ['--no-sandbox'] })

    mockReadline._lineHandler!(DEVTOOLS_URL)
    const { spawn } = await import('node:child_process')

    await promise
    expect(spawn).toHaveBeenCalledWith(
      '/path/to/chrome',
      expect.arrayContaining(['--no-sandbox', expect.stringContaining('--remote-debugging-port=')]),
      expect.objectContaining({ shell: false, detached: false }),
    )
  })

  it('them --user-data-dir vao args khi co userDataDir', async () => {
    const promise = launch({ executablePath: '/path/to/chrome', userDataDir: '/tmp/profile' })
    mockReadline._lineHandler!(DEVTOOLS_URL)
    const { spawn } = await import('node:child_process')
    await promise
    expect(spawn).toHaveBeenCalledWith(
      '/path/to/chrome',
      expect.arrayContaining([expect.stringContaining('--user-data-dir=')]),
      expect.any(Object),
    )
  })

  it('tra ve Browser object voi url, port, close, configure, process', async () => {
    const promise = launch({ executablePath: '/path/to/chrome' })
    mockReadline._lineHandler!(DEVTOOLS_URL)
    const browser = await promise

    expect(browser).toHaveProperty('url')
    expect(browser).toHaveProperty('port')
    expect(browser).toHaveProperty('close')
    expect(browser).toHaveProperty('configure')
    expect(browser).toHaveProperty('process')
    expect(browser.port).toBe(9222)
  })

  it('throw PluginError khi khong co executablePath', async () => {
    await expect(launch({ executablePath: '' } as any)).rejects.toThrow(PluginError)
  })

  it('throw PluginError khi timeout', async () => {
    vi.useFakeTimers()
    const promise = launch({ executablePath: '/path/to/chrome', timeout: 100 })

    promise.catch(() => {})
    vi.advanceTimersByTime(100)

    await expect(promise).rejects.toThrow(PluginError)

    vi.useRealTimers()
  })

  it('close goi taskkill va kill process tree', async () => {
    const promise = launch({ executablePath: '/path/to/chrome' })
    mockReadline._lineHandler!(DEVTOOLS_URL)
    const browser = await promise

    await browser.close()
    expect(mockExec).toHaveBeenCalledWith(
      'taskkill /pid 98765 /T /F',
      expect.any(Function),
    )
  })

  it('close khong gay loi khi goi nhieu lan', async () => {
    const promise = launch({ executablePath: '/path/to/chrome' })
    mockReadline._lineHandler!(DEVTOOLS_URL)
    const browser = await promise

    await browser.close()
    await browser.close()
    expect(mockExec).toHaveBeenCalledTimes(1)
  })

  it('configure la async function khong lam gi', async () => {
    const promise = launch({ executablePath: '/path/to/chrome' })
    mockReadline._lineHandler!(DEVTOOLS_URL)
    const browser = await promise

    await expect(browser.configure()).resolves.toBeUndefined()
  })
})
