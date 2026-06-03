// ─── File: connector/pcapServer/index.ts ──────────────────────────────────
// PCAP Server -- mock TCP server mô phỏng PCAP interface cho engine.
// Xử lý 2 lệnh: 0x01 (request ID), 0x07 (heartbeat).
// Retry port khi EADDRINUSE.
// ─────────────────────────────────────────────────────────────────────────────

import net from 'net';
import once from 'once';
import debug from 'debug';

const log = debug('browser-with-fingerprints:connector:pcapServer');

let server: net.Server | undefined;

/**
 * Khởi động PCAP mock server -- lắng nghe TCP, phản hồi 2 loại lệnh binary.
 * Dùng once() để đảm bảo chỉ một server được tạo.
 *
 * @param port - Cổng (0 = random)
 * @param host - Địa chỉ (mặc định 127.0.0.1)
 * @returns Port đang lắng nghe
 */
export const listen = once((port = 0, host = '127.0.0.1'): Promise<number> => {
  let id = 0;
  let retried = false;
  return new Promise<number>((resolve, reject) => {
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
    };

    svr.on('error', (error: NodeJS.ErrnoException) => {
      if (error.code === 'EADDRINUSE' && !retried) {
        retried = true;
        setTimeout(() => svr.listen(port, host, onListening), 1000).unref();
      } else {
        reject(error);
      }
    });

    svr.listen(port, host, onListening);
  });
});

/**
 * Dừng PCAP server -- close TCP connection, giải phóng port.
 * Set undefined trong callback để tránh race condition.
 */
export const close = (): Promise<void> => {
  return new Promise((resolve) => {
    if (server) {
      server.close(() => {
        server = undefined;
        resolve();
      });
    } else {
      resolve();
    }
  });
};
