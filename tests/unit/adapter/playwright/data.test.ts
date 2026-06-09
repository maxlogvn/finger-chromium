import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'

vi.mock('../../../../src/adapter/playwright/fluent', () => ({
  BROWSER_RUNNING_DIR: os.tmpdir(),
}))

const { AdapterDataManager } = await import('../../../../src/adapter/playwright/data')
const { PluginError } = await import('@src/plugin/errors')

describe('AdapterDataManager', () => {
  let tempRoot: string

  beforeEach(() => {
    tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'data-test-'))
  })

  afterEach(() => {
    fs.rmSync(tempRoot, { recursive: true, force: true })
  })

  describe('constructor', () => {
    it('tạo instanceTempDir từ tempRootDir', () => {
      const mgr = new AdapterDataManager({ tempRootDir: tempRoot })
      expect(mgr).toBeDefined()
      expect(tempRoot).toContain('data-test-')
    })

    it('dùng tempRootDir mặc định khi không truyền options', () => {
      const mgr = new AdapterDataManager()
      expect(mgr).toBeDefined()
    })
  })

  describe('map', () => {
    it('sao chép thư mục từ source sang dest', () => {
      const srcDir = path.join(tempRoot, 'source')
      const destDir = path.join(tempRoot, 'dest')
      fs.mkdirSync(srcDir, { recursive: true })
      fs.writeFileSync(path.join(srcDir, 'test.txt'), 'hello')

      const mgr = new AdapterDataManager({ tempRootDir: tempRoot })
      const result = mgr.map(srcDir, destDir)

      expect(result).toBe(path.resolve(destDir))
      expect(fs.existsSync(path.join(destDir, 'test.txt'))).toBe(true)
      expect(fs.readFileSync(path.join(destDir, 'test.txt'), 'utf-8')).toBe('hello')
    })

    it('tạo thư mục đích nếu chưa tồn tại', () => {
      const srcDir = path.join(tempRoot, 'source')
      const destDir = path.join(tempRoot, 'nested', 'dest')
      fs.mkdirSync(srcDir, { recursive: true })
      fs.writeFileSync(path.join(srcDir, 'a.txt'), 'data')

      const mgr = new AdapterDataManager({ tempRootDir: tempRoot })
      mgr.map(srcDir, destDir)

      expect(fs.existsSync(path.join(destDir, 'a.txt'))).toBe(true)
    })

    it('sao chép toàn bộ cây thư mục', () => {
      const srcDir = path.join(tempRoot, 'source')
      fs.mkdirSync(path.join(srcDir, 'sub'), { recursive: true })
      fs.writeFileSync(path.join(srcDir, 'root.txt'), 'root')
      fs.writeFileSync(path.join(srcDir, 'sub', 'child.txt'), 'child')

      const mgr = new AdapterDataManager({ tempRootDir: tempRoot })
      mgr.map(srcDir, path.join(tempRoot, 'dest'))

      expect(fs.existsSync(path.join(tempRoot, 'dest', 'root.txt'))).toBe(true)
      expect(fs.existsSync(path.join(tempRoot, 'dest', 'sub', 'child.txt'))).toBe(true)
    })

    it('tạo source directory nếu chưa tồn tại (ensureDir)', () => {
      const missingDir = path.join(tempRoot, 'auto-created')
      const destDir = path.join(tempRoot, 'dest')
      const mgr = new AdapterDataManager({ tempRootDir: tempRoot })
      const result = mgr.map(missingDir, destDir)
      expect(result).toBe(path.resolve(destDir))
      expect(fs.existsSync(missingDir)).toBe(true)
    })

    it('sử dụng instanceTempDir mặc định khi không truyền targetDir', () => {
      const srcDir = path.join(tempRoot, 'source')
      fs.mkdirSync(srcDir, { recursive: true })
      fs.writeFileSync(path.join(srcDir, 'f.txt'), 'data')

      const mgr = new AdapterDataManager({ tempRootDir: tempRoot })
      const result = mgr.map(srcDir)

      expect(result).toContain(tempRoot)
      expect(fs.existsSync(path.join(result, 'f.txt'))).toBe(true)
    })

    it('ghi đè file đã tồn tại ở đích', () => {
      const srcDir = path.join(tempRoot, 'source')
      const destDir = path.join(tempRoot, 'dest')
      fs.mkdirSync(srcDir, { recursive: true })
      fs.mkdirSync(destDir, { recursive: true })
      fs.writeFileSync(path.join(srcDir, 'f.txt'), 'new')
      fs.writeFileSync(path.join(destDir, 'f.txt'), 'old')

      const mgr = new AdapterDataManager({ tempRootDir: tempRoot })
      mgr.map(srcDir, destDir)

      expect(fs.readFileSync(path.join(destDir, 'f.txt'), 'utf-8')).toBe('new')
    })
  })

  describe('unmap', () => {
    it('xoá thư mục đích', () => {
      const dir = path.join(tempRoot, 'todelete')
      fs.mkdirSync(dir, { recursive: true })
      fs.writeFileSync(path.join(dir, 'x.txt'), 'data')

      const mgr = new AdapterDataManager({ tempRootDir: tempRoot })
      mgr.unmap(dir)

      expect(fs.existsSync(dir)).toBe(false)
    })

    it('xoá thư mục không rỗng', () => {
      const dir = path.join(tempRoot, 'nested')
      fs.mkdirSync(path.join(dir, 'sub'), { recursive: true })
      fs.writeFileSync(path.join(dir, 'a.txt'), 'a')
      fs.writeFileSync(path.join(dir, 'sub', 'b.txt'), 'b')

      const mgr = new AdapterDataManager({ tempRootDir: tempRoot })
      mgr.unmap(dir)

      expect(fs.existsSync(dir)).toBe(false)
    })

    it('cảnh báo khi thư mục không tồn tại', () => {
      const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const mgr = new AdapterDataManager({ tempRootDir: tempRoot })
      mgr.unmap(path.join(tempRoot, 'nonexistent'))
      expect(consoleWarn).toHaveBeenCalled()
      consoleWarn.mockRestore()
    })

    it('không throw khi xoá thư mục không tồn tại', () => {
      const mgr = new AdapterDataManager({ tempRootDir: tempRoot })
      expect(() => mgr.unmap(path.join(tempRoot, 'ghost'))).not.toThrow()
    })
  })

  describe('dispose', () => {
    it('xoá instanceTempDir', () => {
      const mgr = new AdapterDataManager({ tempRootDir: tempRoot })
      fs.mkdirSync(mgr['instanceTempDir'], { recursive: true })
      fs.writeFileSync(path.join(mgr['instanceTempDir'], 'data.txt'), 'x')
      expect(fs.existsSync(mgr['instanceTempDir'])).toBe(true)
      mgr.dispose()
      expect(fs.existsSync(mgr['instanceTempDir'])).toBe(false)
    })
  })
})
