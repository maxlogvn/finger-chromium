# Bug #8 — HTTPS Fallback Implementation Plan

> **For agentic workers:** Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Đổi engine download URL từ HTTP sang HTTPS với fallback về HTTP nếu HTTPS fail.

**Architecture:** Thêm helper `fetchWithFallback()` wrapper axios request, thử HTTPS trước, fallback HTTP nếu network error. Áp dụng cho cả metadata fetch và engine binary download.

**Tech Stack:** TypeScript, axios, `src/plugin/connector/engine.ts`

---

### Task 1: Thêm helper `fetchWithFallback` và sửa URL trong `engine.ts`

**Files:**
- Modify: `src/plugin/connector/engine.ts`

- [ ] **Step 1: Thêm helper `fetchWithFallback` sau hàm `download()`**

```typescript
/**
 * Wrapper axios request -- thử HTTPS trước, fallback HTTP nếu lỗi network.
 * Chỉ fallback khi là lỗi network (không fallback cho 404/500).
 */
async function fetchWithFallback<T = unknown>(url: string, options?: Record<string, unknown>): Promise<import('axios').AxiosResponse<T>> {
  const httpsUrl = url.replace(/^http:/, 'https:');
  try {
    return await axios.get<T>(httpsUrl, options as Record<string, unknown>);
  } catch (httpsErr) {
    const axiosErr = httpsErr as { code?: string; response?: { status: number } };
    // Chỉ fallback nếu là lỗi network (không có response), không fallback cho 4xx/5xx
    if (axiosErr.code === 'ERR_NETWORK' || axiosErr.code === 'ECONNREFUSED' || axiosErr.code === 'ECONNRESET' || !axiosErr.response) {
      debug(`HTTPS failed, falling back to HTTP: ${url}`);
      return await axios.get<T>(url, options as Record<string, unknown>);
    }
    throw httpsErr;
  }
}
```

- [ ] **Step 2: Đổi metadata URL từ HTTP sang HTTPS (dòng 389)**

Sửa URL fetch metadata:
```typescript
// Before (dòng 389):
const url = `http://bablosoft.com/distr/FastExecuteScript${ARCH}/${version}/FastExecuteScript.x${ARCH}.zip.meta.json`;

// After:
const url = `https://bablosoft.com/distr/FastExecuteScript${ARCH}/${version}/FastExecuteScript.x${ARCH}.zip.meta.json`;
```

- [ ] **Step 3: Dùng `fetchWithFallback` cho metadata fetch (dòng 397)**

```typescript
// Before (dòng 396-397):
debug(`Yêu cầu metadata mới từ ${url}`);
const { data } = await axios.get<{ Checksum: string; Url: string }>(url);

// After:
debug(`Yêu cầu metadata mới từ ${url}`);
const { data } = await fetchWithFallback<{ Checksum: string; Url: string }>(url);
```

- [ ] **Step 4: Dùng `fetchWithFallback` cho download engine binary (hàm `download()`)**

```typescript
// Before (dòng 129-133):
async function download(url: string, filePath: string): Promise<void> {
  const response = await axios.get(url, { responseType: 'stream' });
  const writer = createWriteStream(filePath);
  await pipeline(response.data, writer);
}

// After:
async function download(url: string, filePath: string): Promise<void> {
  const response = await fetchWithFallback(url, { responseType: 'stream' });
  const writer = createWriteStream(filePath);
  await pipeline(response.data, writer);
}
```

- [ ] **Step 5: Upgrade download URL từ metadata lên HTTPS trước khi dùng**

Trong `#startProcessInternal()`, dòng gọi `download(this.#meta!.url, zipPath)` — URL từ metadata là HTTP. Cần upgrade trước khi truyền vào:

```typescript
// Before (dòng 287):
await download(this.#meta!.url, zipPath);

// After:
await download(this.#meta!.url.replace(/^http:/, 'https:'), zipPath);
```

Nhưng `fetchWithFallback` đã tự động upgrade HTTPS, nên chỉ cần đảm bảo URL được upgrade trước khi vào `download()`. Tuy nhiên `download()` gọi `fetchWithFallback` rồi nên URL vào `download()` có thể là HTTP — `fetchWithFallback` sẽ tự upgrade. Vậy không cần sửa dòng này — `fetchWithFallback` đã xử lý.

- [ ] **Step 6: Chạy lint + typecheck để verify**

```bash
npm run lint && npm run typecheck
```

Expected: pass.

- [ ] **Step 7: Chạy build để verify bundle

```bash
npm run build
```

Expected: dist/index.js và dist/index.cjs được tạo.
