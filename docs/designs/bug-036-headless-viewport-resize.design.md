# Design: Headless viewport resize — fallback CDP → page.setViewportSize

## Bối cảnh

`setViewport()` trong `src/adapter/playwright/utils.ts:82-112` dùng CDP `Browser.setWindowBounds` để resize viewport. API này không hoạt động trong `headless: true` vì không có OS window để đặt kích thước. Hậu quả: viewport giữ nguyên kích thước mặc định, không khớp với fingerprint, dẫn đến website có thể phát hiện sự bất thường.

Trong khi đó:
- `bindHooks()` đã proxy `page.setViewportSize` để chặn user tự ý thay đổi kích thước đã fingerprint lock.
- Low-level plugin (`_launch`) luôn force `headless: false` nên không bị ảnh hưởng.
- Chỉ có Playwright bridge (`engine.ts`) mới gặp lỗi này khi user truyền `headless: true`.

## Câu hỏi làm rõ

- Có nên detect headless flag từ options không? → Không, vì auto-fallback đơn giản hơn và không cần sửa signature.
- Delta resize trong headless có khác không? → Có, headless không có window chrome nên delta = 0.
- `page.setViewportSize` đã bị proxy, làm sao gọi được bản gốc? → Lưu original vào WeakMap trước khi proxy.

## Các phương án

### Phương án A: Auto-fallback (được chọn)

`setViewport()` thử CDP `Browser.setWindowBounds` trước. Nếu viewport vẫn sai sau `MAX_RESIZE_RETRIES` lần retry, fallback sang `page.setViewportSize()` gốc với delta = 0. Lưu original function vào `WeakMap<Page, Function>` trước khi `bindHooks()` proxy.

- Ưu điểm: Không cần detection, tự động thích nghi — chạy đúng cả headed lẫn headless. Không sửa signature hàm hay caller chain.
- Nhược điểm: Tốn 3 lần retry CDP (mỗi lần ~16ms) trước khi fallback. Chấp nhận được.

### Phương án B: Headless flag explicit

Thêm `headless` flag vào `setViewport()` params. Caller chain (`configure()` → `sync()`) truyền flag từ `PlaywrightFingerprintPlugin.launchPersistentContext()`.

- Ưu điểm: Không tốn retry vô ích.
- Nhược điểm: Cần sửa signature của `setViewport()`, `sync()`, `configure()`, `ConfigManager.configure()`, và cả protected method `FingerprintPlugin.configure()`. Nhiều file thay đổi, dễ gây regression.

### Phương án C: CDP-only + warning

Giữ nguyên CDP, chỉ thêm warning "resize không hoạt động trong headless". User tự set viewport khi tạo context.

- Ưu điểm: Ít code nhất, 0 rủi ro.
- Nhược điểm: Không fix được bug — user vẫn gặp viewport sai. Trái với mục tiêu của thư viện là tự động hóa toàn bộ fingerprint.

## Giải pháp được chọn

- Phương án AI đề xuất: **Phương án A (Auto-fallback)** — vì tự động, không cần thay đổi API, ít rủi ro regression nhất.
- Phương án được chọn: Phương án A.
- Lý do: Đơn giản, an toàn, không cần thay đổi caller chain hay public API.
- Ràng buộc: Cần lưu `originalSetViewportSize` trong `WeakMap` vì `Page` interface không có property để lưu.
