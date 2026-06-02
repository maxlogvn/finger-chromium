# Product: RemoteEngine

## Tổng quan

RemoteEngine quản lý `FastExecuteScript.exe` -- engine binary từ bablosoft. Nó tự động tải, giải nén, cấu hình, và giao tiếp với engine để setup browser với fingerprint.

## Engine lifecycle

Khi bạn gọi `Chromium.launch()`, các bước sau xảy ra:

### 1. Kiểm tra metadata

Engine đọc `project.xml` (có sẵn trong project) để lấy version. Sau đó fetch metadata từ bablosoft để biết URL download và SHA1 checksum. Kết quả được cache vào file để lần sau khởi động nhanh hơn.

### 2. Download + Extract

Nếu engine chưa được tải:

```
data/
└── <version>/
    ├── FastExecuteScript.exe
    ├── project.xml
    └── worker_command_line.txt   # --mock-connector
```

### 3. File-based IPC

Engine giao tiếp qua JSON file, không qua pipe:

```
Bạn gửi:    r/<pid>_<uuid>.json  →  { name: "setup", params: {...} }
Engine trả: Ghi đè nội dung file →  { response: { id, pid, pwd, ... } }
```

### 4. PID cleanup

Trước mỗi request, engine dọn các request cũ từ process đã chết. Không sợ tích tụ file rác.

## Timeout

- **engineTimeout** (mặc định 300s): timeout cho download + extract + spawn
- **requestTimeout** (mặc định 300s): timeout cho từng IPC request
- **closeTimeout** (60s): thời gian chờ engine đóng sau khi process kết thúc

Có thể cấu hình qua env:

```bash
set FINGERPRINT_TIMEOUT=600000  # 10 phút
```

## Sự kiện

Engine phát ra 2 sự kiện:
- `'beforeDownload'`: "Dang tai browser..." -- khi bắt đầu download
- `'beforeExtract'`: "Dang cai dat browser..." -- khi bắt đầu extract
