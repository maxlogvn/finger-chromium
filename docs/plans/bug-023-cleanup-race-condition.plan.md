# Plan: Cleanup race condition -- Cleaner chạy trước khi engine process thoát hẳn (Bug fix #23)

## Các bước thực hiện

- [ ] Bước 1: Chuyển `RemoteEngine.kill()` thành async
    - Làm gì: Đổi signature `kill(): void` → `async kill(timeout = 5000): Promise<void>`. Thêm `KILL_TIMEOUT = 5000` constant. Dùng `proc.once('exit')` + Promise để await process exit. Thêm SIGKILL fallback sau timeout.
    - File liên quan: `src/plugin/connector/engine.ts`
    - Ghi chú: Kiểm tra `this.#process` tồn tại và chưa killed trước khi kill. Cleanup path không nên throw.

- [ ] Bước 2: Chuyển `Connector.cleanup()` thành async
    - Làm gì: Đổi signature `cleanup(): void` → `async cleanup(): Promise<void>`. Gọi `await this.#engine.kill()`.
    - File liên quan: `src/plugin/connector/index.ts`
    - Phụ thuộc: Yêu cầu bước 1 hoàn thành.

- [ ] Bước 3: Cập nhật `FingerprintPlugin.cleanup()` để await connector
    - Làm gì: Đổi `this.#connector.cleanup()` thành `await this.#connector.cleanup()`.
    - File liên quan: `src/plugin/index.ts`
    - Phụ thuộc: Yêu cầu bước 2 hoàn thành.

- [ ] Bước 4: Kiểm tra -- lint + typecheck + build + test
    - Làm gì: Chạy `npm run lint`, `npm run typecheck`, `npm run build`, `npm test`.
    - Ghi chú: Fix lỗi nếu có. Kiểm tra test `quit-cleanup.test.ts` có pass không.

## Kiểm tra

- `npm run lint`
- `npm run typecheck`
- `npm run build`
- `npm test`

## Ghi chú

- `SIGKILL` trên Windows tương đương `taskkill /F` -- Node.js xử lý tự động qua `proc.kill('SIGKILL')`.
- `kill()` là cleanup path, không throw lỗi để tránh break chain cleanup.
- `timeout` mặc định 5000ms đủ cho `FastExecuteScript.exe` dọn dẹp trên máy chậm.
