import { describe, it, expect, vi } from 'vitest'

describe('mutex module error handling', () => {
  it('throw PluginError khi không load được native module', async () => {
    vi.doMock('module', () => ({
      createRequire: () => (p: string) => {
        if (p.endsWith('.node')) throw new Error('MODULE_NOT_FOUND')
        if (p.endsWith('package.json') || p.includes('package.json')) {
          return { name: 'fingerprint-chromium-engine' }
        }
        throw new Error('MODULE_NOT_FOUND')
      },
    }))

    vi.doMock('../../../../src/plugin/utils', () => ({
      resolvePackageRoot: () => '/fake/package/root',
    }))

    await expect(import('../../../../src/plugin/mutex')).rejects.toThrow()
  })
})
