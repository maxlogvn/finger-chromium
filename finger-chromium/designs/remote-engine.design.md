# Design: RemoteEngine

## Vấn đề cần giải quyết

Thư viện cần giao tiếp với một engine binary (`FastExecuteScript.exe`) từ bablosoft để setup fingerprint, proxy, và profile cho trình duyệt Chromium. Engine này là một file .exe chạy riêng biệt -- không phải thư viện Node.js.

Do đó, cần giải quyết:

1. **Tải engine:** Engine binary được phân phối qua bablosoft.com. Cần tải về đúng version, verify checksum, giải nén.
2. **Cấu hình:** Engine cần các file cấu hình như `project.xml`, `settings.ini`, `worker_command_line.txt` để biết nó phải làm gì.
3. **Giao tiếp (IPC):** Cần gửi lệnh (setup, versions...) và nhận kết quả từ engine.
4. **Đồng bộ:** Nhiều request không được gọi cùng lúc -- engine chỉ xử lý một request tại một thời điểm.
5. **Dọn dẹp:** Request cũ từ process đã chết cần được xoá để tránh tích tụ.

## Các phương án IPC

### 1. Pipe/stdio

Giao tiếp qua stdin/stdout của child process.

**Ưu điểm:** Nhanh, real-time.

**Nhược điểm:** Engine FastExecuteScript.exe không hỗ trợ pipe -- nó chỉ ghi log ra stdout/stderr, không phải dữ liệu JSON có cấu trúc.

### 2. Socket/TCP

Mở một TCP socket để giao tiếp.

**Ưu điểm:** Có thể giao tiếp hai chiều.

**Nhược điểm:** Engine không hỗ trợ TCP -- nó chỉ đọc file từ thư mục `r/`.

### 3. File-based IPC (chọn)

Engine hỗ trợ sẵn cơ chế: đọc file JSON từ thư mục `r/<pid>_<uuid>.json` và ghi phản hồi vào cùng file đó.

**Ưu điểm:**
- Engine hỗ trợ sẵn, không cần chỉnh sửa.
- Dễ debug -- có thể đọc file request/response.
- Không cần cơ chế đồng bộ phức tạp -- engine tự xử lý tuần tự.

**Nhược điểm:**
- Chậm hơn pipe (phải đọc/ghi file, watch file system).
- Cần watch file để biết khi nào engine trả lời.
- File rác có thể tích tụ nếu không dọn.

## Giải pháp chọn

### Kiến trúc tổng thể

```
Node.js (RemoteEngine)
    │
    ├── 1. Đọc project.xml → lấy EngineVersion
    │       │
    │       ▼
    ├── 2. Fetch metadata từ bablosoft.com
    │       │  (cache vào file json)
    │       ▼
    ├── 3. Download FastExecuteScript.x{ARCH}.zip
    │       │  (kiểm tra SHA1 checksum)
    │       ▼
    ├── 4. Extract zip vào thư mục script/
    │       │
    │       ▼
    ├── 5. Copy project.xml + tạo settings.ini + worker_command_line.txt
    │       │
    │       ▼
    ├── 6. Spawn FastExecuteScript.exe
    │       │
    │       ▼
    └── 7. runFunction(name, params)
            │
            ├── Dọn request cũ không còn process sở hữu
            ├── Ghi JSON request → r/<pid>_<uuid>.json
            └── Watch file → đọc response → parse JSON → trả về
```

### Tại sao cần cache metadata?

Mỗi lần khởi động, engine phải fetch metadata từ bablosoft.com để biết URL download và checksum. Nếu không có cache:
- Mỗi lần launch đều phải request HTTP.
- Nếu mạng chậm hoặc bablosoft down, không launch được.
- Cache theo `<version>_<ARCH>.json` giúp lần sau khởi động nhanh hơn (chỉ đọc file local).

### Tại sao kiểm tra checksum?

Tránh tải phải file hỏng hoặc đã bị chỉnh sửa. Nếu checksum không khớp, xoá engine cũ và tải lại. Checksum là SHA1 của zip file.

### Tại sao dọn request cũ?

Khi process engine crash, các file request trong thư mục `r/` vẫn còn. Nếu không dọn:
- Số lượng file tăng dần theo thời gian.
- Có thể gây nhầm lẫn nếu PID được reuse.
- Cơ chế: kiểm tra mỗi file request, nếu process sở hữu (PID) không còn tồn tại, xoá file.

---
