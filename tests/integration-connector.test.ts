// --- File: tests/integration-connector.test.ts ---------------------------------
// Integration test cho connector module voi engine binary that (FastExecuteScript.exe).
// Chi chay khi BABLOSOFT_KEY duoc set.
//
//   1. Start PCAP mock server (local TCP, khong dung pcapServer module -- tranh once() issue)
//   2. Tao temp working directory
//   3. Test RemoteEngine.runFunction('ping') voi key that
//   4. Cleanup temp directory + PCAP server
// --------------------------------------------------------------------------------

import { describe, it, before, after } from 'mocha';
import { strictEqual, ok } from 'node:assert';
import path from 'node:path';
import fs from 'node:fs/promises';
import net from 'node:net';
import RemoteEngine from '../src/plugin/connector/engine';

const BABLOSOFT_KEY = process.env.BABLOSOFT_KEY;

/**
 * Create a local PCAP mock server (similar to pcapServer/index.ts).
 * Uses a separate server to avoid once() issue with the pcapServer module --
 * other test files may have already consumed the once() call.
 */
async function startLocalPcapServer(): Promise<{ port: number; close: () => Promise<void> }> {
  return new Promise((resolve, reject) => {
    let id = 0;
    const svr = net.createServer((socket) => {
      socket.on('data', (data: Buffer) => {
        if (data.length === 0) return;
        const byte = data[0];
        if (byte === 1) {
          socket.write(
            new Uint8Array([0x01, 0x04, 0x00, 0x00, 0x00, 0x0a, id & 0xff, (id >> 8) & 0xff, (id >> 16) & 0xff])
          );
          id++;
        }
        if (byte === 7) {
          socket.write(new Uint8Array([0x07, 0x00, 0x00, 0x00, 0x00]));
        }
      });
      socket.on('error', () => {});
    });

    svr.on('error', reject);

    svr.listen(0, '127.0.0.1', () => {
      const address = svr.address();
      if (address && typeof address === 'object') {
        svr.unref();
        resolve({
          port: address.port,
          close: () => new Promise<void>((res) => svr.close(() => res())),
        });
      } else {
        reject(new Error('Cannot get server address'));
      }
    });
  });
}

const suite = BABLOSOFT_KEY ? describe : describe.skip;

suite('Integration - real engine binary', () => {
  let tempDir: string;
  let pcapPort: number;
  let pcapClose: () => Promise<void>;

  before(async function () {
    this.timeout(120_000);
    tempDir = await fs.mkdtemp(path.join(process.cwd(), '.tmp', 'integration-'));
    const pcap = await startLocalPcapServer();
    pcapPort = pcap.port;
    pcapClose = pcap.close;
  });

  after(async () => {
    await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
    await pcapClose().catch(() => {});
  });

  it('should call ping successfully with valid key', async () => {
    const engine = new RemoteEngine({ cwd: tempDir, engineTimeout: 120_000 });
    engine.setArgs([`--mock-pcap-port=${pcapPort}`]);

    const result = await engine.runFunction('ping', { key: BABLOSOFT_KEY });

    ok(result.error === undefined || result.error === null, `result.error = ${result.error}`);
    ok(result.response !== undefined, 'result.response must exist');
  });

  it('should return key is missing error when no key provided', async () => {
    const engine = new RemoteEngine({ cwd: tempDir, engineTimeout: 120_000 });
    engine.setArgs([`--mock-pcap-port=${pcapPort}`]);

    const result = await engine.runFunction('ping', {});

    strictEqual(result.error, 'key is missing');
  });

  it('should reuse engine process for multiple IPC calls', async () => {
    const engine = new RemoteEngine({ cwd: tempDir, engineTimeout: 120_000 });
    engine.setArgs([`--mock-pcap-port=${pcapPort}`]);

    for (let i = 0; i < 3; i++) {
      const result = await engine.runFunction('ping', { key: BABLOSOFT_KEY });
      ok(result.error === undefined || result.error === null, `Call ${i + 1}: result.error = ${result.error}`);
      ok(result.response !== undefined, `Call ${i + 1}: response must exist`);
    }
  });
});
