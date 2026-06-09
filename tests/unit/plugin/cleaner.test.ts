import path from 'node:path'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const mockLock = {
  lock: vi.fn().mockResolvedValue(undefined),
  unlock: vi.fn().mockResolvedValue(undefined),
  check: vi.fn().mockResolvedValue(false),
}
vi.mock('proper-lockfile', () => ({
  default: mockLock,
  ...mockLock,
}))

const mockFg = vi.fn().mockResolvedValue([])
vi.mock('fast-glob', () => ({
  default: mockFg,
}))

const mockRm = vi.fn().mockResolvedValue(undefined)
vi.mock('fs/promises', () => ({
  rm: mockRm,
}))

const { SettingsCleaner } = await import('../../../src/plugin/cleaner')

function p(...segments: string[]): string {
  return path.join(...segments)
}

describe('SettingsCleaner', () => {
  let cleaner: any

  beforeEach(() => {
    vi.clearAllMocks()
    mockFg.mockResolvedValue([])
    cleaner = new SettingsCleaner()
  })

  afterEach(async () => {
    mockFg.mockResolvedValue([])
    await cleaner.stop()
  })

  describe('ignore', () => {
    it('lock các file cho pid và id', async () => {
      await cleaner.ignore('/tmp/bas', '123', 'abc')
      expect(mockLock.lock).toHaveBeenCalledTimes(3)
      expect(mockLock.lock).toHaveBeenCalledWith(p('/tmp/bas', 't', '123'), expect.objectContaining({ onCompromised: expect.any(Function) }))
      expect(mockLock.lock).toHaveBeenCalledWith(p('/tmp/bas', 's', 'abc.ini'), expect.objectContaining({ onCompromised: expect.any(Function) }))
      expect(mockLock.lock).toHaveBeenCalledWith(p('/tmp/bas', 's', 'abc1.ini'), expect.objectContaining({ onCompromised: expect.any(Function) }))
    })

    it('bỏ qua lỗi ENOENT', async () => {
      mockLock.lock.mockRejectedValue({ code: 'ENOENT' })
      await expect(cleaner.ignore('/tmp/bas', '123', 'abc')).resolves.toBeUndefined()
    })

    it('ném lỗi khác ENOENT', async () => {
      mockLock.lock.mockRejectedValue({ code: 'EACCES', message: 'permission denied' })
      await expect(cleaner.ignore('/tmp/bas', '123', 'abc')).rejects.toThrow()
    })
  })

  describe('include', () => {
    it('unlock các file cho pid và id', async () => {
      await cleaner.include('/tmp/bas', '123', 'abc')
      expect(mockLock.unlock).toHaveBeenCalledTimes(3)
      expect(mockLock.unlock).toHaveBeenCalledWith(p('/tmp/bas', 't', '123'), expect.objectContaining({ onCompromised: expect.any(Function) }))
      expect(mockLock.unlock).toHaveBeenCalledWith(p('/tmp/bas', 's', 'abc.ini'), expect.objectContaining({ onCompromised: expect.any(Function) }))
      expect(mockLock.unlock).toHaveBeenCalledWith(p('/tmp/bas', 's', 'abc1.ini'), expect.objectContaining({ onCompromised: expect.any(Function) }))
    })

    it('bỏ qua lỗi ENOENT', async () => {
      mockLock.unlock.mockRejectedValue({ code: 'ENOENT' })
      await expect(cleaner.include('/tmp/bas', '123', 'abc')).resolves.toBeUndefined()
    })
  })

  describe('watch', () => {
    it('trả về this để chain', () => {
      const result = cleaner.watch('/tmp/bas')
      expect(result).toBe(cleaner)
    })

    it('gọi cleanup khi watch lần đầu', async () => {
      cleaner.watch('/tmp/bas')
      await vi.waitFor(() => {
        expect(mockFg).toHaveBeenCalled()
      })
    })
  })

  describe('dừng cleaner', () => {
    it('stop không throw khi chưa watch', async () => {
      await expect(cleaner.stop()).resolves.toBeUndefined()
    })

    it('stop có thể gọi nhiều lần', async () => {
      cleaner.watch('/tmp/bas')
      await cleaner.stop()
      await cleaner.stop()
    })

    it('stop unlock các file đã lock', async () => {
      const oldTime = Date.now() - 20000
      mockFg.mockResolvedValue([
        { path: p('/tmp/bas', 't', '123'), stats: { mtimeMs: oldTime } },
        { path: p('/tmp/bas', 's', 'abc.ini'), stats: { mtimeMs: oldTime } },
      ])
      mockLock.check.mockResolvedValue(true)
      cleaner.watch('/tmp/bas')
      await cleaner.stop()
      expect(mockLock.unlock).toHaveBeenCalled()
    })

    it('stop không unlock file không bị lock', async () => {
      mockFg.mockResolvedValue([
        { path: p('/tmp/bas', 't', '123'), stats: { mtimeMs: Date.now() } },
      ])
      mockLock.check.mockResolvedValue(false)
      cleaner.watch('/tmp/bas')
      const unlockCount = mockLock.unlock.mock.calls.length
      await cleaner.stop()
      expect(mockLock.unlock.mock.calls.length).toBe(unlockCount)
    })
  })

  describe('cleanup', () => {
    it('xoá file cũ (quá CLEANUP_INTERVAL) không bị lock', async () => {
      const oldTime = Date.now() - 20000
      mockFg.mockResolvedValue([
        { path: p('/tmp/bas', 't', 'old.pid'), stats: { mtimeMs: oldTime } },
      ])
      mockLock.check.mockResolvedValue(false)
      cleaner.watch('/tmp/bas')
      await vi.waitFor(() => {
        expect(mockRm).toHaveBeenCalled()
      })
    })

    it('không xoá file còn mới (trong CLEANUP_INTERVAL)', async () => {
      const recentTime = Date.now() - 1000
      mockFg.mockResolvedValue([
        { path: p('/tmp/bas', 't', 'recent.pid'), stats: { mtimeMs: recentTime } },
      ])
      cleaner.watch('/tmp/bas')
      await vi.waitFor(() => {
        expect(mockFg).toHaveBeenCalled()
      })
      expect(mockRm).not.toHaveBeenCalled()
    })

    it('không xoá file cũ đang bị lock', async () => {
      const oldTime = Date.now() - 20000
      mockFg.mockResolvedValue([
        { path: p('/tmp/bas', 't', 'locked.pid'), stats: { mtimeMs: oldTime } },
      ])
      mockLock.check.mockResolvedValue(true)
      cleaner.watch('/tmp/bas')
      await vi.waitFor(() => {
        expect(mockFg).toHaveBeenCalled()
      })
      expect(mockRm).not.toHaveBeenCalled()
    })

    it('bỏ qua entry không có stats', async () => {
      mockFg.mockResolvedValue([
        { path: p('/tmp/bas', 't', 'nostat.pid') },
      ])
      cleaner.watch('/tmp/bas')
      await vi.waitFor(() => {
        expect(mockFg).toHaveBeenCalled()
      })
      expect(mockRm).not.toHaveBeenCalled()
    })
  })
})
