# Plan: Test Browser (Launcher + BrowserEngine + PlaywrightBridge)

> Tham chiếu: [Spec](../specs/test-browser.spec.md) | [Design](../designs/test-browser.design.md)

## Các bước thực hiện

- [ ] Bước 1: **Tạo file `tests/browser.test.ts` với header và import**
    - Làm gì: Tạo file test, thêm header comment mô tả, import các module cần thiết (`describe`, `it`, `before`/`after` từ mocha, `strictEqual`/`ok`/`rejects`/`throws` từ `node:assert`, import `playwright` và các module cần test).
    - File liên quan: `tests/browser.test.ts`
    - Phụ thuộc: Không

- [ ] Bước 2: **Viết helper `getChromium()` và hook `before`/`after` chung**
    - Làm gì: Helper tìm executablePath, nếu không có thì `describe.skip`. Hook `before` launch browser một lần. Hook `after` close browser.
    - File liên quan: `tests/browser.test.ts`
    - Phụ thuộc: Bước 1

- [ ] Bước 3: **Viết test suite Launcher (`launch()` + `Browser`)**
    - Làm gì: 7 tests theo spec. Dùng `launch()` từ `src/plugin/launcher/index.ts` với Chromium thật.
    - File liên quan: `tests/browser.test.ts`
    - Phụ thuộc: Bước 2

- [ ] Bước 4: **Viết test suite Utils (`isBrowser`, `onClose`, `bindHooks`, `setViewport`)**
    - Làm gì: 8 tests theo spec. Dùng browser instance từ hook chung.
    - File liên quan: `tests/browser.test.ts`
    - Phụ thuộc: Bước 2 (cần browser thật)

- [ ] Bước 5: **Viết test suite PlaywrightFingerprintPlugin**
    - Làm gì: 9 tests theo spec. Tạo `PlaywrightFingerprintPlugin` instance riêng trong mỗi test.
    - File liên quan: `tests/browser.test.ts`
    - Phụ thuộc: Bước 1

- [ ] Bước 6: **Viết test suite BrowserEngine (constructor + fluent API)**
    - Làm gì: 6 tests -- constructor, repackChromium, useFingerprint, useProxy, useProfile, launch guard.
    - File liên quan: `tests/browser.test.ts`
    - Phụ thuộc: Bước 1

- [ ] Bước 7: **Viết test suite BrowserEngine (lifecycle: launch, newContext, quit)**
    - Làm gì: 8 tests -- launch, newContext, quit, guards, idempotent.
    - File liên quan: `tests/browser.test.ts`
    - Phụ thuộc: Bước 6

- [ ] Bước 8: **Chạy kiểm tra**
    - Làm gì: `npm run lint && npm run typecheck && npm test`
    - Ghi chú: Sửa lỗi nếu có, lặp lại cho đến khi pass.

## Kiểm tra

```bash
npm run lint       # ESLint
npm run typecheck  # TypeScript type check
npm test           # Mocha tests (cả test cũ lẫn mới)
```

## Ghi chú

- Test cũ `tests/multi-profile-singleton.test.ts` và `tests/quit-cleanup.test.ts` đã dùng `BrowserEngine` -- cần kiểm tra không conflict.
- `PlaywrightFingerprintPlugin.launchPersistentContext()` gọi `this._launch()` từ base class -- không cần mock vì `_launch()` kiểm tra key và engine, sẽ throw nếu chưa setup. Cần truyền launcher mock để bypass.
- Vì dùng Playwright thật, các test chạy chậm hơn test thường -- đã set timeout 30s trong `.mocharc.yml` (hiện tại 10s, cần tăng lên 30s).
