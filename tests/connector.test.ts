// ─── File: tests/connector.test.ts ─────────────────────────────────────────
// Unit test cho connector module: RemoteEngine, Connector, PCAP Server.
//
//   1. PCAP Server — listen/close, lệnh binary, EADDRINUSE retry
//   2. RemoteEngine — constructor, setters, helpers, kill
//   3. Connector — api(), error normalization, cleanup
// ─────────────────────────────────────────────────────────────────────────────

import { describe, it, before, after, beforeEach } from 'mocha';
import {
  strictEqual,
  ok,
  rejects,
  doesNotThrow,
} from 'node:assert';
import net from 'node:net';
import path from 'node:path';
import fs from 'node:fs/promises';
import http from 'node:http';
import crypto from 'node:crypto';
import RemoteEngine, {
  exists,
  checksum,
  download,
} from '../src/plugin/connector/engine';
import { MissingKeyError, PluginError } from '../src/plugin/errors';
import * as pcapServer from '../src/plugin/connector/pcapServer';

// ─── PCAP Server ──────────────────────────────────────────────────────────────

describe('PCAP Server', () => {
  let port: number;
  let pcapClose: typeof pcapServer.close;

  before(async () => {
    port = await pcapServer.listen(0);
    pcapClose = pcapServer.close;
  });

  after(async () => {
    await pcapClose();
  });

  it('nên trả về port > 0 khi listen thành công', () => {
    ok(port > 0, `port = ${port}`);
  });

  it('nên phản hồi request ID (0x01) đúng format', async () => {
    const sock = net.connect(port);
    const response = await new Promise<Buffer>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Timeout')), 2000).unref();
      sock.on('data', (data: Buffer) => {
        clearTimeout(timeout);
        resolve(data);
        sock.end();
      });
      sock.on('error', reject);
      sock.write(new Uint8Array([0x01]));
    });

    strictEqual(response[0], 0x01, 'byte 0 = 0x01');
    strictEqual(response[1], 0x04, 'byte 1 = 0x04 (data length)');
    ok(response.length >= 6, 'response đủ dài');
  });

  it('nên phản hồi heartbeat (0x07) đúng format', async () => {
    const sock = net.connect(port);
    const response = await new Promise<Buffer>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Timeout')), 2000).unref();
      sock.on('data', (data: Buffer) => {
        clearTimeout(timeout);
        resolve(data);
        sock.end();
      });
      sock.on('error', reject);
      sock.write(new Uint8Array([0x07]));
    });

    strictEqual(response[0], 0x07, 'byte 0 = 0x07');
    strictEqual(response[1], 0x00, 'byte 1 = 0x00');
  });

  it('nên ignore data rỗng (không crash)', async () => {
    const sock = net.connect(port);
    const result = await new Promise<'ok' | 'timeout'>((resolve) => {
      const timeout = setTimeout(() => resolve('timeout'), 500).unref();
      sock.on('data', () => {
        clearTimeout(timeout);
        resolve('ok');
      });
      sock.on('error', () => {});
      sock.write(Buffer.alloc(0));
    });

    strictEqual(result, 'timeout', 'không có response khi gửi data rỗng');
    sock.end();
  });

  it('nên close server thành công', async () => {
    const closePort = await pcapServer.listen(0);
    await pcapServer.close();

    const sock = net.connect(closePort);
    const connected = await new Promise<boolean>((resolve) => {
      sock.on('connect', () => resolve(true));
      sock.on('error', () => resolve(false));
      setTimeout(() => resolve(false), 1000).unref();
    });

    strictEqual(connected, false, 'server đã đóng, không kết nối được');
    sock.destroy();
  });
});

// ─── RemoteEngine ─────────────────────────────────────────────────────────────

describe('RemoteEngine', () => {
  // ─── Constructor + Setters ──────────────────────────────────────────────

  describe('constructor + setters', () => {
    it('nên khởi tạo với default options (requestTimeout = 0, không set nghĩa là 0)', () => {
      const engine = new RemoteEngine();
      strictEqual(engine.requestTimeout, 0);
    });

    it('nên khởi tạo với custom options', () => {
      const engine = new RemoteEngine({ requestTimeout: 5000 });
      strictEqual(engine.requestTimeout, 5000);
    });

    it('setCwd không throw', () => {
      const engine = new RemoteEngine();
      doesNotThrow(() => engine.setCwd('/tmp/test'));
    });

    it('setArgs không throw', () => {
      const engine = new RemoteEngine();
      doesNotThrow(() => engine.setArgs(['--debug', '--verbose']));
    });

    it('setEngineTimeout không throw', () => {
      const engine = new RemoteEngine();
      doesNotThrow(() => engine.setEngineTimeout(60000));
      doesNotThrow(() => engine.setEngineTimeout(-1));
    });

    it('setRequestTimeout nên lưu timeout', () => {
      const engine = new RemoteEngine();
      engine.setRequestTimeout(30000);
      strictEqual(engine.requestTimeout, 30000);
    });

    it('setRequestTimeout với giá trị 0 nên giữ nguyên', () => {
      const engine = new RemoteEngine();
      engine.setRequestTimeout(0);
      strictEqual(engine.requestTimeout, 0);
    });
  });

  // ─── Helpers ────────────────────────────────────────────────────────────

  describe('helpers', () => {
    let tmpDir: string;

    beforeEach(async () => {
      tmpDir = await fs.mkdtemp(path.join(process.cwd(), '.tmp', 'engine-test-'));
    });

    after(async () => {
      await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
    });

    describe('exists()', () => {
      it('nên trả về true khi file tồn tại', async () => {
        const filePath = path.join(tmpDir, 'test.txt');
        await fs.writeFile(filePath, 'hello');
        strictEqual(await exists(filePath), true);
      });

      it('nên trả về false khi file không tồn tại', async () => {
        strictEqual(await exists(path.join(tmpDir, 'nonexistent.txt')), false);
      });
    });

    describe('checksum()', () => {
      it('nên tính SHA1 checksum chính xác', async () => {
        const content = 'test content for checksum';
        const filePath = path.join(tmpDir, 'checksum.txt');
        await fs.writeFile(filePath, content);

        const expected = crypto.createHash('sha1').update(content).digest('hex');
        strictEqual(await checksum(filePath), expected);
      });
    });

    describe('download()', () => {
      it('nên download thành công và tạo file', async () => {
        const content = 'download test content';
        let serverPort: number;

        // Tạo HTTP server trả về content
        const server = http.createServer((_req, res) => {
          res.writeHead(200, { 'Content-Type': 'text/plain' });
          res.end(content);
        });
        await new Promise<void>((resolve) => server.listen(0, () => resolve()));
        serverPort = (server.address() as any).port;

        const filePath = path.join(tmpDir, 'downloaded.txt');
        // Dùng http URL để test HTTPS fallback
        await download(`http://localhost:${serverPort}/file`, filePath);

        const result = await fs.readFile(filePath, 'utf8');
        strictEqual(result, content);

        server.close();
      });

      it('nên cleanup file .tmp khi download thất bại', async () => {
        const filePath = path.join(tmpDir, 'fail.txt');
        const tmpPath = filePath + '.tmp';

        // Download từ URL không tồn tại
        await rejects(download('http://localhost:1/nonexistent', filePath));

        // File .tmp phải được xoá
        const tmpExists = await exists(tmpPath);
        strictEqual(tmpExists, false);
      });
    });
  });

  // ─── kill() ─────────────────────────────────────────────────────────────

  describe('kill()', () => {
    it('nên không throw khi chưa có process', async () => {
      const engine = new RemoteEngine();
      await engine.kill();
    });

    it('nên không throw khi gọi kill nhiều lần (idempotent)', async () => {
      const engine = new RemoteEngine();
      await engine.kill();
      await engine.kill();
      await engine.kill();
    });

    it('nên resolve ngay khi không có process', async () => {
      const engine = new RemoteEngine();
      const start = Date.now();
      await engine.kill();
      const elapsed = Date.now() - start;
      ok(elapsed < 100, `kill mất ${elapsed}ms (kỳ vọng < 100ms)`);
    });
  });
});

// ─── Connector ────────────────────────────────────────────────────────────────

describe('Connector', () => {
  let ConnectorClass: typeof import('../src/plugin/connector/index').default;

  before(async () => {
    const mod = await import('../src/plugin/connector/index');
    ConnectorClass = mod.default;
  });

  describe('constructor + setters', () => {
    it('nên tạo instance Connector với options', () => {
      const connector = new ConnectorClass({ requestTimeout: 5000 });
      strictEqual(connector.requestTimeout, 5000);
    });

    it('nên tạo instance với default options', () => {
      const connector = new ConnectorClass();
      strictEqual(connector.requestTimeout, 0);
    });
  });

  describe('api() error normalization', () => {
    beforeEach(() => {
      // Reset mock mỗi lần
      RemoteEngine.prototype.runFunction = async () => ({ response: null });
    });

    it('nên throw MissingKeyError khi engine trả về "key is missing"', async () => {
      RemoteEngine.prototype.runFunction = async () => ({ error: 'key is missing' });

      const connector = new ConnectorClass();
      await rejects(
        () => connector.api('test', {}),
        MissingKeyError
      );
    });

    it('nên throw PluginError khi engine trả về lỗi khác', async () => {
      RemoteEngine.prototype.runFunction = async () => ({ error: 'some unknown error' });

      const connector = new ConnectorClass();
      await rejects(
        () => connector.api('test', {}),
        PluginError
      );
    });

    it('nên trả về response khi engine thành công', async () => {
      RemoteEngine.prototype.runFunction = async () => ({ response: { data: 'ok' } });

      const connector = new ConnectorClass();
      const result = await connector.api('test', {}) as { data: string };
      strictEqual(result.data, 'ok');
    });

    it('nên trả về result khi không có response field', async () => {
      RemoteEngine.prototype.runFunction = async () => ({ result: 'direct' });

      const connector = new ConnectorClass();
      const result = await connector.api('test', {}) as { result: string };
      strictEqual(result.result, 'direct');
    });
  });

  describe('cleanup()', () => {
    it('nên không throw khi gọi cleanup', async () => {
      const connector = new ConnectorClass();
      doesNotThrow(() => connector.cleanup());
      await connector.cleanup();
    });
  });
});
