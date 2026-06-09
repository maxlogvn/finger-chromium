import { describe, it, expect } from 'vitest'
import { PluginError, MissingKeyError, InvalidEngineError, EngineTimeoutError, RequestTimeoutError } from '@src/plugin/errors'

describe('PluginError', () => {
  it('khởi tạo với message và name', () => {
    const err = new PluginError('Test error')
    expect(err).toBeInstanceOf(Error)
    expect(err.name).toBe('PluginError')
    expect(err.message).toBe('Test error')
  })

  it('có stack trace', () => {
    const err = new PluginError('Test error')
    expect(err.stack).toContain('PluginError')
  })

  it('Symbol.toStringTag trả về constructor name', () => {
    const err = new PluginError('Test error')
    expect(err[Symbol.toStringTag]).toBe('PluginError')
  })
})

describe('MissingKeyError', () => {
  it('kế thừa PluginError và thêm hướng dẫn', () => {
    const err = new MissingKeyError('Thiếu key')
    expect(err).toBeInstanceOf(PluginError)
    expect(err).toBeInstanceOf(Error)
    expect(err.name).toBe('MissingKeyError')
    expect(err.message).toContain('Thiếu key')
    expect(err.message).toContain('bạn cần chỉ định key')
  })
})

describe('InvalidEngineError', () => {
  it('kế thừa PluginError và thêm hướng dẫn', () => {
    const err = new InvalidEngineError('Lỗi engine')
    expect(err).toBeInstanceOf(PluginError)
    expect(err.name).toBe('InvalidEngineError')
    expect(err.message).toContain('Lỗi engine')
    expect(err.message).toContain('chưa được tải xuống')
    expect(err.message).toContain('Xóa hoàn toàn')
  })
})

describe('EngineTimeoutError', () => {
  it('kế thừa PluginError và thêm hướng dẫn', () => {
    const err = new EngineTimeoutError('Timeout tải engine')
    expect(err).toBeInstanceOf(PluginError)
    expect(err.name).toBe('EngineTimeoutError')
    expect(err.message).toContain('Timeout tải engine')
    expect(err.message).toContain('setEngineTimeout')
  })
})

describe('RequestTimeoutError', () => {
  it('kế thừa PluginError và thêm hướng dẫn', () => {
    const err = new RequestTimeoutError('Timeout request')
    expect(err).toBeInstanceOf(PluginError)
    expect(err.name).toBe('RequestTimeoutError')
    expect(err.message).toContain('Timeout request')
    expect(err.message).toContain('setRequestTimeout')
  })
})
