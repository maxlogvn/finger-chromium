# Design: Bug #12 — PCAP server side effect ở module scope

## Bối cảnh

`src/plugin/connector/index.ts:63-66` gọi `pcapServer.listen()` ngay tại module scope (top-level code).
Chỉ cần `import` file này (dù chỉ để lấy type) cũng mở một TCP server — rất nguy hiểm trong unit test
và gây khó khăn khi debug.

## Câu hỏi làm rõ

- Có cần PCAP server chạy trước khi `api()` được gọi lần đầu không?
  → Trả lời: Có. `engine.setArgs()` cần được gọi trước `engine.runFunction()` lần đầu (bên trong `api()`).

- `pcapServer.listen()` đã dùng `once()` => gọi nhiều lần vẫn an toàn?
  → Trả lời: Đúng, `once()` đảm bảo chỉ listen một lần.

- Ai là người dùng `connector`?
  → `src/plugin/index.ts` (FingerprintPlugin) import `{ api, engine, cleanup }`.

## Các phương án

### Phương án 1: Lazy init trong `api()`

Đưa `pcapServer.listen()` vào bên trong `api()`, dùng một promise để đảm bảo chỉ init một lần
và `api()` sẽ `await` trước khi xử lý request.

- Ưu điểm: Đơn giản, không thay đổi API public, không cần người dùng gọi thêm bước nào.
- Nhược điểm: `api()` có thể chậm hơn một chút ở lần gọi đầu tiên.

### Phương án 2: Export hàm `init()` riêng

Tạo hàm `async function init()` riêng, chứa `pcapServer.listen()`.
Người dùng (FingerprintPlugin) gọi `init()` trước khi sử dụng.

- Ưu điểm: Explicit, dễ test hơn.
- Nhược điểm: Thay đổi API public, cần sửa cả `FingerprintPlugin`.

### Phương án 3: Khởi tạo trong constructor EngineOptions

Thêm tham số `pcapPort` vào EngineOptions của RemoteEngine, để engine tự động khởi tạo PCAP server.

- Ưu điểm: PCAP port gắn liền với vòng đời engine.
- Nhược điểm: PCAP server là infrastructure riêng, không nên gắn với RemoteEngine.
  Phá vỡ tách biệt concern.

## Giải pháp được chọn

- **Phương án AI đề xuất:** Phương án 1 (Lazy init trong `api()`).
  Lý do: Đơn giản nhất, ít thay đổi nhất, không làm thay đổi API public.
  `pcapServer.listen()` đã dùng `once()` nên gọi nhiều lần vẫn an toàn.

- **Phương án được chọn:** (chờ người duyệt điền sau)

- **Lý do:** ...
- **Ràng buộc:** Cần đảm bảo `pcapServer.close()` trong `cleanup()` vẫn hoạt động đúng.
