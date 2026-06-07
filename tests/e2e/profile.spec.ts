// ─── File: tests/e2e/profile.spec.ts ──────────────────────────────────────
// Kiểm tra profile được ánh xạ sang thư mục temp với tên ngẫu nhiên.
//
//   1. Có useProfile  -> source được map sang temp, tên dạng {timestamp}_{hex}
//   2. Không useProfile -> tự dùng data/profiles/default, vẫn map sang temp
//   3. close() lưu profile về đúng thư mục nguồn
// ─────────────────────────────────────────────────────────────────────────────

import { test, expect } from '../fixtures';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { BROWSER_RUNNING_DIR } from '../../src/adapter/playwright/fluent';

// ─── Constants ──────────────────────────────────────────────────────────────

const PROFILE_TEMP_ROOT = path.join(BROWSER_RUNNING_DIR, 'profile');
const PROFILE_DIR_PATTERN = /^\d{13}_[0-9a-f]{4}$/;

// ─── Helpers ────────────────────────────────────────────────────────────────

function createSourceDir(files: Record<string, string>): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'profile-test-'));
  for (const [name, content] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(dir, name)), { recursive: true });
    fs.writeFileSync(path.join(dir, name), content, 'utf-8');
  }
  return dir;
}

function getMappedDirs(): string[] {
  if (!fs.existsSync(PROFILE_TEMP_ROOT)) return [];
  return fs
    .readdirSync(PROFILE_TEMP_ROOT)
    .filter((name) => PROFILE_DIR_PATTERN.test(name))
    .map((name) => path.join(PROFILE_TEMP_ROOT, name));
}

function findDirWithMarker(marker: string): string | undefined {
  return getMappedDirs().find((d) => fs.existsSync(path.join(d, marker)));
}

// ─── Tests ─────────────────────────────────────────────────────────────────

test.describe('Kiểm tra ánh xạ profile', () => {
  test('dùng useProfile -> profile được map sang temp với tên ngẫu nhiên', async ({ launchContext }) => {
    const marker = `.marker-${crypto.randomUUID()}`;
    const sourceDir = createSourceDir({ [marker]: 'unique' });

    const { page, engine } = await launchContext({
      profileDir: { path: sourceDir },
    });

    await page.goto('about:blank');
    await expect(page).toHaveURL('about:blank');
    expect(await page.evaluate(() => 1 + 1)).toBe(2);

    const mappedDir = findDirWithMarker(marker);
    expect(mappedDir).toBeDefined();
    expect(PROFILE_DIR_PATTERN.test(path.basename(mappedDir!))).toBe(true);
    expect(fs.readFileSync(path.join(mappedDir!, marker), 'utf-8')).toBe('unique');

    await engine.close();
    fs.rmSync(sourceDir, { recursive: true, force: true });
  });

  test('không dùng useProfile -> tự dùng data/profiles/default và map sang temp', async ({ launchContext }) => {
    const { page, engine } = await launchContext();

    await page.goto('about:blank');
    await expect(page).toHaveURL('about:blank');
    expect(await page.evaluate(() => 1 + 1)).toBe(2);

    const allDirs = getMappedDirs();
    expect(allDirs.length).toBeGreaterThanOrEqual(1);
    for (const d of allDirs) {
      expect(PROFILE_DIR_PATTERN.test(path.basename(d))).toBe(true);
    }

    await engine.close();
  });

  test('close() lưu profile về thư mục nguồn', async ({ launchContext }) => {
    const marker = `.marker-${crypto.randomUUID()}`;
    const sourceDir = createSourceDir({ [marker]: 'persistent data' });

    const { page, engine } = await launchContext({
      profileDir: { path: sourceDir },
    });

    await page.goto('about:blank');
    await engine.close();

    expect(fs.existsSync(path.join(sourceDir, marker))).toBe(true);
    expect(fs.readFileSync(path.join(sourceDir, marker), 'utf-8')).toBe('persistent data');

    const sourceContents = fs.readdirSync(sourceDir);
    expect(sourceContents.length).toBeGreaterThan(1);

    fs.rmSync(sourceDir, { recursive: true, force: true });
  });
});
