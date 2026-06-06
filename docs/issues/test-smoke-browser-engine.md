# Known Issue: Smoke Test E2E cho BrowserEngine (`tests/smoke/browser-engine.spec.ts`)

> **Chú ý:** Template này dùng cho **body của GitHub issue**, chỉ mô tả vấn đề -- không đề xuất giải pháp.

## Mô tả

Hiện tại dự án chưa có smoke test E2E nào cho `BrowserEngine` (class Fluent API chính). Các unit test core (`tests/unit/core.spec.ts`) đã hoàn thành nhưng chỉ test module phụ trợ (errors, exports, config) -- không động đến engine thật.

Cần có smoke test cho luồng chính của `BrowserEngine` từ khởi tạo đến dọn dẹp, bao gồm:
- Lifecycle cơ bản: launch -> newContext -> quit.
- Cấu hình nâng cao: fingerprint, proxy, profile qua Fluent API.
- Xử lý lỗi: gọi sai thứ tự lifecycle.
- Lấy fingerprint từ service.

### API thực tế (đối chiếu từ code)

| Method | Signature thật |
|--------|---------------|
| `constructor` | `new BrowserEngine(launcher?: Launcher)` -- key private, inject qua `createEngine()` hoặc env |
| `launch()` | `(options?: Partial<PluginLaunchOptions>): this` -- trả về `this`, throw nếu gọi lại |
| `newContext()` | `(options?: Partial<PluginLaunchOptions>): Promise<BrowserContext>` -- throw nếu chưa launch hoặc context đã tồn tại |
| `quit()` | `(saveDataPath?: string): Promise<void>` -- graceful nếu chưa launch (no-op) |
| `useFingerprint()` | `(data: string, options?: FingerprintOptions): this` -- `data` là JSON string |
| `useProxy()` | `(data: string, options?: ProxyOptions): this` -- `data` là URL string |
| `useProfile()` | `(dirPath: string, options?: ProfileOptions): this` -- `dirPath` là đường dẫn thư mục |
| `newFingerprint()` | `(options: FetchOptions): Promise<string>` -- lấy fingerprint mới từ service |
| `repackChromium()` | `(launcher: Launcher): this` -- thay launcher, không nằm trong scope smoke test |

### Các vấn đề cụ thể cần test

1. **Lifecycle cơ bản (Minimal Flow)** -- test khởi tạo, launch, tạo context, quit.

2. **Fluent API (Full Flow)** -- test chuỗi method `.useFingerprint().useProxy().useProfile().launch().newContext()`:
   - `.useFingerprint()` nhận `data: string` (JSON fingerprint) + `FingerprintOptions`.
   - `.useProxy()` nhận `data: string` (URL proxy) + `ProxyOptions`.
   - `.useProfile()` nhận `dirPath: string` + `ProfileOptions`.
   - Verify context được tạo thành công (không cần CDP sâu -- smoke test chỉ verify context là object hợp lệ).

3. **Error Handling**:
   - `newContext()` trước `launch()` -- throw `PluginError`.
   - `launch()` khi đã launch -- throw `PluginError`.
   - `newContext()` khi context đã tồn tại -- throw `PluginError`.
   - `quit()` khi chưa launch -- không throw (graceful no-op).

4. **`newFingerprint()`** -- gọi lấy fingerprint từ service (cần key thật), verify trả về string JSON hợp lệ.

### Lưu ý về helper có sẵn

- `createEngine(key?, launcher?)` -- tạo instance với key từ tham số hoặc env.
- `withEngine(fn, key?, launcher?)` -- lifecycle wrapper: tạo engine -> gọi callback -> tự động quit() trong finally.
- `skipTestIfNoKey()` -- skip describe block nếu thiếu `BABLOSOFT_KEY` (dùng với `function` keyword).
- `MOCK_FINGERPRINT_OPTIONS`, `MOCK_PROXY_OPTIONS`, `MOCK_PROFILE_OPTIONS` -- object mẫu cho option types.
- `MOCK_FINGERPRINT_DATA` (chưa có, cần thêm) -- JSON string tối thiểu cho `useFingerprint()`.

**Quan trọng:** `withEngine()` không tự gọi `launch()` -- phải gọi `engine.launch()` trong callback.
`withEngine()` gọi `quit()` trong `finally`, nên gọi `quit()` trong callback là optional.

### Environment

- **OS:** Windows 10/11
- **Node version:** >= 18.0.0
- **Test runner:** Mocha 11.x (`.mocharc.yml`: timeout 30s, `tsx/esm`, `exit: true`)
- **Dependencies:** `playwright-core` (browser thật)

### Flow hiện tại

```
npm test
  └── mocha --exit --timeout 30000
       └── tests/unit/core.spec.ts  ← PASS (30 tests, không cần key)
       └── tests/smoke/              ← (chưa tồn tại)
```

### Code hiện tại

```ts
// Chưa có file tests/smoke/browser-engine.spec.ts
// Smoke test phải tự viết từ đầu.
// Helpers đã có: skipTestIfNoKey, createEngine, withEngine, mock constants.
```

## Nguyên nhân gốc rễ

- Dự án mới, smoke test bị hoãn lại sau unit test core.
- `BrowserEngine` API vừa được ổn định (fluent.ts), cần test thực tế để phát hiện lỗi tích hợp sớm.
- Các helper (`createEngine`, `withEngine`) đã có sẵn -- smoke test chỉ cần dùng lại.
- Chưa có `MOCK_FINGERPRINT_DATA` (JSON string) trong helpers -- cần thêm hoặc dùng inline.

## Tác động

| Tác động | Mức độ | Ai bị ảnh hưởng | Chi tiết |
|----------|--------|----------------|----------|
| Không phát hiện lỗi tích hợp sớm | Cao | Developer | BrowserEngine là API chính, nếu launch/context/quit sai thì toàn bộ ứng dụng dùng nó đều hỏng. |
| Regression không được phát hiện | Cao | Developer | Thay đổi fluent.ts có thể phá vỡ lifecycle mà không ai biết. |
| Thiếu tài liệu chạy được | Trung bình | Developer | Smoke test là tài liệu sống cho cách dùng BrowserEngine đúng. |
