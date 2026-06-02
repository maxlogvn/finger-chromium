# Spec: <tên tính năng>

> Tuân thủ quy ước code tại [CONVENTIONS.md](../CONVENTIONS.md).

## Mô tả
Mô tả ngắn gọn tính năng làm gì và tại sao cần thiết.
Ví dụ: "Tính năng cho phép inject fingerprint WebGL noise ở tầng native trước khi browser khởi động, tránh bị phát hiện bởi JS-based fingerprint check."

## Yêu cầu
Liệt kê các yêu cầu chức năng (functional) và phi chức năng (non-functional).
Ví dụ:
- Fingerprint WebGL phải được inject trước khi `webgl.getParameter()` được gọi lần đầu.
- Engine phải load được trên cả Windows 32-bit và 64-bit.

## Thiết kế
Mô tả kiến trúc tổng quan. Sơ đồ nếu cần.
Tham chiếu đến design doc: `docs/designs/<tên>.design.md`

## API / Data flow
Mô tả luồng dữ liệu từ đầu vào đến đầu ra. Ghi rõ schema nếu có API.
Ví dụ:
- Input: `useFingerprint({ webgl: { noise: 0.01 } }, { browserVersion: '130' })`
- Output: Engine `.ini` file chứa config `webgl_noise=0.01`, inject qua CDP.

## Components
Liệt kê các module/component cần tạo mới hoặc chỉnh sửa, kèm trách nhiệm của từng thứ.
Ví dụ:
- `src/plugin/connector/engine.ts` (sửa) — thêm field webgl_noise vào request JSON.
- `src/adapter/playwright/chromium.ts` — gọi `api('configure')` với tham số mới.

## Xử lý lỗi
Liệt kê các trường hợp lỗi có thể xảy ra và cách xử lý từng trường hợp.
Ví dụ:
- `browserVersion` không hỗ trợ WebGL injection → throw `PluginError` với message rõ ràng.
- Engine timeout khi inject → throw `EngineTimeoutError`.

## Kiểm tra
Liệt kê các trường hợp cần test: happy path, edge cases, error cases.
Ví dụ:
- Happy path: inject WebGL noise thành công, `getParameter()` trả về giá trị đã noise.
- Edge case: `noise = 0` — không noise, giá trị trả về nguyên bản.
- Error case: browserVersion không hợp lệ — throw lỗi đúng type.