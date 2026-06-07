# Quy ước dự án

> Đọc trước khi code. Giúp codebase nhất quán và dễ maintain.

---

## Đặt tên

| Loại             | Convention   | Ví dụ                 |
| ---------------- | ------------ | --------------------- |
| File             | `kebab-case` | `chromium-bridge.ts`  |
| Class            | `PascalCase` | `BrowserEngine`       |
| Function         | `camelCase`  | `useFingerprint()`    |
| Type / Interface | `PascalCase` | `FingerprintOptions`  |
| Constant         | `UPPER_CASE` | `BROWSER_RUNNING_DIR` |
| Enum             | `PascalCase` | `DnsMode`             |
| Test file        | `<module>.test.ts` | `chromium.test.ts`     |

---

## Comment & Format code

### Header đầu file

Mỗi file bắt đầu bằng comment `//` mô tả luồng hoạt động chính theo dạng danh sách có thứ tự.
Không dùng JSDoc `/** @file */` hay box ASCII cho phần này.

```ts
// ─── File: fluent.ts ────────────────────────────────────────────────────
// Namespace điều khiển trình duyệt Fluent với hỗ trợ fingerprint, proxy và profile.
//
//   1. Khởi tạo engine (PlaywrightFingerprintPlugin + AdapterDataManager)
//   2. Đăng ký cấu hình (fingerprint, proxy, profile) qua Fluent API
//   3. Khởi động engine -- launch()
//   4. Tạo Playwright BrowserContext -- newContext()
//   5. Dọn dẹp tài nguyên và lưu profile -- quit()
// ─────────────────────────────────────────────────────────────────────────────
```

### Section divider

Dùng divider để chia file thành các phần rõ ràng.

```ts
// ─── Tên phần ─────────────────────────────────────────────────────────────────
```

Các phần thường gặp theo thứ tự:

```ts
// ─── Types ────────────────────────────────────────────────────────────────────
// ─── Constants ────────────────────────────────────────────────────────────────
// ─── Profile ──────────────────────────────────────────────────────────────────
// ─── Runtime ──────────────────────────────────────────────────────────────────
// ─── Configuration Methods ────────────────────────────────────────────────────
// ─── Lifecycle Methods ────────────────────────────────────────────────────────
// ─── Export ───────────────────────────────────────────────────────────────────
```



---

## Kiểu lỗi (Error Handling)

Dùng `PluginError` làm base class cho mọi lỗi engine. Không dùng `Error` thô.

```ts
// Tốt
throw new PluginError('[BrowserEngine] Phương thức launch() chỉ được gọi một lần.');

// Dở
throw new Error('[BrowserEngine] Phương thức launch() chỉ được gọi một lần.');
```

Không để lỗi raw bubble lên client. Luôn dùng `try/catch` và log bằng `console.error` trước khi throw.

Các lỗi có sẵn:

| Class                | Khi nào dùng                              |
| -------------------- | ----------------------------------------- |
| `PluginError`        | Lỗi cơ bản, không thuộc loại nào dưới    |
| `InvalidEngineError` | Engine chưa được tải hoặc giải nén        |
| `EngineTimeoutError` | Timeout khi tải engine                    |
| `RequestTimeoutError`| Timeout khi request                       |
| `MissingKeyError`    | Thiếu key bảo mật                         |

---

## Chrome DevTools Protocol (CDP)

- Dùng `chrome-remote-interface` để giao tiếp CDP
- Inject fingerprint qua CDP message ở cấp độ C/C++ trước khi trình duyệt chạy
- Đảm bảo không để lại dấu vết override trong JavaScript context

---

## Debug logging

- Dùng thư viện `debug` để log theo namespace
- Namespace theo module: `browser-with-fingerprints:connector`, `browser-with-fingerprints:connector:engine`, `browser-with-fingerprints:connector:pcapServer`, `browser-with-fingerprints:cleaner`
- Bật/tắt log qua biến môi trường `DEBUG`

---

## Xử lý đồng bộ (Concurrency)

- Dùng `async-lock` để đồng bộ truy cập profile và tài nguyên dùng chung
- Dùng `proper-lockfile` để lock file tại hệ thống
- Tránh deadlock: luôn mở khóa trong `finally` block

---

## Testing

- Dùng `@playwright/test` làm test runner (xem `playwright.config.ts`)
- File test đặt trong `tests/`
- Đặt tên file test: `<module>.spec.ts`
- Dùng `test.describe` / `test` block (theo chuẩn Playwright Test)
- Không mock Playwright browser -- test với browser thật

---

## Git

- Chỉ commit khi được yêu cầu
- Không commit `.env` hoặc secrets
- Format commit message bằng tiếng Việt

---

## Cấu trúc import

Ưu tiên import theo thứ tự:

1. Node.js built-in (`node:path`, `node:fs`)
2. Third-party (`playwright-core`, `axios`, `debug`)
3. Internal (`../../types/fingerprint`)
4. Type imports (`import type { ... }`)

Ngoại lệ: type import có thể đứng cạnh regular import cùng module nếu giúp dễ đọc hơn.

Không dùng `index.ts` để re-export nội bộ -- chỉ export công khai từ `src/index.ts`.
Ngoại lệ: file adapter có thể re-export type để tiện import (`export type { Foo }`).

---

## Build

- Dùng `tsup` để bundle
- Output: ESM (`dist/index.js`) + CJS (`dist/index.cjs`)
- Build trước khi publish: `npm run build`

---

## Tài liệu (Documentation)

### Quy tắc tập trung Tracking

`docs/TRACKING.md` là **entry point duy nhất** cho mọi bug, feature, và fix đã được ghi nhận.
Issue chi tiết lưu tại `docs/issues/`, mỗi issue một file markdown. Dùng template [`docs/templates/known-issue.template.md`](templates/known-issue.template.md) để tạo file issue mới.

- **Welcome** (`Welcome.md`): Chỉ giữ link tóm tắt đến `TRACKING.md`. Không chứa chi tiết issue nào.
- **Quét định kỳ**: Khi thêm issue mới, kiểm tra Welcome.md có tham chiếu inline đến issue đó không; nếu có, thay bằng link `TRACKING.md`.