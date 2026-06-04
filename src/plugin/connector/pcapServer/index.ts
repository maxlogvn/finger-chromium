// ─── File: connector/pcapServer/index.ts ──────────────────────────────────
// PCAP Server -- mock TCP server mô phỏng PCAP interface cho engine.
// Xử lý 2 lệnh: 0x01 (request ID), 0x07 (heartbeat).
// Retry port khi EADDRINUSE. Dùng startPromise caching thay once()
// để cho phép restart sau close() và test EADDRINUSE.
// ─────────────────────────────────────────────────────────────────────────────

import net from 'net';
import debug from 'debug';

const log = debug('browser-with-fingerprints:connector:pcapServer');

let server: net.Server | undefined;
let startPromise: Promise<number> | undefined;

/**
 * Khởi động PCAP mock server -- lắng nghe TCP, phản hồi 2 loại lệnh binary.
 * Dùng startPromise caching để đảm bảo chỉ một server được tạo cho mỗi
 * vòng đời (listen -> close -> listen lại được).
 *
 * @param port - Cổng (0 = random)
 * @param host - Địa chỉ (mặc định 127.0.0.1)
 * @returns Port đang lắng nghe
 */
export function listen(port = 0, host = '127.0.0.1'): Promise<number> {
  if (startPromise) return startPromise;

  let id = 0;
  let retried = false;

  startPromise = new Promise<number>((resolve, reject) => {
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
      socket.on('error', (error: Error) => log(error));
    });
    server = svr;

    const onListening = (): void => {
      const address = svr.address();
      if (address && typeof address === 'object') {
        resolve(address.port);
      }
      svr.unref();
    };

    svr.on('error', (error: NodeJS.ErrnoException) => {
      if (error.code === 'EADDRINUSE' && !retried) {
        retried = true;
        setTimeout(() => svr.listen(port, host, onListening), 1000).unref();
      } else {
        startPromise = undefined;
        reject(error);
      }
    });

    svr.listen(port, host, onListening);
  });

  return startPromise;
}

/**
 * Dừng PCAP server -- close TCP connection, giải phóng port.
 * Reset startPromise để cho phép restart server sau này.
 * Set undefined trong callback để tránh race condition.
 */
export const close = (): Promise<void> => {
  return new Promise((resolve) => {
    if (server) {
      server.close(() => {
        server = undefined;
        startPromise = undefined;
        resolve();
      });
    } else {
      resolve();
    }
  });
};
