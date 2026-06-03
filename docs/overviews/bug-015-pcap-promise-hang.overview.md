# Overview: Bug #15 — PCAP server retry EADDRINUSE promise không resolve

## Tóm tắt

Đã fix bug PCAP server retry EADDRINUSE nhưng promise gốc không bao giờ resolve — caller treo vĩnh viễn khi port bận. Đồng thời fix 2 lỗi TypeScript `server possibly undefined` phát sinh từ cùng file.

## Kết quả thực hiện

| Bước | Kế hoạch | Thực tế | Sai lệch |
|---|---|---|---|
| B1: Them `reject` vao Promise executor | `new Promise((resolve, reject) =>` | Như kế hoạch | Khong co |
| B2: Sửa error handler — retry voi callback, reject neu khong phai EADDRINUSE | Dung `onListening` callback, `retried` flag, reject error khac | Như kế hoạch | Khong co |
| B3: Kiểm tra | tsc --noEmit, lint, test | Pass het | Khong co |

## Sai lệch đáng chú ý

Không có.

## Tài liệu liên quan

- `docs/designs/bug-015-pcap-promise-hang.design.md`
- `docs/specs/bug-015-pcap-promise-hang.spec.md`
- `docs/plans/bug-015-pcap-promise-hang.plan.md`
- `src/plugin/connector/pcapServer/index.ts` (sửa)
- `docs/KNOWN_ISSUES.md` (cap nhat #15 -> FIXED)

## Ghi chú

- Bug #15 duoc fix dong thoi voi 2 loi TypeScript `server possibly undefined` (dòng 44, 48).
- Retry toi da 1 lan. Neu retry van EADDRINUSE, promise se reject de caller biet loi.
- Khong can them unit test cho `listen()` vì logic ben trong kho mock — se duoc xu ly trong task "Tang test coverage" tren roadmap.
