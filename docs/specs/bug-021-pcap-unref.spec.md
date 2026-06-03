# Spec: Process không tự động thoát sau khi quit() (Issue #21)

> Tuân thủ quy ước code tại [CONVENTIONS.md](../CONVENTIONS.md).

## Mô tả

PCAP server (`net.Server`) thiếu `unref()` nên giữ event loop alive ngay cả khi toàn bộ tài nguyên đã được dọn dẹp. Node.js process không tự động thoát sau khi gọi `quit()`.

## Yêu cầu

- Sau khi gọi `cleanup()` (engine process killed, cleaner stopped, browser closed), Node.js process phải tự động thoát.
- PCAP server vẫn phải hoạt động bình thường khi process còn chạy (các instance khác có thể đang dùng).
- Fix phải là thay đổi tối thiểu, không ảnh hưởng đến logic hiện tại.

## Thiết kế

Gọi `server.unref()` ngay sau khi server listen thành công. Tham chiếu design: `docs/designs/bug-021-pcap-unref.design.md`

`unref()` là method có sẵn của `net.Server` — nó cho phép server không giữ event loop alive, nhưng vẫn nhận và xử lý connection khi process còn chạy. Khi không còn tác vụ nào khác (timer, socket, promise...), process sẽ tự động thoát.

## API / Data flow

Chỉ sửa internal implementation — không thay đổi API public.

- **Trước:** `svr.listen(port, host, onListening)` — server giữ event loop.
- **Sau:** `svr.listen(port, host, onListening)` + `svr.unref()` trong callback `onListening`.

## Components

- `src/plugin/connector/pcapServer/index.ts` (sửa) — thêm `svr.unref()` trong callback `onListening`.

## Xử lý lỗi

Không có xử lý lỗi đặc biệt — `unref()` là synchronous operation, không throw.

## Kiểm tra

- **Happy path:** Gọi `listen()`, verify server đang listening. Gọi `close()`, verify server đã đóng.
- **Unref behavior:** Viết test tạo PCAP server + `setTimeout` ngắn, verify process không bị giữ bởi server.
- **Edge case:** Gọi `listen()` nhiều lần — `once()` wrapper đảm bảo chỉ chạy một lần, `unref()` chỉ cần một lần duy nhất.
