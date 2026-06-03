# Design: Process không tự động thoát sau khi quit() (Issue #21)

## Bối cảnh

Sau khi gọi `BrowserEngine.quit()`, toàn bộ tài nguyên đã được dọn dẹp (browser process, engine process, cleaner, mutex), nhưng Node.js process vẫn không tự động thoát. Nguyên nhân là PCAP server (`net.Server`) không gọi `unref()` — TCP server giữ event loop alive ngay cả khi không còn instance nào dùng.

## Câu hỏi làm rõ

- PCAP server có thể bị đóng hoàn toàn trong cleanup không? → Không, vì PCAP server là module-level singleton dùng chung cho mọi `Connector` instance. Đóng nó sẽ ảnh hưởng đến instance khác.
- Có trường hợp nào cần PCAP server giữ process alive không? → Không. PCAP server chỉ phục vụ engine IPC; không có lý do gì để nó ngăn process thoát sau cleanup.

## Các phương án

### Phương án 1: Gọi `server.unref()` sau khi listen thành công
Thêm `svr.unref()` trong callback `onListening` của PCAP server. Khi đó, nếu không còn tác vụ nào khác, process sẽ tự động thoát.

- Ưu điểm: Thay đổi tối thiểu (1 dòng code). Không ảnh hưởng đến logic hiện tại — server vẫn nhận connection khi process còn chạy.
- Nhược điểm: Không dọn dẹp server resource hoàn toàn (server còn listening trên port nhưng không giữ event loop).

### Phương án 2: Reference counting + đóng server khi không còn instance
Theo dõi số lượng Connector instance đang hoạt động; đóng PCAP server khi instance cuối cùng cleanup.

- Ưu điểm: Dọn dẹp TCP resource triệt để.
- Nhược điểm: Phức tạp (cần reference counting, mutex, cleanup coordination). Dễ gây race condition nếu instance mới được tạo sau khi server đã đóng.

### Phương án 3: Gọi `pcapServer.close()` trong cleanup cuối cùng
Thêm reference counting vào Connector, gọi `pcapServer.close()` khi instance cuối cùng cleanup.

- Ưu điểm: Resource được giải phóng.
- Nhược điểm: Tương tự phương án 2 — phức tạp. Dễ gây lỗi timing (instance mới tạo trước khi server đóng xong).

## Giải pháp được chọn

- Phương án AI đề xuất: **Phương án 1** (`server.unref()`).
- Phương án được chọn: Phương án 1
- Lý do: Thay đổi 1 dòng, zero risk, giải quyết triệt để vấn đề event loop. PCAP server là internal component — không cần giữ resource sau cleanup vì connection từ engine đã đóng.
- Ràng buộc hoặc điều kiện kèm theo (nếu có): Cần verify với `npm test` và kiểm tra thủ công rằng process thoát được sau quit().
