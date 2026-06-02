# Product: File Cleanup Daemon

## Tổng quan

Daemon tự động dọn thư mục tạm, ngăn tích tụ file rác.

## Cách hoạt động

1. Timer mỗi 15s quét thư mục dọn
2. Kiểm tra lockfile (`proper-lockfile`) trước khi delete
3. File đang dùng bởi process khác → skip
4. Hỗ trợ ignore/include pattern

## Config

```ts
new CleanupDaemon({
  interval: 30000,       // 30s
  cleanDir: './temp',
  ignorePatterns: ['*.log'],
});
```
