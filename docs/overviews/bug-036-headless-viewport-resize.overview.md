# Overview: Headless Viewport Resize Fix

## Tóm tắt

Đã fix `setViewport()` để hoạt động đúng trong headless mode. Khi CDP `Browser.setWindowBounds` không có hiệu lực (headless), fallback tự động sang `page.setViewportSize()` gốc với delta = 0 (không window chrome). Tất cả 164 tests pass, lint/typecheck/build đều ok.

## Kết quả thực hiện

| Bước | Kế hoạch | Thực tế | Sai lệch |
|------|----------|---------|----------|
| 1: WeakMap + lưu original | Thêm module-level WeakMap, sửa `patchPage()` | Hoàn thành đúng kế hoạch | Không có |
| 2: Rewrite setViewport() | CDP + fallback 2 tầng | Hoàn thành đúng kế hoạch | Phải thêm `CDPSession` type import thay vì `import()` type (lint error) |
| 3: Kiểm tra | lint, typecheck, test, build | 164 tests pass, 0 lỗi lint/typecheck/build | Không có |

## Sai lệch đáng chú ý

- **Sai lệch 1:** `import('playwright-core').CDPSession` bị ESLint cấm (`@typescript-eslint/consistent-type-imports`).
    - Nguyên nhân: Dùng inline `import()` type thay vì top-level type import.
    - Hướng xử lý: Thêm `import type { CDPSession } from 'playwright-core'` ở đầu file.
    - Ảnh hưởng đến plan: Không — plan đã ghi `let cdp: import(...)` nhưng lỗi lint được fix ngay.

## Tài liệu liên quan

- `docs/designs/bug-036-headless-viewport-resize.design.md`
- `docs/specs/bug-036-headless-viewport-resize.spec.md`
- `docs/plans/bug-036-headless-viewport-resize.plan.md`
- `docs/overviews/bug-036-headless-viewport-resize.overview.md`
- `src/adapter/playwright/utils.ts` (sửa)
- `docs/KNOWN_ISSUES.md` (cập nhật — #36 chuyển từ OPEN sang FIXED)
- `docs/ROADMAP.md` (cập nhật — trạng thái Hoàn thành)
- `docs/overviews/test-browser.overview.md` (cập nhật — thêm ghi chú đã fix)
- `docs/specs/test-browser.spec.md` (cập nhật — xoá limitation headless)

## Ghi chú

- Low-level plugin (`plugin/browser.ts`) luôn force `headless: false` nên không cần sửa.
- Cơ chế WeakMap đảm bảo không leak memory — Page bị GC thì entry tự động được dọn.
- Test hiện tại (`browser.test.ts:360`) đã chạy với `headless: true` — giờ assert được viewport chính xác.
