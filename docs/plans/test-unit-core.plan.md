# Plan: Unit Tests cho Core (`tests/unit/core.spec.ts`)

> **Version:** 1.0 | **Ngày bắt đầu dự kiến:** 2026-06-06 | **Ngày kết thúc dự kiến:** 2026-06-06

## Các bước thực hiện

- [ ] **Bước 1: Tạo thư mục `tests/unit/` và file `core.spec.ts`**
  - **Làm gì:** Tạo thư mục `tests/unit/` và file `tests/unit/core.spec.ts` với cấu trúc describe/it rỗng (skeleton), import `assert` và các module cần test.
  - **File liên quan:** `tests/unit/core.spec.ts` (mới), `tests/unit/` (mới).
  - **Định nghĩa hoàn thành (DoD):** File tồn tại, `npm test` chạy không lỗi (0 test).
  - **Thời gian ước lượng:** 5 phút.
  - **Rủi ro:** Không.
  - **Phụ thuộc:** Không.

- [ ] **Bước 2: Test error classes (`src/plugin/errors.ts`)**
  - **Làm gì:** Viết test cho 5 error class:
    - `PluginError`: khởi tạo không tham số (dùng empty string), custom message, `name === constructor.name`, `instanceof Error`, `[Symbol.toStringTag]`.
    - `MissingKeyError`: `instanceof PluginError`, message chứa hướng dẫn (`includes`).
    - `InvalidEngineError`: `instanceof PluginError`, message chứa hướng dẫn.
    - `EngineTimeoutError`: `instanceof PluginError`, message chứa hướng dẫn.
    - `RequestTimeoutError`: `instanceof PluginError`, message chứa hướng dẫn.
  - **File liên quan:** `tests/unit/core.spec.ts` (sửa).
  - **DoD:** Pass 20+ test cases, không cần BABLOSOFT_KEY.
  - **Thời gian ước lượng:** 20 phút.
  - **Rủi ro:** `MissingKeyError` constructor yêu cầu tham số message -- cần dùng `new MissingKeyError('')` để test empty message.
  - **Phụ thuộc:** Bước 1.

- [ ] **Bước 3: Test public exports (`src/index.ts`)**
  - **Làm gì:** Viết test kiểm tra:
    - `BrowserEngine` là function (class).
    - 5 error class đều là function và là subclass của `PluginError` (`instanceof PluginError` với instance).
    - Các type export: `PWChromium`, `FetchOptions`, `FingerprintOptions`, `Launcher`, `PluginLaunchOptions`, `ProfileOptions`, `ProxyOptions` là object (type export ở runtime là `undefined` -- chỉ kiểm tra tồn tại trong module).
  - **File liên quan:** `tests/unit/core.spec.ts` (sửa).
  - **DoD:** Pass 10+ test cases, mỗi export được kiểm tra.
  - **Thời gian ước lượng:** 15 phút.
  - **Rủi ro:** Type export (`PWChromium`, `FetchOptions`, ...) ở runtime là `undefined` vì TypeScript type bị erase. Cần kiểm tra kiểu khác hoặc dùng `typeof` và không assert type export như runtime value. Thực tế: type export là TypeScript-only, không tồn tại ở runtime. Cách test đúng: dùng `type` check qua TypeScript compiler hoặc bỏ qua type export. Chỉ test class, function, và error exports thực sự.
  - **Phụ thuộc:** Bước 2.

- [ ] **Bước 4: Test `getValidPollInterval()` (`src/plugin/config.ts`)**
  - **Làm gì:** Viết test cho pure function `getValidPollInterval()`:
    - `undefined` -> `DEFAULT_POLL_INTERVAL` (500).
    - `NaN` -> `DEFAULT_POLL_INTERVAL`.
    - Âm (-1) -> `DEFAULT_POLL_INTERVAL`.
    - `< 100` (99, 50, 0) -> clamp về 100.
    - `>= 100` (100, 200, 1000) -> giữ nguyên.
  - **File liên quan:** `tests/unit/core.spec.ts` (sửa).
  - **DoD:** Pass 6+ test cases.
  - **Thời gian ước lượng:** 10 phút.
  - **Rủi ro:** `getValidPollInterval` là internal function, không được export từ `src/plugin/config.ts`. Cần import trực tiếp từ file source (Mocha + tsx hỗ trợ import `.ts`).
  - **Phụ thuộc:** Bước 1.

- [ ] **Bước 5: Test `ConfigManager.configure()`**
  - **Làm gì:** Viết test cho method `configure()`:
    - Tạo mock `Browser` object với `process.once('exit')`.
    - Kiểm tra cleanup handler được đăng ký qua `process.once`.
    - Kiểm tra `browser.configure` được gán và gọi.
    - Kiểm tra `setViewport` được gọi khi có `width` và `height`.
    - Kiểm tra không gọi `setViewport` khi thiếu `width` hoặc `height`.
  - **File liên quan:** `tests/unit/core.spec.ts` (sửa).
  - **DoD:** Pass 5 test cases.
  - **Thời gian ước lượng:** 20 phút.
  - **Rủi ro:** `configure()` import `setViewport` từ `./browser` -- cần module mock. Nếu không mock được, có thể test với `sync` wrapper để kiểm soát luồng.
  - **Phụ thuộc:** Bước 4.

- [ ] **Bước 6: Test `ConfigManager.synchronize()`**
  - **Làm gì:** Viết test cho method `synchronize()`:
    - Tạo temp directory với `fs.mkdtempSync`.
    - Tạo file `.ini` giả với nội dung `availWidth=1024\navailHeight=768`.
    - Gọi `synchronize()` và kiểm tra file được cập nhật:
      - Reset về `BAS_NOT_SET`.
      - Set giá trị mới từ `bounds`.
    - Test với lock theo `id`.
    - Test lỗi khi file không tồn tại.
    - Cleanup temp directory trong `after`.
  - **File liên quan:** `tests/unit/core.spec.ts` (sửa).
  - **DoD:** Pass 4+ test cases, temp directory được cleanup.
  - **Thời gian ước lượng:** 25 phút.
  - **Rủi ro:** `synchronize()` dùng `sleep()` (500ms mặc định) làm test chậm. Có thể dùng `pollInterval` nhỏ (100ms) để tăng tốc. `async-lock` timeout có thể gây false positive nếu lock không release.
  - **Phụ thuộc:** Bước 5.

- [ ] **Bước 7: Điều chỉnh `.mocharc` hoặc `package.json` cho unit tests**
  - **Làm gì:** Kiểm tra cấu hình Mocha hiện tại có spec pattern phù hợp không (`tests/**/*.spec.ts`). Nếu chưa, thêm spec pattern hoặc ensure file test nằm trong phạm vi.
  - **File liên quan:** `.mocharc.yml` hoặc `package.json` (nếu cần sửa).
  - **DoD:** `npm test` chạy được test trong `tests/unit/`.
  - **Thời gian ước lượng:** 5 phút.
  - **Rủi ro:** Cấu hình hiện tại có thể chỉ chạy test theo pattern cụ thể.
  - **Phụ thuộc:** Bước 1.

## Kiểm tra tổng thể

Chạy các lệnh sau trước khi đóng plan:
- `npm run lint` (ESLint)
- `npm run typecheck` (`tsc --noEmit`)
- `npm test` (Mocha)
- `npm run build` (tsup)

## Rủi ro & phương án dự phòng

- **Rủi ro:** `getValidPollInterval` không được export từ `src/plugin/config.ts` -> **Dự phòng:** Import trực tiếp file `.ts` bằng `tsx` (đã có trong devDependencies), Mocha + tsx loader hỗ trợ import TypeScript trực tiếp.
- **Rủi ro:** `ConfigManager.synchronize()` gọi `readFile` từ `fs/promises`, test cần temp directory -> **Dự phòng:** Dùng `fs.mkdtempSync` trong `before` + `fs.rmSync` trong `after`.
- **Rủi ro:** Export check với type-only export không hoạt động ở runtime -> **Dự phòng:** Chỉ test class/function/error export, bỏ qua type-only export vì TypeScript erase type ở runtime.

## Ghi chú bổ sung

- Không sửa bất kỳ file source nào (`src/`). Chỉ tạo file test mới.
- Không thêm bất kỳ dependency nào vào `package.json`.
- Tuân thủ `docs/CONVENTIONS.md` khi đặt tên file và viết code.
