# Plan: Cho phép Smoke Tests chạy không cần BABLOSOFT_KEY

> **Version:** 1.0 | **Ngày bắt đầu:** 2026-06-06

## Các bước thực hiện

- [ ] **Bước 1: Sửa `createEngine()` trong `tests/helpers.ts`**
  - Bỏ `throw MissingKeyError` khi `resolvedKey` rỗng.
  - Engine vẫn tạo instance bình thường với `privateKey = ""`.
  - **File liên quan:** `tests/helpers.ts`
  - **Định nghĩa hoàn thành (DoD):** `createEngine()` không key trả về instance hợp lệ.

- [ ] **Bước 2: Thêm `skipIfNoPremiumKey()` trong `tests/helpers.ts`**
  - Function mới kiểm tra `PRIVATE_KEY`, trả `true` nếu rỗng.
  - **File liên quan:** `tests/helpers.ts`
  - **DoD:** `skipIfNoPremiumKey()` trả `true` khi không có key, `false` khi có key.

- [ ] **Bước 3: Cập nhật `tests/smoke/minimal-flow.spec.ts`**
  - Bỏ `import { skipTestIfNoKey }` và dòng `if (skipTestIfNoKey()) return;`
  - **DoD:** Test chạy với free fingerprint, không skip.

- [ ] **Bước 4: Cập nhật `tests/smoke/fluent-api.spec.ts`**
  - Bỏ `import { skipTestIfNoKey }` và dòng `if (skipTestIfNoKey()) return;`
  - **DoD:** Test chạy với free fingerprint, không skip.

- [ ] **Bước 5: Cập nhật `tests/smoke/error-handling.spec.ts`**
  - Bỏ `import { skipTestIfNoKey }` và dòng `if (skipTestIfNoKey()) return;`
  - **DoD:** Test chạy với free fingerprint, không skip.

- [ ] **Bước 6: Cập nhật `tests/smoke/new-fingerprint.spec.ts`**
  - Thay `skipTestIfNoKey` bằng `skipIfNoPremiumKey` trong import và gọi.
  - **DoD:** Test skip khi không có key, chạy bình thường khi có key.

- [ ] **Bước 7: Chạy kiểm tra**
  - `npm run lint`, `npm run typecheck`, `npm run build`
  - **DoD:** Pass không lỗi.

## Kiểm tra tổng thể
- `npm run lint`
- `npm run typecheck`
- `npm run build`
- `npm test` (trên CI hoặc local có key)

## Rủi ro & phương án dự phòng
- **Rủi ro:** Binary không hỗ trợ key rỗng trên môi trường khác Windows → **Dự phòng:** `skipTestIfNoKey()` vẫn tồn tại, có thể dùng lại nếu cần.
- **Rủi ro:** Smoke test không key fail vì lỗi connector thật → **Dự phòng:** Phân tích log để xác định lỗi từ binary hay connector.

## Ghi chú bổ sung
- `skipTestIfNoKey()` giữ nguyên để dùng cho unit test nếu cần skip toàn bộ suite.
