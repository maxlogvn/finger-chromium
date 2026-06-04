# Design: Test Browser (Launcher + BrowserEngine + PlaywrightBridge)

## Bối cảnh

Dự án đã có test cho Error classes, Utils, Connector, Cleanup, Profile -- tổng cộng 116 tests pass. Module Browser (gồm `launcher`, `utils`, `engine`, `chromium`) là module cuối chưa có test suite riêng. Codebase chỉ có 2 test cũ (`multi-profile-singleton`, `quit-cleanup`) dùng `BrowserEngine` nhưng không coverage hết.

Cần test suite cho 4 file:
- `src/plugin/launcher/index.ts` -- spawn Chromium, parse DevTools URL, kill process.
- `src/adapter/playwright/utils.ts` -- isBrowser, onClose, bindHooks, setViewport.
- `src/adapter/playwright/engine.ts` -- PlaywrightFingerprintPlugin bridge.
- `src/adapter/playwright/chromium.ts` -- BrowserEngine fluent API, lifecycle.

## Câu hỏi làm rõ

- **Phạm vi test mong muốn?** (unit / integration / hybrid) → Integration test nhiều, dùng Playwright thật.
- **Có cần test với engine binary thật không?** (FastExecuteScript.exe) → Không, chỉ dùng Playwright Chromium thật.

## Các phương án

### Phương án 1: Full integration -- mọi module đều dùng Playwright thật
- Launcher: spawn Chromium thật, parse DevTools URL thật.
- Utils: setViewport với CDP thật, bindHooks với Browser/Context thật.
- Engine/Chromium: full lifecycle với Playwright thật + FingerprintPlugin thật (trừ engine binary).
- Ưu điểm: Coverage sát production, phát hiện lỗi tích hợp sớm.
- Nhược điểm: Chậm (~5-10s mỗi test), phụ thuộc Chromium binary.

### Phương án 2: Hybrid -- launcher với process thật, còn lại mock vừa phải
- Launcher: spawn Node.js script giả lập Chromium output.
- Utils: isBrowser/onClose dùng object thật, bindHooks/setViewport mock CDP.
- Engine/Chromium: dùng Playwright BrowserType thật, mock FingerprintPlugin internals.
- Ưu điểm: Launcher integration đúng, các module khác nhanh hơn.
- Nhược điểm: Không test được end-to-end fingerprint injection.

### Phương án 3: Tách file test riêng cho từng module
- `tests/launcher.test.ts`: spawn node script thật.
- `tests/utils.test.ts`: mock CDP session.
- `tests/engine.test.ts`: mock FingerprintPlugin._launch().
- `tests/chromium.test.ts`: mock Playwright + engine.
- Ưu điểm: Độc lập, dễ maintain.
- Nhược điểm: Setup nhiều hơn.

## Giải pháp được chọn

- Phương án AI đề xuất: Phương án 1 (Full integration với Playwright thật) -- vì người dùng yêu cầu "integration test nhiều".
- Phương án được chọn: Phương án 1.
- Lý do: Coverage thực tế nhất, phát hiện lỗi tích hợp sớm, dùng Playwright Chromium thật nhưng không cần engine binary bablosoft.
- Ràng buộc: Skip test nếu không tìm thấy Playwright Chromium binary. Timeout mỗi test 30s. Cleanup triệt để trong afterEach.
