# Design: Test Error classes & Utilities

## Bối cảnh

Hiện tại dự án có nhiều module tiện ích và xử lý lỗi quan trọng nhưng chưa có unit test:

- `src/plugin/errors.ts` — Hệ thống 5 error class (PluginError, MissingKeyError, InvalidEngineError, EngineTimeoutError, RequestTimeoutError) dùng `dedent` và `Symbol.toStringTag`.
- `src/plugin/utils.ts` — 4 hàm xử lý arguments Chromium, profile path, validation config và launcher.
- `src/common/index.ts` — 2 in-browser script (waitForResize, getViewport) chạy qua `page.evaluate()`.
- `src/loader/index.ts` — Class `Loader` dùng `createRequire` và `compare-versions` để resolve package.

Thiếu test coverage dẫn đến nguy cơ regression khi sửa code, đặc biệt là các module được nhiều nơi phụ thuộc.

## Câu hỏi làm rõ

- Làm sao test `common/index.ts` — các script chạy trong browser context? → Cần Playwright browser thật hoặc mock `page.evaluate()`. Test bằng browser thật là chuẩn nhất, nhưng tốn tài nguyên. Tuy nhiên dự án đã xác định "Không mock Playwright browser trong test -- test với browser thật" (AGENTS.md), nên sẽ dùng browser thật cho integration test, và unit test cho logic còn lại.
- Làm sao test `loader/index.ts` — `createRequire` và `import()` chỉ hoạt động ở Node.js? → Dùng mock `require` bằng cách inject dependency hoặc dùng `Proxy` để giả lập. Có thể test với `playwright-core` thật nếu có sẵn.
- Cần test `dedent` trong error classes không? → Không cần test `dedent` — đó là thư viện bên thứ ba. Chỉ test message output và behavior của error class.

## Các phương án

### Phương án 1: Tách thành 1 file test duy nhất `tests/utils.test.ts`

Gộp tất cả module vào một file test, dùng `describe` để phân nhóm.

- Ưu điểm: Đơn giản, dễ maintain, một file cho tất cả — phù hợp vì mỗi module chỉ có 2-5 function/class.
- Nhược điểm: File có thể hơi dài (~200 dòng), nhưng vẫn chấp nhận được.

### Phương án 2: Tách mỗi module thành file test riêng

`tests/errors.test.ts`, `tests/utils.test.ts`, `tests/common.test.ts`, `tests/loader.test.ts`.

- Ưu điểm: Phân tách rõ ràng, dễ tìm file khi cần sửa.
- Nhược điểm: Quá nhiều file nhỏ cho module ít code — gây rối thư mục `tests/`.

### Phương án 3: Gom theo nhóm — errors + utils chung, common + loader riêng

- Ưu điểm: Cân bằng giữa tổ chức và đơn giản.
- Nhược điểm: Không nhất quán với test hiện có (quit-cleanup.test.ts gộp nhiều module).

## Giải pháp được chọn

- **Phương án AI đề xuất:** Phương án 1 — gộp tất cả vào `tests/utils.test.ts` với các `describe` block rõ ràng. Lý do: mỗi module có ít function, gộp chung giúp dễ maintain hơn, và phù hợp với pattern test hiện tại (quit-cleanup.test.ts cũng test nhiều module trong một file).
- **Phương án được chọn:** (do người duyệt điền)
- **Lý do:** (do người duyệt điền)
- **Ràng buộc hoặc điều kiện kèm theo (nếu có):** (do người duyệt điền)
