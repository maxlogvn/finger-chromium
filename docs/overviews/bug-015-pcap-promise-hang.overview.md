# Overview: Bug #15 — PCAP server retry EADDRINUSE promise không resolve

## Tóm tắt

Đã fix bug PCAP server retry EADDRINUSE nhưng promise gốc không bao giờ resolve — caller treo vĩnh viễn khi port bận. Đồng thời fix 2 lỗi TypeScript `server possibly undefined` phát sinh từ cùng file.

## Kết quả thực hiện

| Bước | Kế hoạch | Thực tế | Sai lệch |
|---|---|---|---|
| B1: Thêm `reject` vào Promise executor | `new Promise((resolve, reject) =>` | Như kế hoạch | Không có |
| B2: Sửa error handler — retry với callback, reject nếu không phải EADDRINUSE | Dùng `onListening` callback, `retried` flag, reject error khác | Như kế hoạch | Không có |
| B3: Kiểm tra | tsc --noEmit, lint, test | Pass hết | Không có |

## Sai lệch đáng chú ý

Không có.

## Tài liệu liên quan

- `docs/designs/bug-015-pcap-promise-hang.design.md`
- `docs/specs/bug-015-pcap-promise-hang.spec.md`
- `docs/plans/bug-015-pcap-promise-hang.plan.md`
- `src/plugin/connector/pcapServer/index.ts` (sửa)
- `docs/KNOWN_ISSUES.md` (cập nhật #15 -> FIXED)

## Ghi chú

- Bug #15 được fix đồng thời với 2 lỗi TypeScript `server possibly undefined` (dòng 44, 48).
- Retry tối đa 1 lần. Nếu retry vẫn EADDRINUSE, promise sẽ reject để caller biết lỗi.
- Không cần thêm unit test cho `listen()` vì logic bên trong khó mock — sẽ được xử lý trong task "Tăng test coverage" trên roadmap.
