# Plan: Smoke Test E2E cho BrowserEngine

> **Version:** 1.0 | **Ngày bắt đầu dự kiến:** 2026-06-06 | **Ngày kết thúc dự kiến:** 2026-06-06

## Các bước thực hiện

- [ ] **Bước 1: Thêm `MOCK_FINGERPRINT_DATA` vào `tests/helpers.ts`**
  - **Làm gì:** Thêm hằng `MOCK_FINGERPRINT_DATA = '{}'` (JSON string tối thiểu) sau các mock constants hiện có. Thêm import `FetchOptions` type nếu chưa có.
  - **File liên quan:** `tests/helpers.ts`
  - **Định nghĩa hoàn thành (DoD):** `npm run lint && npm run typecheck` pass.
  - **Thời gian ước lượng:** 2 phút
  - **Rủi ro:** Không.
  - **Phụ thuộc:** Không.

- [ ] **Bước 2: Tạo `tests/smoke/browser-engine.spec.ts` -- scaffolding**
  - **Làm gì:** Tạo thư mục `tests/smoke/` (nếu chưa có) và file spec. Viết imports, describe block chính với `function` keyword + `skipTestIfNoKey()`.
  - **File liên quan:** `tests/smoke/browser-engine.spec.ts` (mới)
  - **DoD:** File tồn tại, `npm test` chạy ra describe block (skip nếu thiếu key).
  - **Thời gian ước lượng:** 5 phút
  - **Phụ thuộc:** Bước 1.

- [ ] **Bước 3: Viết test "Minimal Flow" (2 tests)**
  - **Làm gì:**
    - Test 1: `launch -> newContext -> quit` dùng `withEngine`, verify context có `newPage` method.
    - Test 2: `withEngine wrapper` -- verify `withEngine` tự động quit không throw lỗi.
  - **File liên quan:** `tests/smoke/browser-engine.spec.ts`
  - **DoD:** Chạy `npm test` với key, 2 test pass.
  - **Thời gian ước lượng:** 10 phút
  - **Phụ thuộc:** Bước 2.

- [ ] **Bước 4: Viết test "Fluent API" (1 test)**
  - **Làm gì:** Test full chain:
    ```
    engine
      .useFingerprint(MOCK_FINGERPRINT_DATA, MOCK_FINGERPRINT_OPTIONS)
      .useProxy('http://localhost:8080', MOCK_PROXY_OPTIONS)
      .useProfile(tmpDir, MOCK_PROFILE_OPTIONS)
      .launch()
    ```
    Tạo temp profile dir bằng `fs.mkdtempSync`. Verify context có method `close`.
  - **File liên quan:** `tests/smoke/browser-engine.spec.ts`
  - **DoD:** Test pass, temp dir được cleanup sau test.
  - **Thời gian ước lượng:** 10 phút
  - **Phụ thuộc:** Bước 3.

- [ ] **Bước 5: Viết test "Error Handling" (4 tests)**
  - **Làm gì:** Dùng `createEngine` + `try/finally` cho các test:
    1. `newContext()` trước `launch()` -- `assert.rejects` với `PluginError`.
    2. `launch()` hai lần -- `assert.throws` với `PluginError`.
    3. `newContext()` khi context đã tồn tại -- `assert.rejects` với `PluginError`.
    4. `quit()` khi chưa launch -- không throw.
  - **File liên quan:** `tests/smoke/browser-engine.spec.ts`
  - **DoD:** Cả 4 test pass.
  - **Thời gian ước lượng:** 15 phút
  - **Phụ thuộc:** Bước 3.

- [ ] **Bước 6: Viết test "newFingerprint" (1 test)**
  - **Làm gì:** Gọi `engine.newFirmagerprint({ tags: ['Chrome', 'Windows 10'] })`, verify trả về string parse được thành object.
  - **File liên quan:** `tests/smoke/browser-engine.spec.ts`
  - **DoD:** Test pass, fingerprint response là JSON hợp lệ.
  - **Thời gian ước lượng:** 5 phút
  - **Phụ thuộc:** Bước 2.

## Kiểm tra tổng thể

Chạy các lệnh sau trước khi đóng plan:
- `npm run lint`
- `npm run typecheck`
- `npm test` (với `BABLOSOFT_KEY` set --> 8 test pass)
- `npm test` (không có key --> 0 test, tất cả skipped)
- `npm run build`

## Rủi ro & phương án dự phòng

- **Rủi ro:** `BABLOSOFT_KEY` không set trên máy dev --> **Dự phòng:** `skipTestIfNoKey()` skip toàn bộ, không fail. Test vẫn pass (0 test).
- **Rủi ro:** Playwright chưa cài chromium --> **Dự phòng:** Hướng dẫn chạy `npx playwright install chromium`. Test fail với lỗi rõ ràng.
- **Rủi ro:** `newFingerprint` timeout do API chậm --> **Dự phòng:** Timeout 60s cho toàn bộ test.
- **Rủi ro:** Temp profile dir không được cleanup --> **Dự phòng:** Dùng `fs.rmSync(tmpDir, { recursive: true, force: true })` trong `finally` hoặc `afterEach`.

## Ghi chú bổ sung

- Tham khảo `tests/unit/core.spec.ts` -- cách dùng `assert`, cấu trúc describe/it, timeout.
- Tất cả test dùng `async/await` (launch, newContext, quit đều async).
- Error test cần tạo engine riêng (không dùng chung) để tránh side effect giữa các test.
