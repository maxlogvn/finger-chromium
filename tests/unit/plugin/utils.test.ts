import path from 'node:path'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PluginError } from '@src/plugin/errors'

const mockRequire = vi.fn()
vi.mock('module', () => ({
  createRequire: () => mockRequire,
}))

const { defaultArgs, getProfilePath, validateConfig, validateLauncher, resolvePackageRoot } = await import('@src/plugin/utils')

describe('defaultArgs', () => {
  it('trả về array với đối số mặc định', () => {
    const args = defaultArgs()
    expect(Array.isArray(args)).toBe(true)
    expect(args.length).toBeGreaterThan(0)
  })

  it('luôn chứa --user-data-dir', () => {
    const args = defaultArgs({ profile: '/tmp/test' })
    expect(args).toContain('--user-data-dir=/tmp/test')
  })

  it('thêm --hide-scrollbars và --mute-audio khi headless', () => {
    const args = defaultArgs({ headless: true })
    expect(args).toContain('--hide-scrollbars')
    expect(args).toContain('--mute-audio')
  })

  it('thêm --bas-force-visible-window khi không headless', () => {
    const args = defaultArgs({ headless: false })
    expect(args).toContain('--bas-force-visible-window')
  })

  it('mặc định headless = true khi devtools = false', () => {
    const args = defaultArgs({ devtools: false })
    expect(args).toContain('--hide-scrollbars')
  })

  it('mặc định headless = false khi devtools = true', () => {
    const args = defaultArgs({ devtools: true })
    expect(args).toContain('--bas-force-visible-window')
  })

  it('loại bỏ các arg bị ignore', () => {
    const args = defaultArgs({
      args: ['--kiosk', '--headless', '--user-data-dir=/custom', '--start-maximized'],
    })
    expect(args).not.toContain('--kiosk')
    expect(args).not.toContain('--headless')
    expect(args).not.toContain('--start-maximized')
    expect(args).toContain('--user-data-dir=')
  })

  it('thêm --load-extension khi có extensions', () => {
    const args = defaultArgs({ extensions: ['ext1', 'ext2'] })
    expect(args).toContain('--load-extension=ext1,ext2')
  })

  it('xử lý disable-extensions-except với extensions', () => {
    const args = defaultArgs({
      args: ['--disable-extensions-except=existing-ext'],
      extensions: ['my-ext'],
    })
    const flag = args.find(a => a.startsWith('--disable-extensions-except'))
    expect(flag).toContain('my-ext')
    expect(flag).toContain('existing-ext')
  })

  it('luôn chứa DEFAULT_ARGS', () => {
    const args = defaultArgs()
    expect(args).toContain('--lang=en')
    expect(args).toContain('--no-proxy-server')
  })
})

describe('getProfilePath', () => {
  it('trả về userDataDir nếu được cung cấp', () => {
    const result = getProfilePath({ userDataDir: 'C:\\profiles\\test' })
    expect(result).toBe(path.resolve('C:\\profiles\\test'))
  })

  it('trích xuất từ --user-data-dir trong args', () => {
    const result = getProfilePath({ args: ['--user-data-dir=/path/to/profile'] })
    expect(result).toBe('/path/to/profile')
  })

  it('trả về chuỗi rỗng nếu không tìm thấy', () => {
    const result = getProfilePath({ args: ['--no-sandbox'] })
    expect(result).toBe('')
  })

  it('trả về chuỗi rỗng với options rỗng', () => {
    const result = getProfilePath()
    expect(result).toBe('')
  })
})

describe('validateConfig', () => {
  it('không throw với tham số hợp lệ', () => {
    expect(() => validateConfig('fingerprint', 'valid-key', {})).not.toThrow()
  })

  it('throw PluginError nếu value không phải string', () => {
    expect(() => validateConfig('test', 123 as any, {})).toThrow(PluginError)
  })

  it('throw PluginError nếu options không phải object', () => {
    expect(() => validateConfig('test', 'key', 'not-object' as any)).toThrow(PluginError)
  })

  it('throw PluginError nếu options là null', () => {
    expect(() => validateConfig('test', 'key', null)).toThrow(PluginError)
  })

  it('message chứa tên config', () => {
    expect(() => validateConfig('proxy', 123 as any, {})).toThrow('proxy')
  })
})

describe('validateLauncher', () => {
  it('không throw với launcher hợp lệ', () => {
    const launcher = { launch: () => {} }
    expect(() => validateLauncher(launcher)).not.toThrow()
  })

  it('throw PluginError nếu launcher là null', () => {
    expect(() => validateLauncher(null)).toThrow(PluginError)
  })

  it('throw PluginError nếu launcher không có method launch', () => {
    expect(() => validateLauncher({})).toThrow(PluginError)
  })

  it('throw PluginError nếu launcher không phải object', () => {
    expect(() => validateLauncher('not-a-launcher')).toThrow(PluginError)
  })

  it('message mô tả yêu cầu', () => {
    expect(() => validateLauncher(null)).toThrow('có method "launch"')
  })
})

describe('resolvePackageRoot', () => {
  beforeEach(() => {
    mockRequire.mockReset()
  })

  it('trả về thư mục gốc khi tìm thấy package.json khớp', () => {
    mockRequire.mockImplementation((p: string) => {
      if (p.includes('finger-chromium') && !p.includes('node_modules')) {
        return { name: 'fingerprint-chromium-engine' }
      }
      throw new Error('MODULE_NOT_FOUND')
    })
    const result = resolvePackageRoot('/some/path/finger-chromium/src')
    expect(result).toBe('/some/path/finger-chromium/src')
  })

  it('đi lên thư mục cha nếu thư mục hiện tại không khớp', () => {
    let callCount = 0
    mockRequire.mockImplementation(() => {
      callCount++
      if (callCount === 1) return { name: 'some-lib' }
      return { name: 'fingerprint-chromium-engine' }
    })
    const result = resolvePackageRoot('/repo/src')
    expect(result).toBeDefined()
    expect(callCount).toBeGreaterThanOrEqual(2)
  })

  it('throw PluginError khi không tìm thấy package.json nào khớp', () => {
    mockRequire.mockImplementation(() => {
      throw new Error('MODULE_NOT_FOUND')
    })
    expect(() => resolvePackageRoot('/some/path')).toThrow(PluginError)
  })

  it('message lỗi chứa nội dung mô tả', () => {
    mockRequire.mockImplementation(() => {
      throw new Error('MODULE_NOT_FOUND')
    })
    expect(() => resolvePackageRoot('/some/path')).toThrow('Không tìm thấy thư mục gốc')
  })
})
