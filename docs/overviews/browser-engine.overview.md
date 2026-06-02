# Overview: BrowserEngine

File: `src/adapter/playwright/chromium.ts` (228 dòng).

## Lưu ý kỹ thuật

- `repackChromium()` tạo `PlaywrightFingerprintPlugin` mới với custom launcher. Điều này reset toàn bộ config đã set trước đó -- user phải gọi lại `useFingerprint()`, `useProxy()`, v.v. sau khi gọi `repackChromium()`. Đây là hạn chế của thiết kế hiện tại.
- `saveProfileDirPath` vs `profileData`: `saveProfileDirPath` là path gốc user nhập vào. `profileData` là `[tempPath, options]` -- path đã được map sang temp. Quit() dùng `saveProfileDirPath` để copy về.
- `DEFAULT_CONTEXT_OPTIONS`: `{ headless: false, hasTouch: true }` -- `hasTouch: true` giúp tránh fingerprint check phát hiện thiếu touch support (thường là desktop browser thật có touch).
- Lifecycle enforcement dùng private boolean `isLaunched` và kiểm tra `context` tồn tại. Đơn giản nhưng hiệu quả.
- Profile mapping dùng `Date.now()` + `Math.random()` cho tên temp dir. `Math.random()` thay vì `crypto.randomBytes` vì không cần bảo mật cao, performance tốt hơn.
