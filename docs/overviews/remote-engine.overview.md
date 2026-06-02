# Overview: RemoteEngine

File: `src/plugin/connector/engine.ts` (373 dòng -- lớn nhất project).

## Lưu ý kỹ thuật

- `resolvePackageRoot()` walk up directory tree từ `__dirname` -- đây là cách tìm thư mục gốc của package khi dùng `createRequire`. Cần đảm bảo `__dirname` trỏ đúng vì có thể bị ảnh hưởng bởi bundler (tsup bundle vào dist/).
- `chokidar` với `awaitWriteFinish: true` quan trọng vì engine binary ghi file không atomic -- nếu watch ngay lập tức có thể đọc file rỗng hoặc chưa hoàn chỉnh.
- PID cleanup giúp tránh tích tụ file request -- instance mới sẽ dọn request của instance cũ nếu PID đó đã chết.
- `EventEmitter` dùng cho lifecycle events (`beforeDownload`, `beforeExtract`) -- connector/index.ts lắng nghe để log tiến độ.
- `execFile` timeout dùng `Promise.race` -- cần lưu ý child process vẫn tiếp tục chạy ngầm nếu timeout xảy ra. Không có cleanup child process trong trường hợp timeout.
