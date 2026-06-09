import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

interface MockSocket {
  on: ReturnType<typeof vi.fn>
  write: ReturnType<typeof vi.fn>
}
interface MockServer {
  listen: ReturnType<typeof vi.fn>
  address: ReturnType<typeof vi.fn>
  unref: ReturnType<typeof vi.fn>
  on: ReturnType<typeof vi.fn>
  close: ReturnType<typeof vi.fn>
  connectionHandler?: (socket: MockSocket) => void
  errorListeners: Record<string, (err: NodeJS.ErrnoException) => void>
}

const mockCreateServer = vi.fn()

const { mockServer, createNewSocket } = vi.hoisted(() => {
  const newSocket = (): MockSocket => ({
    on: vi.fn(),
    write: vi.fn(),
  })
  const server: MockServer = {
    listen: vi.fn((_port: number, _host: string, cb: () => void) => {
      process.nextTick(cb)
      return server
    }),
    address: vi.fn(() => ({ port: 54321, family: 'IPv4', address: '127.0.0.1' })),
    unref: vi.fn(),
    on: vi.fn(),
    close: vi.fn((cb: () => void) => {
      process.nextTick(cb)
    }),
    errorListeners: {},
  }
  return { mockServer: server, createNewSocket: newSocket }
})

vi.mock('net', () => ({
  default: {
    createServer: mockCreateServer,
  },
  createServer: mockCreateServer,
}))

mockCreateServer.mockImplementation((handler: (s: MockSocket) => void) => {
  mockServer.connectionHandler = handler
  return mockServer
})

const pcapServer = await import('@src/plugin/connector/pcapServer/index')

describe('pcapServer.listen', () => {
  beforeEach(async () => {
    await pcapServer.close()
    vi.clearAllMocks()
    mockServer.connectionHandler = undefined
  })

  it('tao server va tra ve port', async () => {
    const port = await pcapServer.listen()
    expect(port).toBe(54321)
  })

  it('goi net.createServer', async () => {
    await pcapServer.listen()
    const { createServer } = await import('net')
    expect(createServer).toHaveBeenCalledTimes(1)
  })

  it('dung host va port mac dinh', async () => {
    await pcapServer.listen()
    expect(mockServer.listen).toHaveBeenCalledWith(0, '127.0.0.1', expect.any(Function))
  })

  it('dung port va host tuy chinh', async () => {
    await pcapServer.listen(8080, '0.0.0.0')
    expect(mockServer.listen).toHaveBeenCalledWith(8080, '0.0.0.0', expect.any(Function))
  })

  it('goi unref sau khi listen', async () => {
    await pcapServer.listen()
    expect(mockServer.unref).toHaveBeenCalled()
  })

  it('tra ve cung promise khi goi nhieu lan', async () => {
    const p1 = pcapServer.listen()
    const p2 = pcapServer.listen()
    expect(p1).toBe(p2)
  })
})

describe('pcapServer.close', () => {
  beforeEach(async () => {
    await pcapServer.close()
    vi.clearAllMocks()
    mockServer.connectionHandler = undefined
  })

  it('close khi chua listen khong gay loi', async () => {
    await expect(pcapServer.close()).resolves.toBeUndefined()
  })

  it('close sau listen giai phong server', async () => {
    await pcapServer.listen()
    await pcapServer.close()
    const { createServer } = await import('net')
    expect(mockServer.close).toHaveBeenCalled()
  })

  it('co the listen lai sau close', async () => {
    await pcapServer.listen()
    await pcapServer.close()
    await pcapServer.listen()
    const { createServer } = await import('net')
    expect(createServer).toHaveBeenCalledTimes(2)
  })
})

describe('pcapServer socket handling', () => {
  beforeEach(async () => {
    await pcapServer.close()
    vi.clearAllMocks()
    mockServer.connectionHandler = undefined
  })

  it('dang ky data handler khi co connection', async () => {
    await pcapServer.listen()
    expect(mockServer.connectionHandler).toBeDefined()
    const socket = createNewSocket()
    mockServer.connectionHandler!(socket)
    expect(socket.on).toHaveBeenCalledWith('data', expect.any(Function))
  })

  it('dang ky error handler khi co connection', async () => {
    await pcapServer.listen()
    const socket = createNewSocket()
    mockServer.connectionHandler!(socket)
    expect(socket.on).toHaveBeenCalledWith('error', expect.any(Function))
  })

  it('phan hoi byte 0x01 bang 9 bytes', async () => {
    await pcapServer.listen()
    const socket = createNewSocket()
    mockServer.connectionHandler!(socket)
    const dataHandler = socket.on.mock.calls.find((c: unknown[]) => (c as string[])[0] === 'data')![1]
    dataHandler(Buffer.from([0x01]))
    expect(socket.write).toHaveBeenCalled()
    const written = socket.write.mock.calls[0][0]
    expect(written).toBeInstanceOf(Uint8Array)
    expect(written[0]).toBe(0x01)
    expect(written.length).toBe(9)
  })

  it('phan hoi byte 0x07 bang 5 bytes', async () => {
    await pcapServer.listen()
    const socket = createNewSocket()
    mockServer.connectionHandler!(socket)
    const dataHandler = socket.on.mock.calls.find((c: unknown[]) => (c as string[])[0] === 'data')![1]
    dataHandler(Buffer.from([0x07]))
    expect(socket.write).toHaveBeenCalled()
    const written = socket.write.mock.calls[0][0]
    expect(written).toBeInstanceOf(Uint8Array)
    expect(written[0]).toBe(0x07)
    expect(written.length).toBe(5)
  })

  it('bo qua data rong', async () => {
    await pcapServer.listen()
    const socket = createNewSocket()
    mockServer.connectionHandler!(socket)
    const dataHandler = socket.on.mock.calls.find((c: unknown[]) => (c as string[])[0] === 'data')![1]
    dataHandler(Buffer.from([]))
    expect(socket.write).not.toHaveBeenCalled()
  })

  it('tang id sau moi lan nhan byte 0x01', async () => {
    await pcapServer.listen()
    const socket = createNewSocket()
    mockServer.connectionHandler!(socket)
    const dataHandler = socket.on.mock.calls.find((c: unknown[]) => (c as string[])[0] === 'data')![1]
    dataHandler(Buffer.from([0x01]))
    dataHandler(Buffer.from([0x01]))
    expect(socket.write).toHaveBeenCalledTimes(2)
    const secondWrite = socket.write.mock.calls[1][0]
    expect(secondWrite[6]).toBe(1)
    expect(secondWrite[7]).toBe(0)
    expect(secondWrite[8]).toBe(0)
  })
})

describe('pcapServer EADDRINUSE retry', () => {
  beforeEach(async () => {
    await pcapServer.close()
    vi.clearAllMocks()
    mockServer.connectionHandler = undefined
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('retry sau 1s khi gap EADDRINUSE', async () => {
    const origOn = mockServer.on
    const errorListeners: Record<string, (err: NodeJS.ErrnoException) => void> = {}
    mockServer.on = vi.fn((event: string, cb: (err: NodeJS.ErrnoException) => void) => {
      errorListeners[event] = cb
      return mockServer
    })

    const portPromise = pcapServer.listen(3000, '127.0.0.1')

    const err = new Error('address in use') as NodeJS.ErrnoException
    err.code = 'EADDRINUSE'
    errorListeners.error(err)

    await vi.advanceTimersByTimeAsync(1000)

    const port = await portPromise
    expect(port).toBe(54321)
    expect(mockServer.listen).toHaveBeenCalledTimes(2)

    mockServer.on = origOn
  })
})
