# Product: RemoteEngine

## Tổng quan

RemoteEngine là bộ phận chịu trách nhiệm giao tiếp với `FastExecuteScript.exe` -- một chương trình chạy riêng biệt (engine binary) do bablosoft cung cấp. Engine này làm nhiệm vụ setup fingerprint, proxy và profile cho trình duyệt Chromium.

RemoteEngine tự động làm những việc sau:
- **Tải engine** từ bablosoft.com (nếu chưa có).
- **Kiểm tra tính toàn vẹn** bằng SHA1 checksum.
- **Giải nén** và cấu hình engine.
- **Khởi chạy** engine và giao tiếp với nó qua file JSON.
- **Dọn dẹp** request cũ và tài nguyên sau khi dùng.

## Cách dùng

Bạn không cần dùng RemoteEngine trực tiếp -- `Chromium.launch()` tự động làm tất cả. Nhưng nếu bạn muốn hiểu quy trình, đây là cách nó hoạt động:

```ts
// RemoteEngine chạy ngầm khi bạn gọi:
await Chromium.launch();

// Engine tự động:
// 1. Tải FastExecuteScript.exe (nếu chưa có)
// 2. Giải nén và cấu hình
// 3. Gửi lệnh 'setup' với fingerprint + proxy + profile
// 4. Spawn worker.exe (trình duyệt đã được inject fingerprint)
```

## API

### Cấu hình timeout

Bạn có thể điều chỉnh thời gian chờ qua biến môi trường:

```bash
# Mặc định 300s (5 phút). Tăng lên 600s (10 phút) nếu mạng chậm
set FINGERPRINT_TIMEOUT=600000
```

Hoặc qua các method tương ứng (nếu dùng API cấp thấp):

```ts
const engine = new RemoteEngine();
engine.setEngineTimeout(600_000);  // Timeout khởi động engine
engine.setRequestTimeout(600_000); // Timeout chờ phản hồi
```

### Sự kiện

RemoteEngine phát ra 2 sự kiện trong quá trình tải:

| Sự kiện | Ý nghĩa |
|---|---|
| `'beforeDownload'` | "Đang tải browser -- quá trình này có thể mất một chút thời gian." |
| `'beforeExtract'` | "Đang cài đặt browser -- quá trình này có thể mất một chút thời gian." |

## Lifecycle

```
constructor()
    │
    ▼
(optional) setCwd / setArgs / setEngineTimeout / setRequestTimeout
    │
    ▼
runFunction('setup', { fingerprint, proxy, profile })
    │
    ├── 1. #updateMeta() → đọc project.xml → fetch metadata
    │
    ├── 2. #startProcess()
    │       ├── Download zip (nếu chưa có)
    │       ├── Extract zip (nếu chưa extract)
    │       ├── Copy config files
    │       └── Spawn FastExecuteScript.exe
    │
    ├── 3. Ghi JSON request → r/<pid>_<uuid>.json
    │
    └── 4. Chokidar watch → đọc response
            │
            ├── Thành công → parse JSON → trả về kết quả
            └── Timeout → throw RequestTimeoutError
```

## Xử lý lỗi

| Lỗi | Nguyên nhân | Cách khắc phục |
|---|---|---|
| `EngineTimeoutError` | Download/extract/spawn quá 300s | Tăng `FINGERPRINT_TIMEOUT` hoặc kiểm tra mạng |
| `InvalidEngineError` | Engine binary lỗi | Xoá thư mục `data/engine/` và chạy lại |
| `RequestTimeoutError` | Engine không phản hồi | Tăng `FINGERPRINT_TIMEOUT` hoặc kiểm tra engine có chạy không |

## Môi trường

| Biến | Mặc định | Mô tả |
|---|---|---|
| `FINGERPRINT_CWD` | `process.cwd()/data` | Thư mục làm việc (chứa engine/ + script/) |
| `FINGERPRINT_TIMEOUT` | `300000` (5 phút) | Timeout cho cả engine và request |

## Lưu ý

- **Lần đầu chạy có thể chậm** vì phải tải engine (~50-100MB tuỳ version).
- **Checksum kiểm tra SHA1** của file zip. Nếu file hỏng, engine tự động tải lại.
- **File request cũ được dọn** mỗi khi gọi `runFunction()`. Không lo tích tụ file rác.
- **Engine chạy với `--silent` flag** để giảm log không cần thiết.
- **PCAP server port** được set tự động qua arg `--mock-pcap-port=<port>`.

---
