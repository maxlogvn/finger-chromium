# Product: API Connector

## Tổng quan

API Connector là lớp giao tiếp đồng bộ với RemoteEngine. Nó đảm bảo chỉ một request tới engine tại một thời điểm (tránh race condition), chuẩn hoá lỗi từ engine thành `PluginError` dễ hiểu.

## Cách hoạt động

### Singleton engine

Chỉ có một RemoteEngine duy nhất cho toàn bộ ứng dụng, khởi tạo từ biến môi trường:

```ts
FINGERPRINT_CWD      → thư mục làm việc của engine
FINGERPRINT_TIMEOUT  → timeout cho cả engine và request (mặc định 300s)
```

### async-lock

Khi bạn gọi `api('setup', {...})`, request được đồng bộ bằng `async-lock` với key `'client'`:

```
Request A ─→ lock('client') ─→ engine.runFunction() ─→ unlock
Request B ─→ (đợi lock) ─→ lock('client') ─→ engine.runFunction() ─→ unlock
```

Điều này ngăn 2 request gửi đồng thời -- engine binary là single-threaded, không xử lý song song.

### Xử lý lỗi

| Lỗi từ engine | Bạn nhận được |
|---|---|
| `'key is missing'` | `MissingKeyError` |
| Lỗi khác | `PluginError` |

## PCAP Server

Khi module được load, PCAP server tự động start trên port random. Engine binary kết nối tới server này để lấy request ID và heartbeat. Bạn không cần làm gì -- nó chạy ngầm.

## Notifications

Nếu bạn chưa có key bảo mật (BABLOSOFT_KEY không set), connector sẽ:
1. In thông báo upgrade ngay lập tức
2. Set timer 20s nhắc nhở nếu chưa có key

Dùng `once()` package để chỉ in một lần -- không spam console.
