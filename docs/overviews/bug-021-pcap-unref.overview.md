# Overview: Process không tự động thoát sau khi quit() (Issue #21)

## Tóm tắt

PCAP server (`net.Server`) thiếu `unref()` nên TCP server giữ event loop alive ngay cả sau khi toàn bộ tài nguyên đã được dọn dẹp. Fix: thêm `svr.unref()` trong callback `onListening` — server không giữ event loop, process thoát tự nhiên khi không còn tác vụ nào.

## Kết quả thực hiện

| Bước | Kế hoạch | Thực tế | Sai lệch |
|---|---|---|---|
| Bước 1: Thêm `svr.unref()` trong callback `onListening` | Thêm 1 dòng vào `pcapServer/index.ts` | Đã thêm tại dòng 51 | Không có |
| Bước 2: Chạy kiểm tra | `npm run lint`, `npm run typecheck`, `npm test` | Lint pass (0 errors), typecheck pass, 20 tests pass | Không có |

## Sai lệch đáng chú ý

Không có.

## Tài liệu liên quan

- `docs/designs/bug-021-pcap-unref.design.md`
- `docs/specs/bug-021-pcap-unref.spec.md`
- `docs/plans/bug-021-pcap-unref.plan.md`
- `docs/KNOWN_ISSUES.md` — chuyển #21 từ OPEN sang FIXED
- `docs/Welcome.md` — cập nhật số lượng OPEN issue
- `src/plugin/connector/pcapServer/index.ts` — thêm `svr.unref()`

## Ghi chú

- Fix rất nhỏ (1 dòng), không ảnh hưởng đến module khác.
- `unref()` là method có sẵn của `net.Server` — server vẫn nhận và xử lý connection bình thường khi process còn chạy.
- Đây là issue cuối cùng, hiện không còn OPEN issue nào.
