// ─── File: download.ts ────────────────────────────────────────────────────
// Download engine ZIP từ GitHub CDN với progress tracking và grace timeout.
//
//   1. exists – kiểm tra file tồn tại
//   2. checksum – tính SHA-1 checksum
//   3. download – tải file với progress callback và force-close safety
//   4. fetch – GET request đơn giản
// ─────────────────────────────────────────────────────────────────────────────

// ─── Imports ─────────────────────────────────────────────────────────────────

import * as fs from 'node:fs/promises';
import { pipeline } from 'node:stream/promises';
import { Transform, type TransformCallback } from 'node:stream';
import { createHash } from 'node:crypto';
import { createReadStream, createWriteStream } from 'node:fs';

import axios from 'axios';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface DownloadProgress {
  bytes: number;
  total: number | undefined;
  percent: number | undefined;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const GRACE_TIMEOUT = 30_000;

// ─── Downloader ──────────────────────────────────────────────────────────────

export class Downloader {
  static async exists(filePath: string): Promise<boolean> {
    return fs.access(filePath).then(() => true, () => false);
  }

  static async checksum(filePath: string): Promise<string> {
    const hash = createHash('sha1');
    await pipeline(createReadStream(filePath), hash);
    return hash.digest('hex');
  }

  static async download(url: string, filePath: string, onProgress?: (p: DownloadProgress) => void, timeout = 0): Promise<void> {
    const writer = createWriteStream(filePath);

    try {
      const response = await axios.get(url, {
        responseType: 'stream',
        timeout,
      });
      const total = Number(response.headers['content-length']) || undefined;
      let bytes = 0;
      let finished = false;

      const progress = new Transform({
        transform(chunk, _encoding, callback) {
          bytes += chunk.length;
          if (onProgress) {
            onProgress({
              bytes,
              total,
              percent: total ? Math.round(bytes / total * 100) : undefined,
            });
          }
          callback(null, chunk);
        },
      });

      // Pipe thủ công thay vì pipeline() để kiểm soát kết thúc stream.
      // GitHub CDN đôi khi không gửi tín hiệu kết thúc stream đúng cách,
      // khiến pipeline() treo vô hạn dù đã nhận đủ bytes.
      response.data.pipe(progress).pipe(writer);

      await new Promise<void>((resolve, reject) => {
        let graceTimer: ReturnType<typeof setTimeout> | undefined;
        let forceClosing = false;

        const done = () => {
          if (graceTimer) clearTimeout(graceTimer);
          if (!finished) {
            finished = true;
            resolve();
          }
        };

        writer.on('finish', () => {
          writer.once('close', done);
        });
        writer.on('error', (err) => {
          if (graceTimer) clearTimeout(graceTimer);
          if (!finished) {
            finished = true;
            if (forceClosing) resolve();
            else reject(err);
          }
        });
        progress.on('error', (err) => {
          if (graceTimer) clearTimeout(graceTimer);
          if (!finished) {
            finished = true;
            if (forceClosing) resolve();
            else reject(err);
          }
        });
        response.data.on('error', (err: Error) => {
          if (graceTimer) clearTimeout(graceTimer);
          if (!finished) {
            finished = true;
            if (forceClosing) resolve();
            else reject(err);
          }
        });

        // Safety: nếu biết total, force-close writer sau 30s kể từ khi nhận đủ bytes
        if (total) {
          const origTransform = progress._transform.bind(progress);
          progress._transform = function (this: Transform, chunk: unknown, _encoding: BufferEncoding, callback: TransformCallback) {
            origTransform(chunk, _encoding, callback);
            if (bytes >= total && !graceTimer) {
              graceTimer = setTimeout(() => {
                if (!finished) {
                  forceClosing = true;
                  response.data.unpipe(progress);
                  progress.unpipe(writer);
                  response.data.destroy();
                  progress.destroy();
                  writer.end();
                }
              }, GRACE_TIMEOUT);
            }
          };
        }
      });
    } catch (err) {
      await fs.unlink(filePath).catch(() => {});
      throw err;
    }
  }

  static async fetch<T = unknown>(url: string, options?: Record<string, unknown>) {
    return axios.get<T>(url, options);
  }
}