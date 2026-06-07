// ─── File: index.ts ──────────────────────────────────────────────────────
// PCAP mock server – giả lập PCAP server cho BAS engine.
//
//   1. listen – tạo TCP server, trả về port
//   2. close – dừng server
// ─────────────────────────────────────────────────────────────────────────────

// ─── Imports ─────────────────────────────────────────────────────────────────

import net from 'net';
import debug from 'debug';

const log = debug('browser-with-fingerprints:connector:pcapServer');

// ─── PCAP Server ─────────────────────────────────────────────────────────────

let server: net.Server | undefined;
let startPromise: Promise<number> | undefined;

export function listen(port = 0, host = '127.0.0.1'): Promise<number> {
  if (startPromise) return startPromise;
  let id = 0;
  let retried = false;
  startPromise = new Promise<number>((resolve, reject) => {
    const svr = net.createServer(socket => {
      socket.on('data', (data: Buffer) => {
        if (data.length === 0) return;
        const byte = data[0];
        if (byte === 1) {
          socket.write(new Uint8Array([0x01, 0x04, 0x00, 0x00, 0x00, 0x0a, id & 0xff, id >> 8 & 0xff, id >> 16 & 0xff]));
          id++;
        }
        if (byte === 7) {
          socket.write(new Uint8Array([0x07, 0x00, 0x00, 0x00, 0x00]));
        }
      });
      socket.on('error', (error: Error) => { log(error); });
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

export const close = (): Promise<void> => {
  return new Promise(resolve => {
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