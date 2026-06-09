import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Readable, Writable } from 'node:stream'
import { createHash } from 'node:crypto'

const mockFsAccess = vi.fn(() => Promise.resolve(undefined))
const mockFsUnlink = vi.fn(() => Promise.resolve(undefined))
const mockWriteFile = vi.fn(() => Promise.resolve(undefined))
const mockMkdir = vi.fn(() => Promise.resolve(undefined))
const mockReaddir = vi.fn(() => Promise.resolve([]))
const mockCopyFile = vi.fn(() => Promise.resolve(undefined))
const mockRm = vi.fn(() => Promise.resolve(undefined))
const mockReadFile = vi.fn()

vi.mock('node:fs/promises', () => ({
  access: mockFsAccess,
  readFile: mockReadFile,
  writeFile: mockWriteFile,
  mkdir: mockMkdir,
  readdir: mockReaddir,
  unlink: mockFsUnlink,
  copyFile: mockCopyFile,
  rm: mockRm,
}))

function createMockWriter() {
  const writer = new Writable({
    write(chunk: Buffer, _encoding: string, callback: (err?: Error) => void) {
      callback()
    },
    final(callback: (err?: Error) => void) {
      callback()
    },
  })
  const origEnd = writer.end.bind(writer) as (...args: unknown[]) => ReturnType<typeof writer.end>
  writer.end = function (...args: unknown[]) {
    const result = origEnd(...args)
    process.nextTick(() => writer.emit('close'))
    return result
  } as typeof writer.end
  return writer
}

let currentReadStream: Readable | null = null
vi.mock('node:fs', () => ({
  createReadStream: vi.fn(() => {
    currentReadStream = new Readable({
      read() {
        this.push('test data')
        this.push(null)
      },
    })
    return currentReadStream
  }),
  createWriteStream: vi.fn(() => createMockWriter()),
}))

let realCreateHash: typeof createHash
vi.mock('node:crypto', async () => {
  const actual = await vi.importActual<typeof import('node:crypto')>('node:crypto')
  realCreateHash = actual.createHash
  return {
    createHash: vi.fn((algorithm: string) => realCreateHash(algorithm)),
  }
})

const mockAxiosGet = vi.fn()
vi.mock('axios', () => ({
  default: { get: mockAxiosGet },
  get: mockAxiosGet,
}))

const { exists, checksum, download, fetch } = await import('@src/plugin/connector/download')

describe('exists', () => {
  beforeEach(() => { mockFsAccess.mockReset() })

  it('tra ve true khi file ton tai', async () => {
    mockFsAccess.mockResolvedValue(undefined)
    const result = await exists('/path/to/file')
    expect(result).toBe(true)
  })

  it('tra ve false khi file khong ton tai', async () => {
    mockFsAccess.mockRejectedValue(new Error('ENOENT'))
    const result = await exists('/path/to/file')
    expect(result).toBe(false)
  })
})

describe('checksum', () => {
  it('tra ve sha1 hex string', async () => {
    const stream = new Readable({
      read() {
        this.push(Buffer.from('test data'))
        this.push(null)
      },
    })
    const { createReadStream } = await import('node:fs')
    ;(createReadStream as unknown as ReturnType<typeof vi.fn>).mockReturnValue(stream)

    const hash = await checksum('/path/to/file')
    expect(hash).toMatch(/^[a-f0-9]{40}$/)
  })

  it('tinh checksum cho file rong', async () => {
    const stream = new Readable({
      read() {
        this.push(null)
      },
    })
    const { createReadStream } = await import('node:fs')
    ;(createReadStream as unknown as ReturnType<typeof vi.fn>).mockReturnValue(stream)

    const hash = await checksum('/path/to/empty')
    expect(hash).toBe('da39a3ee5e6b4b0d3255bfef95601890afd80709')
  })
})

describe('download', () => {
  beforeEach(() => { mockAxiosGet.mockReset() })

  it('tai file thanh cong', async () => {
    const mockData = new Readable({
      read() {
        this.push(Buffer.from('file content'))
        this.push(null)
      },
    })
    mockAxiosGet.mockResolvedValue({ data: mockData, headers: {} })

    await expect(download('https://example.com/file.zip', '/tmp/file.zip')).resolves.toBeUndefined()
  })

  it('goi onProgress callback khi tai', { timeout: 15000 }, async () => {
    const mockData = new Readable({
      read() {
        this.push(Buffer.from('chunk1'))
        this.push(Buffer.from('chunk2'))
        this.push(null)
      },
    })
    mockAxiosGet.mockResolvedValue({ data: mockData, headers: {} })

    const onProgress = vi.fn()
    await download('https://example.com/file.zip', '/tmp/file.zip', onProgress)

    expect(onProgress).toHaveBeenCalled()
    const lastCall = onProgress.mock.calls[onProgress.mock.calls.length - 1][0]
    expect(lastCall.bytes).toBe(12)
  })

  it('tinh phan tram khi co content-length', { timeout: 15000 }, async () => {
    const mockData = new Readable({
      read() {
        this.push(Buffer.from('12345678'))
        this.push(null)
      },
    })
    mockAxiosGet.mockResolvedValue({ data: mockData, headers: { 'content-length': '8' } })

    const onProgress = vi.fn()
    await download('https://example.com/file.zip', '/tmp/file.zip', onProgress)

    const lastCall = onProgress.mock.calls[onProgress.mock.calls.length - 1][0]
    expect(lastCall.percent).toBe(100)
    expect(lastCall.total).toBe(8)
  })

  it('throw loi khi axios that bai va cleanup file', async () => {
    mockAxiosGet.mockRejectedValue(new Error('Network error'))

    await expect(download('https://example.com/file.zip', '/tmp/file.zip')).rejects.toThrow('Network error')
    expect(mockFsUnlink).toHaveBeenCalledWith('/tmp/file.zip')
  })

  it('truyen timeout vao axios.get', { timeout: 15000 }, async () => {
    const mockData = new Readable({
      read() {
        this.push(Buffer.from('data'))
        this.push(null)
      },
    })
    mockAxiosGet.mockResolvedValue({ data: mockData, headers: {} })

    await download('https://example.com/file.zip', '/tmp/file.zip', undefined, 5000)
    expect(mockAxiosGet).toHaveBeenCalledWith(
      'https://example.com/file.zip',
      expect.objectContaining({ timeout: 5000 }),
    )
  })

  it('goi onProgress voi bytes tang dan', { timeout: 15000 }, async () => {
    const mockData = new Readable({
      read() {
        this.push(Buffer.from('ab'))
        this.push(Buffer.from('cd'))
        this.push(null)
      },
    })
    mockAxiosGet.mockResolvedValue({ data: mockData, headers: {} })

    const onProgress = vi.fn()
    await download('https://example.com/file.zip', '/tmp/file.zip', onProgress)

    expect(onProgress.mock.calls[0][0].bytes).toBe(2)
    expect(onProgress.mock.calls[1][0].bytes).toBe(4)
  })
})

describe('fetch', () => {
  beforeEach(() => { mockAxiosGet.mockReset() })

  it('goi axios.get voi url', async () => {
    mockAxiosGet.mockResolvedValue({ data: 'ok' })

    const result = await fetch('https://example.com/data')
    expect(result).toEqual({ data: 'ok' })
  })

  it('truyen options vao axios.get', async () => {
    mockAxiosGet.mockResolvedValue({ data: 'ok' })

    await fetch('https://example.com/data', { headers: { Authorization: 'Bearer token' } })
    expect(mockAxiosGet).toHaveBeenCalledWith(
      'https://example.com/data',
      { headers: { Authorization: 'Bearer token' } },
    )
  })
})
