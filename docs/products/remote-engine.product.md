# Product: RemoteEngine

## Tổng quan

RemoteEngine quản lý vòng đời của `FastExecuteScript.exe` -- tải, giải nén, cấu hình và IPC với engine.

## File-based IPC

Engine giao tiếp qua JSON file trên ổ cứng:

```
Request:  r/<pid>_<uuid>.json  →  { name: "setup", params: {...} }
Response: Ghi đè nội dung file request →  { response: {...} }
```

Lý do không dùng pipe: engine binary được thiết kế để chạy độc lập, không gắn với parent process lifecycle.

## Cache metadata

Sau khi fetch metadata từ bablosoft, lưu vào `cwd/<version>_<ARCH>.json` để lần sau không cần gọi API nữa. Giảm thời gian khởi động và tránh phụ thuộc network.

## SHA1 checksum verification

Mỗi lần start, engine zip được verify SHA1. Nếu checksum không khớp, xoá toàn bộ và tải lại. Ngăn chặn dùng engine corrupt do tải dở dang.
