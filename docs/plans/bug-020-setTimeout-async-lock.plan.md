# Plan: Bug #20 — Hardcoded `await setTimeout(2000)` bên trong async-lock

## Các bước thực hiện

- [x] Bước 1: Cập nhật ROADMAP — đánh dấu "Đang làm"
    - Đã làm, thêm entry Bug #20 vào ROADMAP.md.

- [x] Bước 2: Viết design
    - File: `docs/designs/bug-020-setTimeout-async-lock.design.md`

- [x] Bước 3: Viết spec
    - File: `docs/specs/bug-020-setTimeout-async-lock.spec.md`

- [ ] Bước 4: Code — sửa `synchronize()` trong `src/plugin/config.ts`
    - Thêm tham số `pollInterval?: number` vào hàm `synchronize()`.
    - Thay `await setTimeout(2000)` bằng `await setTimeout(pollInterval ?? 500)`.
    - Thêm validation: clamp pollInterval về 100ms nếu < 100, về 500ms nếu invalid.
    - File: `src/plugin/config.ts`

- [ ] Bước 5: Chạy kiểm tra
    - `npm run lint`
    - `npm run typecheck`
    - `npm run build`

- [ ] Bước 6: Rà soát tài liệu liên quan
    - Cập nhật KNOWN_ISSUES.md: chuyển #20 từ OPEN sang FIXED.
    - Kiểm tra ROADMAP.md, Welcome.md, CONVENTIONS.md có bị ảnh hưởng không.
    - File: `docs/KNOWN_ISSUES.md`

- [ ] Bước 7: Viết overview
    - File: `docs/overviews/bug-020-setTimeout-async-lock.overview.md`

- [ ] Bước 8: Cập nhật ROADMAP — đánh dấu "Hoàn thành"

## Kiểm tra

Các lệnh cần chạy để xác nhận kết quả sau khi code xong:
- `npm run lint`
- `npm run typecheck`
- `npm run build`

## Ghi chú

- `synchronize` là function export — cần đảm bảo backward compatible (tham số mới optional).
- AsyncLock instance là module-level singleton, nhưng lock key `id` là unique mỗi instance — không block cross-instance.
- Thay đổi timeout từ 2000 → 500 có thể ảnh hưởng nếu engine poll interval > 500ms. Tham số `pollInterval` cho phép fallback.
