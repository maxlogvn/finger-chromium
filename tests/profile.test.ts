// ─── File: tests/profile.test.ts ─────────────────────────────────────────────
// Unit test cho AdapterDataManager -- map/unmap/dispose profile directory.
// Dùng thư mục temp thật (fs thật, không mock).
//
//   1. Constructor -- khởi tạo với tempRootDir mặc định / tuỳ chỉnh
//   2. map() -- copy profile từ source sang temp dir
//   3. unmap() -- xoá temp dir
//   4. dispose() -- dọn dẹp instance temp dir
// ─────────────────────────────────────────────────────────────────────────────

import { describe, it, beforeEach, afterEach } from 'mocha';
import { strictEqual, ok, doesNotThrow } from 'node:assert';
import path from 'node:path';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import { AdapterDataManager } from '../src/adapter/playwright/data';

// ─── Helpers: tạo / xoá temp dir ──────────────────────────────────────────────

interface TempContext {
  root: string;
  source: string;
}

async function createTempDir(): Promise<TempContext> {
  const root = await fsp.mkdtemp(path.join(process.cwd(), '.tmp', 'profile-'));
  const source = path.join(root, 'source');
  await fsp.mkdir(source, { recursive: true });
  await fsp.writeFile(path.join(source, 'test.txt'), 'hello');
  return { root, source };
}

async function removeTempDir(ctx: TempContext): Promise<void> {
  await fsp.rm(ctx.root, { recursive: true, force: true }).catch(() => {});
}

// ─── AdapterDataManager ───────────────────────────────────────────────────────

describe('AdapterDataManager', () => {
  let ctx: TempContext;

  beforeEach(async () => {
    ctx = await createTempDir();
  });

  afterEach(async () => {
    await removeTempDir(ctx);
  });

  // ─── Constructor ──────────────────────────────────────────────────────────

  describe('constructor', () => {
    it('nên tạo instance với tempRootDir mặc định', () => {
      const dm = new AdapterDataManager();
      const instanceDir = (dm as unknown as { instanceTempDir: string }).instanceTempDir as string;
      ok(instanceDir.includes('profile'), 'instanceTempDir phải chứa "profile"');
      dm.dispose();
    });

    it('nên tạo instance với tempRootDir chỉ định', () => {
      const dm = new AdapterDataManager({ tempRootDir: ctx.root });
      const instanceDir = (dm as unknown as { instanceTempDir: string }).instanceTempDir as string;
      ok(instanceDir.startsWith(path.resolve(ctx.root)), 'instanceTempDir phải bắt đầu bằng tempRootDir chỉ định');
      dm.dispose();
    });

    it('nên tạo instanceTempDir duy nhất cho mỗi instance', () => {
      const dm1 = new AdapterDataManager();
      const dm2 = new AdapterDataManager();
      const dir1 = (dm1 as unknown as { instanceTempDir: string }).instanceTempDir as string;
      const dir2 = (dm2 as unknown as { instanceTempDir: string }).instanceTempDir as string;
      ok(dir1 !== dir2, 'Hai instance phải có instanceTempDir khác nhau');
      dm1.dispose();
      dm2.dispose();
    });
  });

  // ─── map() ────────────────────────────────────────────────────────────────

  describe('map()', () => {
    it('nên copy file từ source vào instanceTempDir (1 tham số)', () => {
      const dm = new AdapterDataManager({ tempRootDir: ctx.root });
      const result = dm.map(ctx.source);
      const instanceDir = (dm as unknown as { instanceTempDir: string }).instanceTempDir as string;
      strictEqual(result, path.resolve(instanceDir));
      ok(fs.existsSync(path.join(result, 'test.txt')), 'Phải copy được file test.txt');
      dm.dispose();
    });

    it('nên copy file từ source vào target chỉ định (2 tham số)', () => {
      const dm = new AdapterDataManager({ tempRootDir: ctx.root });
      const target = path.join(ctx.root, 'custom-target');
      const result = dm.map(ctx.source, target);
      strictEqual(result, path.resolve(target));
      ok(fs.existsSync(path.join(target, 'test.txt')), 'Phải copy file vào target chỉ định');
      dm.dispose();
    });

    it('nên tạo thư mục đích nếu chưa tồn tại', () => {
      const dm = new AdapterDataManager({ tempRootDir: ctx.root });
      const nestedTarget = path.join(ctx.root, 'deep', 'nested', 'target');
      const result = dm.map(ctx.source, nestedTarget);
      strictEqual(result, path.resolve(nestedTarget));
      ok(fs.existsSync(path.join(nestedTarget, 'test.txt')), 'Phải copy file vào thư mục nested mới tạo');
      dm.dispose();
    });

    it('nên tự động tạo source nếu chưa tồn tại (ensureDir)', () => {
      const dm = new AdapterDataManager({ tempRootDir: ctx.root });
      const nonExistentSource = path.join(ctx.root, 'auto-created');
      const result = dm.map(nonExistentSource);
      ok(fs.existsSync(result), 'Thư mục đích phải được tạo');
      ok(fs.existsSync(nonExistentSource), 'Source cũng phải được tạo nếu chưa tồn tại (ensureDir)');
      dm.dispose();
    });
  });

  // ─── unmap() ──────────────────────────────────────────────────────────────

  describe('unmap()', () => {
    it('nên xoá thư mục đã map thành công', () => {
      const dm = new AdapterDataManager({ tempRootDir: ctx.root });
      const result = dm.map(ctx.source);
      ok(fs.existsSync(result), 'Thư mục phải tồn tại trước khi unmap');
      dm.unmap(result);
      ok(!fs.existsSync(result), 'Thư mục phải bị xoá sau khi unmap');
      dm.dispose();
    });

    it('nên không throw khi path không tồn tại', () => {
      const dm = new AdapterDataManager({ tempRootDir: ctx.root });
      doesNotThrow(() => dm.unmap(path.join(ctx.root, 'non-existent')));
      dm.dispose();
    });

    it('nên làm việc với relative path', () => {
      const dm = new AdapterDataManager({ tempRootDir: ctx.root });
      dm.map(ctx.source);
      const instanceDir = (dm as unknown as { instanceTempDir: string }).instanceTempDir as string;
      ok(fs.existsSync(instanceDir), 'Phải tồn tại trước khi unmap');
      const relativePath = path.relative(process.cwd(), instanceDir);
      dm.unmap(relativePath);
      ok(!fs.existsSync(instanceDir), 'Phải bị xoá sau khi unmap với relative path');
      dm.dispose();
    });
  });

  // ─── dispose() ────────────────────────────────────────────────────────────

  describe('dispose()', () => {
    it('nên xoá instanceTempDir', () => {
      const dm = new AdapterDataManager({ tempRootDir: ctx.root });
      dm.map(ctx.source);
      const instanceDir = (dm as unknown as { instanceTempDir: string }).instanceTempDir as string;
      ok(fs.existsSync(instanceDir), 'instanceTempDir phải tồn tại trước khi dispose');
      dm.dispose();
      ok(!fs.existsSync(instanceDir), 'instanceTempDir phải bị xoá sau khi dispose');
    });

    it('nên gọi dispose() nhiều lần mà không lỗi', () => {
      const dm = new AdapterDataManager({ tempRootDir: ctx.root });
      dm.map(ctx.source);
      dm.dispose();
      doesNotThrow(() => dm.dispose());
    });
  });
});
