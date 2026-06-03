# Overview: Bug #7 — Singleton `Chromium` không hỗ trợ launch nhiều profile song song

## Tóm tắt

Đã xoá biến singleton `Chromium`, export trực tiếp class `BrowserEngine` để người dùng tự tạo
instance riêng cho mỗi profile. Giữ alias `Chromium = BrowserEngine` cho backward compatibility.

Tất cả 6 bước trong plan đã hoàn thành:
- `chromium.ts`: xoá singleton, export class + alias, cập nhật comment
- `index.ts`: export `BrowserEngine` thay vì `Chromium`
- `multi_context.ts`: dùng `new BrowserEngine()` cho mỗi profile, chạy tuần tự
- `quit-cleanup.test.ts`: dùng `new BrowserEngine()` thay singleton
- `browser.ts`: dùng `new BrowserEngine().launch()` thay `Chromium.launch()`

## Kết quả thực hiện

| Bước | Kế hoạch | Thực tế | Sai lệch |
|---|---|---|---|
| 1. Sửa `chromium.ts` | Xoá singleton, export class + alias, cập nhật comment | Hoàn thành | Không có |
| 2. Sửa `src/index.ts` | Export `BrowserEngine` thay `Chromium` | Hoàn thành | Không có |
| 3. Kiểm tra `PWChromium.ts` | JSDoc đã dùng `new BrowserEngine()` | Không cần sửa | Không có |
| 4. Sửa `multi_context.ts` | Dùng `new BrowserEngine()`, chạy tuần tự | Hoàn thành | Không có |
| 5. Sửa `quit-cleanup.test.ts` | Dùng `new BrowserEngine()` | Hoàn thành | Không có |
| 6. Sửa `browser.ts` | Dùng `new BrowserEngine().launch()` | Hoàn thành | Không có |

## Sai lệch đáng chú ý

Không có — thực tế đúng với kế hoạch.

## Kiểm tra

- `npm run lint`: pass (0 errors, 16 warnings có sẵn)
- `npm run typecheck`: 2 lỗi có sẵn trong `pcapServer/index.ts` (không liên quan)
- `npm run build`: thành công (ESM + CJS + DTS)
- `npm test`: cần chạy thủ công với browser engine thật

## Tài liệu liên quan

- `docs/designs/bug-007-multi-profile-singleton.design.md`
- `docs/specs/bug-007-multi-profile-singleton.spec.md`
- `docs/plans/bug-007-multi-profile-singleton.plan.md`
- `docs/overviews/bug-007-multi-profile-singleton.overview.md` (file này)

## Ghi chú

- `Chromium` giờ là alias của `BrowserEngine` class, không phải instance — dùng `new BrowserEngine()`.
- Breaking change: code cũ import `Chromium` dùng như singleton sẽ lỗi, cần sửa thành `new Chromium()`.
- Tầng dưới (connector, RemoteEngine, PCAP server, cleaner, mutex) vẫn là singleton — không refactor.
