import type Connector from '../../src/plugin/connector';

export interface MockSetupResponse {
  id: string;
  pid: string;
  pwd: string;
  path: string;
  bounds: { width: number; height: number };
  [key: string]: unknown;
}

export const DEFAULT_SETUP_RESPONSE: MockSetupResponse = {
  id: 'mock-id-123',
  pid: '99999',
  pwd: '/tmp/mock/pwd',
  path: '/mock/browser/path',
  bounds: { width: 1280, height: 720 },
};

export class MockConnector {
  setupResponse = { ...DEFAULT_SETUP_RESPONSE };

  async api(name: string, _params: Record<string, unknown> = {}): Promise<unknown> {
    if (name === 'setup') return this.setupResponse;
    if (name === 'fetch') return '{}';
    if (name === 'versions') return ['default'];
    return {};
  }

  get requestTimeout(): number {
    return 30000;
  }

  async cleanup(): Promise<void> {
    // no-op
  }

  setCwd(_value: string): void {
    // no-op
  }

  setRequestTimeout(_value: number): void {
    // no-op
  }

  setEngineTimeout(_value: number): void {
    // no-op
  }
}

export interface MockBrowserContext {
  once: (event: string, handler: () => void) => void;
  pages: () => Array<unknown>;
  close: () => Promise<void>;
  newPage: () => Promise<Record<string, unknown>>;
}

export interface MockLauncher {
  launch: (opts?: Record<string, unknown>) => Promise<MockBrowserContext>;
  launchPersistentContext: (userDataDir: string, opts?: Record<string, unknown>) => Promise<MockBrowserContext>;
}

export function createMockBrowserContext(): MockBrowserContext {
  const handlers: Record<string, Array<() => void>> = {};

  return {
    once(event: string, handler: () => void) {
      (handlers[event] ??= []).push(handler);
    },
    pages: () => [],
    close: async () => {
      handlers['close']?.forEach((h) => h());
    },
    newPage: async () => ({} as Record<string, unknown>),
  };
}

export function createMockLauncher(): MockLauncher {
  const mockContext = createMockBrowserContext();

  return {
    launch: async () => mockContext,
    launchPersistentContext: async () => mockContext,
  };
}
