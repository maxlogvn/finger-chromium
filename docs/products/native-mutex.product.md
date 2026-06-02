# Product: Native Mutex

## Tổng quan

Native Windows named mutex ngăn nhiều instance browser dùng chung profile. Khác với `async-lock` (chỉ đồng bộ trong process), mutex này hoạt động cross-process.

## Tại sao cần mutex?

```
Instance 1: chrome.exe --profile-dir=./profiles/user1
Instance 2: chrome.exe --profile-dir=./profiles/user1  ← crash hoặc corrupt!
```

Nếu 2 browser cùng ghi vào một profile, dữ liệu sẽ bị corrupt. Mutex `BASProcess<pid>` đảm bảo chỉ một process dùng profile tại một thời điểm.

## Cách hoạt động

Khi `_launch()` chạy:

1. Engine trả về `pid` trong setup response
2. `mutex.create('BASProcess' + pid)` -- tạo Windows named mutex
3. Nếu process khác cố launch với cùng profile → `mutex.create()` cùng tên → Windows block
4. Khi process kết thúc → Windows kernel tự động release mutex

## Tại sao không dùng file lock?

`proper-lockfile` lock file có thể bị bỏ qua nếu process dùng `rm -rf`. Native mutex ở kernel level, không thể bypass.

## Lưu ý với Windows

- Mutex chỉ hoạt động trên Windows (win32)
- Native addon prebuilt cho win32-x64 và win32-ia32
- Nếu file `.node` không load được, throw error chi tiết
