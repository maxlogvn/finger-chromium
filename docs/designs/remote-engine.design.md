# Design: RemoteEngine

## Vấn đề

Cần giao tiếp với `FastExecuteScript.exe` (engine binary của bablosoft) để setup browser với fingerprint. Engine binary này là một C++ executable độc lập, không hỗ trợ stdin/stdout-based IPC, không thể dùng pipe để giao tiếp.

## Tại sao file-based IPC?

Các phương án giao tiếp với process con:

| Phương án | Vấn đề |
|---|---|
| stdin/stdout pipe | Engine binary không hỗ trợ -- nó là standalone executable, không phải CLI tool |
| Unix socket | Không portable -- cần cross-platform, mà engine chạy Windows |
| TCP socket | Cần thêm port management, firewall issues |
| File-based IPC | Engine đã hỗ trợ sẵn: đọc JSON từ thư mục `r/`, ghi response vào cùng file |

File-based IPC đơn giản, không cần port, không cần protocol negotiation. Engine binary polling thư mục `r/` để tìm request mới.

## Tại sao SHA1 checksum?

Engine zip tải từ bablosoft có thể bị corrupt nếu:
- Download bị gián đoạn (mất mạng giữa chừng)
- CDN serve file lỗi
- Disk full khi ghi

SHA1 checksum từ bablosoft metadata JSON cho phép phát hiện corrupt file trước khi extract. Nếu checksum không khớp, xoá toàn bộ thư mục engine và tải lại -- tránh debug khó khăn với engine lỗi.

## Tại sao cần PID-based cleanup?

Mỗi request là một file JSON trong `r/`. Nếu process crash trước khi xoá request file, file tồn tại vĩnh viễn. Bằng cách kiểm tra PID từ tên file (`<pid>_<uuid>.json`), ta biết process gốc còn sống không. Nếu PID đã chết, file là orphan → xoá.

## Cache metadata

Metadata JSON từ bablosoft chứa checksum và URL. Cache vào file `<version>_<ARCH>.json` để:
- Không cần gọi bablosoft API mỗi lần khởi động
- Cho phép offline startup (sau lần đầu)
- Giảm thời gian launch (tránh network latency)

---

Xem thêm: [Spec](../specs/remote-engine.spec.md) | [Plan](../plans/remote-engine.plan.md)
