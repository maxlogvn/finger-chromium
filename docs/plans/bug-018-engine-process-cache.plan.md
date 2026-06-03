# Plan: Bug #18 — Cache engine process giữa các API calls

## Các bước thực hiện

- [ ] Bước 1: Thêm private method `#isProcessAlive()` trong `RemoteEngine`
    - Làm gì: Thêm method kiểm tra process còn sống dùng `proc.killed` + `process.kill(pid, 0)`.
    - File liên quan: `src/plugin/connector/engine.ts`
    - Ghi chú: Đặt ở khu vực private methods, gần `#startProcessInternal()`.

- [ ] Bước 2: Sửa `#startProcess()` để cache process
    - Làm gì: Thêm check đầu method — nếu `this.#isProcessAlive(this.#process)` thì return `this.#process!` (kèm debug log). Chỉ spawn mới khi cache miss.
    - File liên quan: `src/plugin/connector/engine.ts`
    - Phụ thuộc: Yêu cầu bước 1 hoàn thành trước.

## Kiểm tra

- `npm run lint`
- `npm run typecheck`
- `npm run build`
- `npm test`

## Ghi chú

- Không cần sửa test hiện tại vì không thay đổi API.
- Nếu cần verify behavior: quan sát log `browser-with-fingerprints:connector:engine` — lần 2 sẽ thấy "Tái sử dụng tiến trình engine hiện tại".
