# Design: Playwright Bridge -- PlaywrightFingerprintPlugin

## Bối cảnh

`PlaywrightFingerprintPlugin` là bridge giữa `BrowserEngine` và `FingerprintPlugin`. Nó cho phép user hoặc `BrowserEngine` dùng API quen thuộc của Playwright, nhưng bên trong vẫn đi qua lifecycle setup fingerprint của plugin core.

Source làm nguồn sự thật: `src/adapter/playwright/engine.ts`. Các helper liên quan nằm ở `src/adapter/playwright/utils.ts` và loader Playwright nằm ở `src/adapter/playwright/loader.ts`.

Điểm quan trọng: fingerprint engine cần profile cố định và cần setup trước khi browser chạy. Vì vậy bridge ưu tiên `launchPersistentContext()`. `launch()` vẫn có, nhưng chỉ là fallback có cảnh báo.

## Câu hỏi làm rõ

- Nên tạo wrapper riêng hay kế thừa `FingerprintPlugin`? → Kế thừa để dùng lại `useFingerprint()`, `useProxy()`, `useProfile()`, `_launch()` và `cleanup()`.
- Có hỗ trợ `launch()` thuần không? → Có method `launch()`, nhưng method này cảnh báo rồi gọi `launchPersistentContext('', options)`.
- Vì sao dùng `launchPersistentContext()`? → API này mở browser với thư mục profile cố định. Fingerprint engine cần profile/runtime path để setup dữ liệu trước khi trả context.
- Có cho phép Playwright `proxy`, `channel`, `firefoxUserPrefs` không? → Không. Những option này có thể xung đột với engine hoặc không áp dụng cho Chromium fingerprint flow.

## Các phương án

### Phương án 1: Wrapper không kế thừa

Tạo class riêng chứa một instance `FingerprintPlugin` và một Playwright `BrowserType`.

- Ưu điểm: Tách trách nhiệm rõ.
- Nhược điểm: Phải viết lại nhiều method cấu hình hoặc proxy chúng sang plugin core. Dễ lệch API.

### Phương án 2: Kế thừa `FingerprintPlugin`

`PlaywrightFingerprintPlugin extends FingerprintPlugin`, override `launch()`, `launchPersistentContext()`, và `configure()`.

- Ưu điểm: Dùng lại được Fluent API và `_launch()`. Ít duplicate code.
- Nhược điểm: Bridge phải hiểu rõ protected lifecycle của `FingerprintPlugin`.

### Phương án 3: Patch trực tiếp Playwright `BrowserType`

Thay đổi trực tiếp method của Playwright.

- Ưu điểm: User có thể dùng Playwright như cũ.
- Nhược điểm: Khó kiểm soát side effect. Khi Playwright đổi internal behavior, patch dễ vỡ.

## Giải pháp được chọn

- Phương án AI đề xuất: Phương án 2.
- Phương án được chọn: Phương án 2.
- Lý do: Kế thừa giúp bridge giữ đúng lifecycle core nhưng vẫn expose API gần với Playwright.
- Ràng buộc hoặc điều kiện kèm theo:
  - `launch()` không launch browser thuần. Nó fallback sang `launchPersistentContext()`.
  - `launchPersistentContext()` validate unsupported options trước khi gọi `_launch(false, options)`.
  - Launcher proxy loại `--user-data-dir` khỏi args để profile runtime do engine quyết định.
  - `--disable-extensions` được thêm vào `ignoreDefaultArgs` để tránh default arg này làm sai hành vi cần thiết của engine.
  - `configure()` chịu trách nhiệm đăng ký cleanup và đồng bộ viewport sau khi browser đã mở.

## Luồng thiết kế

```txt
BrowserEngine.newContext()
  -> PlaywrightFingerprintPlugin.launchPersistentContext(userDataDir, options)
  -> validate unsupported options
  -> wrap launcher.launch()
  -> FingerprintPlugin._launch(false, options)
  -> launcher proxy gọi Playwright launchPersistentContext()
  -> configure(context, bounds, sync)
```

Bridge không tự gọi `api('setup')`. Việc đó nằm trong `_launch()` của `FingerprintPlugin`. Bridge chỉ đảm bảo Playwright được gọi theo cách phù hợp với profile và viewport mà engine đã chuẩn bị.

## Thiết kế viewport và cleanup

`configure()` nhận `BrowserContext` từ `_launch()` và làm 3 việc:

1. Dùng `onClose()` để đăng ký cleanup khi context đóng.
2. Nếu engine trả về `bounds`, kiểm tra viewport page đầu tiên và resize bằng CDP nếu cần.
3. Dùng `bindHooks()` để page mới cũng được resize theo fingerprint bounds.

CDP là Chrome DevTools Protocol, giao thức điều khiển Chromium cấp thấp. Bridge dùng CDP vì Playwright `setViewportSize()` có thể không đủ chính xác khi fingerprint đã khóa kích thước.
