# Spec: Cho phép Smoke Tests chạy không cần BABLOSOFT_KEY

> Tuân thủ quy ước code tại [CONVENTIONS.md](../CONVENTIONS.md).
> **Version:** 1.0 | **Cập nhật lần cuối:** 2026-06-06

## Mô tả

Engine binary (`FastExecuteScript.exe`) chấp nhận key rỗng cho fingerprint miễn phí (Windows). Hiện tại `createEngine()` throw `MissingKeyError` quá sớm, ngăn smoke test chạy browser thật dù không cần key. Spec này sửa `createEngine()` để không throw, thêm `skipIfNoPremiumKey()` và cập nhật skip logic trong 4 smoke test files.

## Phạm vi

- **Trong phạm vi:**
  - Sửa `createEngine()` trong `tests/helpers.ts` — không throw khi thiếu key, tạo instance với key rỗng.
  - Thêm `skipIfNoPremiumKey()` trong `tests/helpers.ts` — skip test cần premium fingerprint.
  - Cập nhật 4 smoke test files: `minimal-flow.spec.ts`, `fluent-api.spec.ts`, `error-handling.spec.ts`, `new-fingerprint.spec.ts`.
  - Giữ nguyên `skipTestIfNoKey()` cho unit test.
- **Ngoài phạm vi:**
  - Không sửa code engine core (`src/adapter/playwright/`).
  - Không sửa unit test files (`tests/unit/`).
  - Không thêm/sửa integration test.

## Yêu cầu

- **Functional:**
  - `createEngine()` không throw khi thiếu key, cho phép tạo instance với key rỗng.
  - `skipIfNoPremiumKey()` trả `true` nếu `PRIVATE_KEY` rỗng, `false` nếu có key.
  - `minimal-flow.spec.ts`, `fluent-api.spec.ts`, `error-handling.spec.ts` chạy được với free fingerprint (không cần key).
  - `new-fingerprint.spec.ts` dùng `skipIfNoPremiumKey()` — skip nếu không có key.
- **Non-functional:**
  - Tất cả smoke test không key phải pass hoặc skip đúng, không throw lỗi không mong muốn.
  - Pass `npm run build`, `npm run typecheck`, `npm run lint`.

## Phụ thuộc

- Không phụ thuộc vào thay đổi ngoài.
- Engine binary tự xử lý key rỗng (đã kiểm tra qua BAS script `project.xml`).

## Thiết kế

Tham chiếu design docs.

## API / Data flow

**Luồng dữ liệu với free fingerprint (không key):**

```
createEngine() → instance.privateKey = ""
  → engine.launch() → setServiceKey("")
    → engine.newContext()
      → connector gửi key rỗng lên binary
      → binary trả fingerprint free (Windows mặc định)
      ← BrowserContext sẵn sàng
```

**Luồng với premium key:**

Không thay đổi gì so với hiện tại.

## Components

- `tests/helpers.ts` (sửa):
  - `createEngine()` — bỏ `throw`, cho phép key rỗng.
  - `skipIfNoPremiumKey()` — thêm mới.
- `tests/smoke/minimal-flow.spec.ts` (sửa): bỏ dòng `skipTestIfNoKey()`.
- `tests/smoke/fluent-api.spec.ts` (sửa): bỏ dòng `skipTestIfNoKey()`.
- `tests/smoke/error-handling.spec.ts` (sửa): bỏ dòng `skipTestIfNoKey()`.
- `tests/smoke/new-fingerprint.spec.ts` (sửa): thay `skipTestIfNoKey()` bằng `skipIfNoPremiumKey()`.

## Xử lý lỗi

| Lỗi | Cách xử lý |
|-----|-------------|
| `PRIVATE_KEY` rỗng, test gọi `newFingerprint()` | `skipIfNoPremiumKey()` skip test. |
| Binary trả lỗi vì key rỗng (trái với phân tích BAS) | Connector throw `MissingKeyError` như hiện tại — test fail báo lỗi thật. |
| `createEngine()` gọi với `key = ""` rõ ràng | Cho phép — dùng free fingerprint. |

## Kiểm tra (Testing)

- **Happy path (không key):** `minimal-flow`, `fluent-api`, `error-handling` chạy được, pass với free fingerprint.
- **Edge case (không key, premium test):** `new-fingerprint` skip với log `skipIfNoPremiumKey`.
- **Happy path (có key):** Cả 4 test chạy bình thường như trước.
- **Smoke test không throw:** Gọi `createEngine()` không key → không throw, instance tạo thành công.
