# Product: RemoteEngine

## Tổng quan

RemoteEngine quản lý vòng đời của `FastExecuteScript.exe` -- tải, giải nén, spawn và giao tiếp qua file-based IPC.

## Luồng hoạt động

1. **Metadata**: đọc `project.xml`, fetch checksum + URL từ bablosoft
2. **Download**: tải zip, verify SHA1, giải nén
3. **Config**: copy `project.xml`, tạo `settings.ini`, `worker_command_line.txt`
4. **Spawn**: chạy `FastExecuteScript.exe` với args `--mock-connector`
5. **IPC**: ghi JSON request, chokidar watch response

## Tuỳ chỉnh timeout

```ts
engine.setEngineTimeout(60000);   // 60s cho khởi động
engine.setRequestTimeout(30000);  // 30s cho mỗi request
```

## Xử lý lỗi checksum

Nếu file zip có checksum không khớp, engine tự động xoá thư mục engine cũ và tải lại.
