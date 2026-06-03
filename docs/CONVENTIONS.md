# Quy ước dự án

> Đọc trước khi code. Giúp codebase nhất quán và dễ maintain.

---

## Đặt tên

| Loại             | Convention   | Ví dụ                 |
| ---------------- | ------------ | --------------------- |
| File             | `kebab-case` | `chromium-engine.ts`  |
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
// ─── File: chromium.ts ────────────────────────────────────────────────────
// Namespace điều khiển trình duyệt Chromium với hỗ trợ fingerprint, proxy và profile.
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

Không tự đặt tên section ngoài danh sách trên trừ khi thực sự cần thiết.

### Inline comment

Dùng `// --- Bước N:` để đánh dấu từng bước xử lý bên trong một hàm.

```ts
// --- Bước 1: Hợp nhất options -- mặc định < cấu hình trước < truyền vào lúc launch
this.options = { ...this.options, ...options };

// --- Bước 2: Cấu hình engine với key, thư mục làm việc và profile
this.engine.setServiceKey(this.privateKey);
```

Không dùng comment xuôi nhiều dòng để mô tả các bước -- chỉ dùng `// --- Bước N:`.

### JSDoc

Mọi export (`export const`, `export type`, `export function`, `public method`) phải có JSDoc.
Private field chỉ cần JSDoc nếu có logic không hiển nhiên.

```ts
/**
 * Thay đổi IP WebRTC bằng IP proxy.
 *
 * @default 'replace'
 */
changeWebRTC?: 'enable' | 'disable' | 'replace';
```

### Giải thích tại sao

Comment và JSDoc phải giải thích **tại sao** chứ không chỉ **làm gì**.

```ts
// Tốt
/**
 * Profile được map sang thư mục tạm trước khi dùng để tránh ghi trực tiếp
 * vào thư mục gốc trong lúc browser đang chạy -- tránh corrupt dữ liệu.
 */

// Dở -- chỉ mô tả lại những gì code đã nói
/**
 * Profile được map sang thư mục tạm trước khi dùng,
 * và được sao lưu trở lại dirPath sau khi gọi quit().
 */
```

```ts
// Tốt
/**
 * `headless: false` vì một số fingerprint check phát hiện headless mode.
 */

// Dở
headless: false, // Hiển thị giao diện trình duyệt
```

### Vị trí trong lifecycle

Thứ tự bước lifecycle là implementation detail -- đặt ở inline comment trước hàm,
không đặt trong JSDoc block.

```ts
// Tốt
/**
 * Khởi tạo engine và áp dụng toàn bộ cấu hình đã đăng ký.
 * Tách riêng khỏi `newContext()` để cho phép cấu hình trước khi
 * tốn tài nguyên mở trình duyệt thật.
 */
// --- Bước 1/3 trong lifecycle: phải gọi trước newContext()
launch(...) { ... }

// Dở -- lẫn lộn giữa API doc và implementation note
/**
 * [Bước 1/3] Khởi tạo engine ...
 */
launch(...) { ... }
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

- Dùng `mocha` làm test runner
- File test đặt trong `tests/`
- Đặt tên file test: `<module>.test.ts`
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

### Quy tắc tập trung Known Issues

`docs/KNOWN_ISSUES.md` là **entry point duy nhất** cho mọi bug, known issue, và fix đã được ghi nhận.

- **Roadmap** (`ROADMAP.md`): Không link trực tiếp đến bug fix docs trong trường `Tài liệu`. Nếu feature có bug fix, thêm ghi chú ngắn trong trường `Ghi chú` kèm link `KNOWN_ISSUES.md #N`.
- **Welcome** (`Welcome.md`): Chỉ giữ link tóm tắt đến `KNOWN_ISSUES.md` và GitHub Issues. Không chứa chi tiết issue nào.
- **Khi fix bug**: Cập nhật `KNOWN_ISSUES.md` trước -- chuyển từ OPEN sang FIXED, theo đúng template [`docs/templates/known-issue.template.md`](templates/known-issue.template.md). Thêm link đến design/spec/plan/overview của bug fix. Không sửa Roadmap hay Welcome để thêm chi tiết fix.
- **Quét định kỳ**: Khi thêm issue mới, kiểm tra ROADMAP.md và Welcome.md có tham chiếu inline đến issue đó không; nếu có, thay bằng link `KNOWN_ISSUES.md #N`.

### Đồng bộ với GitHub Issues

Dự án đồng bộ issue giữa local (`docs/KNOWN_ISSUES.md`) và GitHub Issues.

**Quy trình:**
- Mỗi issue local có một GitHub issue tương ứng (ghi trong trường `GitHub:`).
- Entry trong KNOWN_ISSUES.md phải theo template [`docs/templates/known-issue.template.md`](templates/known-issue.template.md).
- Khi fix xong: cập nhật KNOWN_ISSUES.md -> tạo/update GitHub issue -> thêm comment chi tiết (theo template [`docs/templates/github-closing-comment.template.md`](templates/github-closing-comment.template.md)) -> đóng GitHub issue.

### Mục đích

- Tránh trùng lặp thông tin giữa các file.
- Giữ cho Roadmap và Welcome gọn, tập trung vào đúng mục đích của chúng (theo dõi tiến độ và onboarding).
- Người đọc chỉ cần nhớ một nơi để tra cứu issue: `KNOWN_ISSUES.md`.