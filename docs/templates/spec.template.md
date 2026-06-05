# Spec: <tên tính năng>

> Tuân thủ quy ước code tại [CONVENTIONS.md](../CONVENTIONS.md).  
> **Version:** 1.0 | **Cập nhật lần cuối:** YYYY-MM-DD

## Mô tả
Mô tả ngắn gọn tính năng làm gì và tại sao cần thiết.  
Ví dụ: "Tính năng cho phép inject fingerprint WebGL noise ở tầng native trước khi browser khởi động, tránh bị phát hiện bởi JS-based fingerprint check."

## Phạm vi
- **Trong phạm vi:** Các chức năng cụ thể tính năng này đảm nhận.
- **Ngoài phạm vi:** Những thứ rõ ràng không thuộc tính năng này (để tránh hiểu nhầm).

Ví dụ:
- Trong phạm vi: Inject WebGL noise, hỗ trợ Chromium 120+.
- Ngoài phạm vi: Inject WebGL noise cho Firefox, thay đổi các fingerprint khác (canvas, audio).

## Yêu cầu
Liệt kê các yêu cầu chức năng (functional) và phi chức năng (non-functional).

- **Functional:**
  - Fingerprint WebGL phải được inject trước khi `webgl.getParameter()` được gọi lần đầu.
  - Cho phép cấu hình mức noise từ 0.0 đến 0.1.
- **Non-functional:**
  - Engine phải load được trên cả Windows 32-bit và 64-bit.
  - Thời gian inject không làm chậm launch browser quá 50ms.

## Phụ thuộc
Các tính năng, module hoặc dịch vụ bên ngoài mà spec này cần.

- Yêu cầu Engine phiên bản >= 2.1.0 (hỗ trợ native injection).
- Phụ thuộc vào CDP connection đã được thiết lập.

## Thiết kế
Mô tả kiến trúc tổng quan. Có thể bao gồm sơ đồ (Mermaid hoặc ASCII).  
Tham chiếu đến design doc: `docs/designs/<tên>.design.md`

## API / Data flow
Mô tả luồng dữ liệu từ đầu vào đến đầu ra. Ghi rõ schema nếu có API.

- **Input (từ user code):**
  ```ts
  { webgl: { noise: 0.01 }, browserVersion: '130' }
  ```
- **Output (đến engine):**
  ```
  engine.ini: webgl_noise=0.01
  ```
- **Luồng dữ liệu:**  
  User gọi `chromium.useFingerprint(config)` → Plugin chuyển config thành JSON → Gửi qua CDP → Engine inject vào webgl context.

## Components
Liệt kê các module/component cần tạo mới hoặc chỉnh sửa, kèm trách nhiệm.

- `src/plugin/connector/engine.ts` (sửa) – thêm field `webgl_noise` vào request JSON.
- `src/adapter/playwright/chromium.ts` (sửa) – gọi `api('configure')` với tham số mới.
- `src/injectors/webgl.ts` (tạo mới) – chứa mã inject native.

## Xử lý lỗi
Liệt kê các trường hợp lỗi và cách xử lý.

| Lỗi | Cách xử lý |
|-----|-------------|
| `browserVersion` không hỗ trợ WebGL injection | Throw `PluginError` với message rõ ràng, gợi ý nâng cấp browser. |
| Engine timeout khi inject | Throw `EngineTimeoutError`, retry tối đa 2 lần. |
| Noise value ngoài khoảng [0, 0.1] | Log warning và clamp về 0.1. |

## Kiểm tra (Testing)
Liệt kê các trường hợp test: happy path, edge cases, error cases.

- **Happy path:** Inject noise thành công, `getParameter()` trả về giá trị đã bị nhiễu.
- **Edge case:** `noise = 0` – không nhiễu, giá trị trả về nguyên bản.
- **Edge case:** `noise = 0.1` – nhiễu tối đa, đảm bảo không crash.
- **Error case:** browserVersion không hợp lệ – throw lỗi đúng type.
