import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockProcess, mockRequire, mockWatch } = vi.hoisted(() => {
  const process_: {
    pid: number
    on: ReturnType<typeof vi.fn>
    once: ReturnType<typeof vi.fn>
    off: ReturnType<typeof vi.fn>
    spawnfile: string
    killed: boolean
    kill: ReturnType<typeof vi.fn>
    exitCode: number | null
  } = {
    pid: 54321,
    on: vi.fn(),
    once: vi.fn(),
    off: vi.fn(),
    spawnfile: '/tmp/data/script/1.2.3/FastExecuteScript.exe',
    killed: false,
    kill: vi.fn(),
    exitCode: null,
  }

  const mr = vi.fn((p: string) => {
    if (p.includes('package.json')) return { name: 'fingerprint-chromium-engine' }
    throw new Error('MODULE_NOT_FOUND')
  })

  const watch = vi.fn()

  return { mockProcess: process_, mockRequire: mr, mockWatch: watch }
})

const mockReadFile = vi.fn()
const mockWriteFile = vi.fn(() => Promise.resolve(undefined))
const mockMkdir = vi.fn(() => Promise.resolve(undefined))
const mockReaddir = vi.fn(() => Promise.resolve([]))
const mockUnlink = vi.fn(() => Promise.resolve(undefined))
const mockAccess = vi.fn(() => Promise.resolve(undefined))
const mockCopyFile = vi.fn(() => Promise.resolve(undefined))
const mockRm = vi.fn(() => Promise.resolve(undefined))

vi.mock('node:fs/promises', () => ({
  access: mockAccess,
  readFile: mockReadFile,
  writeFile: mockWriteFile,
  mkdir: mockMkdir,
  readdir: mockReaddir,
  unlink: mockUnlink,
  copyFile: mockCopyFile,
  rm: mockRm,
}))

const mockExecFile = vi.fn()
vi.mock('node:child_process', () => ({
  execFile: mockExecFile,
}))

vi.mock('node:crypto', () => ({
  randomUUID: vi.fn(() => 'mock-uuid-456'),
}))

vi.mock('chokidar', () => ({
  default: { watch: mockWatch },
  watch: mockWatch,
}))

vi.mock('extract-zip', () => ({
  default: vi.fn().mockResolvedValue(undefined),
}))

const mockCreateTimer = vi.fn(() => ({
  promise: Promise.resolve(),
  clear: vi.fn(),
}))

vi.mock('@src/common/timer', () => ({
  createTimer: mockCreateTimer,
}))

vi.mock('module', () => ({
  createRequire: () => mockRequire,
}))

const { default: RemoteEngine, CLOSE_TIMEOUT, DEFAULT_TIMEOUT, KILL_TIMEOUT, ARCH } = await import('@src/plugin/connector/engine')

describe('Constants', () => {
  it('CLOSE_TIMEOUT la 60000', () => { expect(CLOSE_TIMEOUT).toBe(60000) })
  it('DEFAULT_TIMEOUT la 900000', () => { expect(DEFAULT_TIMEOUT).toBe(900000) })
  it('KILL_TIMEOUT la 5000', () => { expect(KILL_TIMEOUT).toBe(5000) })
  it('ARCH la 32 hoac 64', () => { expect(['32', '64']).toContain(ARCH) })
})

describe('constructor', () => {
  it('khoi tao voi gia tri mac dinh', () => {
    const engine = new RemoteEngine()
    expect(engine).toBeInstanceOf(RemoteEngine)
  })
})

describe('setEngineTimeout', () => {
  it('dung gia tri mac dinh khi timeout <= 0', () => {
    const engine = new RemoteEngine()
    engine.setEngineTimeout(0)
    engine.setEngineTimeout(-1)
  })
})

describe('setRequestTimeout', () => {
  it('set va get requestTimeout', () => {
    const engine = new RemoteEngine()
    engine.setRequestTimeout(30000)
    expect(engine.requestTimeout).toBe(30000)
  })
})

describe('kill', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockProcess.exitCode = null
    mockProcess.killed = false
  })

  it('no-op khi chua co process', async () => {
    const engine = new RemoteEngine()
    await expect(engine.kill()).resolves.toBeUndefined()
  })

  it('no-op khi process da killed', async () => {
    const engine = new RemoteEngine()
    mockProcess.killed = true
    await engine.kill()
    expect(mockProcess.kill).not.toHaveBeenCalled()
  })
})

describe('runFunction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAccess.mockResolvedValue(undefined)
    mockExecFile.mockImplementation((_path: string, _args: string[], _opts: object, cb: (err: Error | null, stdout: string, stderr: string) => void) => {
      process.nextTick(() => cb(null, '', ''))
      return mockProcess
    })
    mockProcess.once.mockImplementation((_event: string, _cb: () => void) => mockProcess)
    mockProcess.killed = false
    mockProcess.exitCode = null
  })

  it('doc project.xml de lay version', async () => {
    mockReadFile
      .mockResolvedValueOnce('<EngineVersion>3.2.1</EngineVersion>')
      .mockResolvedValueOnce(JSON.stringify({ response: 'done' }))

    mockWatch.mockReturnValue({
      on: vi.fn((event: string, handler: () => void) => {
        if (event === 'change') process.nextTick(handler)
      }),
      close: vi.fn(() => Promise.resolve(undefined)),
    })

    const engine = new RemoteEngine()
    const result = await engine.runFunction('TestMethod', { key: 'val' }, { requestTimeout: 0 })

    expect(mockReadFile.mock.calls[0][0]).toContain('project.xml')
    expect(result).toEqual({ response: 'done' })
  })

  it('viet request JSON file', async () => {
    mockReadFile
      .mockResolvedValueOnce('<EngineVersion>3.2.1</EngineVersion>')
      .mockResolvedValueOnce(JSON.stringify({ response: 'ok' }))

    mockWatch.mockReturnValue({
      on: vi.fn((event: string, handler: () => void) => {
        if (event === 'change') process.nextTick(handler)
      }),
      close: vi.fn(() => Promise.resolve(undefined)),
    })

    const engine = new RemoteEngine()
    await engine.runFunction('TestMethod', { data: 123 }, { requestTimeout: 0 })
    expect(mockWriteFile).toHaveBeenCalled()
    const writeCalls = mockWriteFile.mock.calls as unknown[][]
    const lastWrite = writeCalls[writeCalls.length - 1] as string[]
    expect(lastWrite[1]).toContain('TestMethod')
  })

  it('tra ve error response khi engine process dong bat ngo', async () => {
    mockReadFile.mockResolvedValueOnce('<EngineVersion>3.2.1</EngineVersion>')

    mockWatch.mockReturnValue({
      on: vi.fn(() => {}),
      close: vi.fn(() => Promise.resolve(undefined)),
    })

    mockProcess.once.mockImplementation((event: string, cb: () => void) => {
      if (event === 'close') process.nextTick(cb)
      return mockProcess
    })

    const engine = new RemoteEngine()
    const result = await engine.runFunction('Test', {}, { requestTimeout: 0 })
    expect(result).toHaveProperty('error')
  })

  it('tra ve error khi response khong phai JSON hop le', async () => {
    mockReadFile
      .mockResolvedValueOnce('<EngineVersion>3.2.1</EngineVersion>')
      .mockResolvedValueOnce('not-json')

    mockWatch.mockReturnValue({
      on: vi.fn((event: string, handler: () => void) => {
        if (event === 'change') process.nextTick(handler)
      }),
      close: vi.fn(() => Promise.resolve(undefined)),
    })

    const engine = new RemoteEngine()
    const result = await engine.runFunction('Test', {}, { requestTimeout: 0 })
    expect(result).toHaveProperty('error', 'Invalid response format from engine')
  })
})
