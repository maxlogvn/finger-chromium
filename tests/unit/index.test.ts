import { describe, it, expect } from 'vitest'

import { PluginError, MissingKeyError, InvalidEngineError, EngineTimeoutError, RequestTimeoutError, chromium } from '../../src'

describe('index.ts public API', () => {
  describe('error class exports', () => {
    it('export PluginError', () => {
      expect(PluginError).toBeDefined()
      expect(new PluginError('test')).toBeInstanceOf(Error)
    })

    it('export MissingKeyError', () => {
      expect(MissingKeyError).toBeDefined()
      expect(new MissingKeyError('test')).toBeInstanceOf(PluginError)
    })

    it('export InvalidEngineError', () => {
      expect(InvalidEngineError).toBeDefined()
      expect(new InvalidEngineError('test')).toBeInstanceOf(PluginError)
    })

    it('export EngineTimeoutError', () => {
      expect(EngineTimeoutError).toBeDefined()
      expect(new EngineTimeoutError('test')).toBeInstanceOf(PluginError)
    })

    it('export RequestTimeoutError', () => {
      expect(RequestTimeoutError).toBeDefined()
      expect(new RequestTimeoutError('test')).toBeInstanceOf(PluginError)
    })
  })

  describe('BrowserEngine export', () => {
    it('export chromium là alias của BrowserEngine', () => {
      expect(chromium).toBeDefined()
      expect(typeof chromium).toBe('function')
    })

    it('chromium có method newFingerprint', () => {
      expect(chromium.newFingerprint).toBeDefined()
      expect(typeof chromium.newFingerprint).toBe('function')
    })

    it('chromium có constructor và các fluent methods', () => {
      const engine = new chromium()
      expect(typeof engine.useFingerprint).toBe('function')
      expect(typeof engine.useProxy).toBe('function')
      expect(typeof engine.useProfile).toBe('function')
      expect(typeof engine.useLauncher).toBe('function')
      expect(typeof engine.launch).toBe('function')
      expect(typeof engine.newContext).toBe('function')
      expect(typeof engine.close).toBe('function')
    })
  })


})
