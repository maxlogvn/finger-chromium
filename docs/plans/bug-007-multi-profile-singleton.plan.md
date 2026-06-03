# Plan: Bug #7 — Singleton `Chromium` không hỗ trợ launch nhiều profile song song

> Tham chiếu: [Design](../designs/bug-007-multi-profile-singleton.design.md) | [Spec](../specs/bug-007-multi-profile-singleton.spec.md)

## Các bước thực hiện

- [ ] Bước 1: Sửa `src/adapter/playwright/chromium.ts` — xoá singleton, export class trực tiếp
    - Làm gì:
      - Xoá `const Chromium: PWChromium = new BrowserEngine()` và JSDoc singleton phía trên.
      - Export `BrowserEngine` class: thêm `export` trước `class BrowserEngine`.
      - Thêm backward compatibility alias: `export const Chromium = BrowserEngine;` (để code cũ import `Chromium` vẫn chạy — nhưng giờ là class, không phải instance).
      - Cập nhật header comment của file: sửa dòng "Instance được export qua biến `Chromium` (singleton)" thành "Dùng `new BrowserEngine()` để tạo instance riêng cho mỗi session.".
    - File liên quan: `src/adapter/playwright/chromium.ts`
    - Ghi chú: Đây là thay đổi cốt lõi. Backward compatibility alias giúp code cũ import `Chromium` không bị lỗi ngay lập tức, nhưng sẽ cần `new Chromium()` thay vì dùng singleton.

- [ ] Bước 2: Sửa `src/index.ts` — cập nhật export public API
    - Làm gì:
      - Export `BrowserEngine` thay vì `Chromium`:
        ```ts
        export { BrowserEngine, ... } from './adapter/playwright/chromium';
        ```
      - Vì `Chromium` đã là alias của `BrowserEngine`, export `Chromium` vẫn hoạt động như class, nhưng để tránh nhầm lẫn nên export `BrowserEngine` là chính.
      - Cập nhật comment header: dòng "Chromium -- singleton instance" thành "BrowserEngine -- class (dùng new BrowserEngine())".
    - File liên quan: `src/index.ts`
    - Phụ thuộc: Yêu cầu bước 1 hoàn thành trước.

- [ ] Bước 3: Sửa `src/types/PWChromium.ts` — cập nhật JSDoc
    - Làm gì:
      - JSDoc dòng 17: chưa cần sửa `usePrivateKey` (issue #4 riêng).
      - Đảm bảo JSDoc example (dòng 22-36) đã đúng với API mới: dùng `new BrowserEngine()`.
    - File liên quan: `src/types/PWChromium.ts`
    - Ghi chú: JSDoc đã dùng `new BrowserEngine()` ở example — không cần sửa.

- [ ] Bước 4: Sửa `tests/multi_context.ts` — dùng `new BrowserEngine()` cho mỗi profile
    - Làm gì:
      - Import: `import { BrowserEngine } from '../src/adapter/playwright/chromium';`
      - Sửa `launchBrowserWithProfile`: dùng `new BrowserEngine().useProfile(profilePath)`.
      - Sửa `runMultiContextTest`: chạy tuần tự (quit profile trước rồi launch profile sau).
    - File liên quan: `tests/multi_context.ts`
    - Phụ thuộc: Yêu cầu bước 1 hoàn thành trước.

- [ ] Bước 5: Sửa `tests/quit-cleanup.test.ts` — dùng `new BrowserEngine()` thay vì `Chromium`
    - Làm gì:
      - Import: `import { BrowserEngine } from '../src/adapter/playwright/chromium';`
      - Các test dùng `Chromium.quit()` -> tạo `new BrowserEngine()` cho mỗi test.
      - Test `PWChromium interface`: dùng `BrowserEngine.prototype` thay vì `Object.getPrototypeOf(Chromium)`.
    - File liên quan: `tests/quit-cleanup.test.ts`
    - Phụ thuộc: Yêu cầu bước 1 hoàn thành trước.

- [ ] Bước 6: Sửa `tests/browser.ts` — dùng `new BrowserEngine()` thay vì `Chromium`
    - Làm gì:
      - Import: `import { BrowserEngine } from '../src';`
      - Sửa `Chromium.launch()` thành `new BrowserEngine().launch()`.
    - File liên quan: `tests/browser.ts`
    - Phụ thuộc: Yêu cầu bước 1 hoàn thành trước.

> Mỗi bước nên độc lập và có thể kiểm tra được sau khi hoàn thành.
> Bước 1-3 là source code, bước 4-6 là test files — có thể chạy song song sau bước 1.

## Kiểm tra

Các lệnh cần chạy để xác nhận kết quả sau khi code xong:
- `npm run lint` — ESLint + Prettier
- `npm run typecheck` — TypeScript types (tsc --noEmit)
- `npm test` — Mocha tests (nếu có browser và engine available)
- `npm run build` — tsup bundle

Test thủ công:
- `npx tsx tests/multi_context.ts` — kiểm tra multi-profile chạy không lỗi

## Ghi chú

- Đây là breaking change đối với code import `Chromium` dùng như singleton instance. Code mới phải dùng `new BrowserEngine()` hoặc `new Chromium()` (vì `Chromium` giờ là class alias).
- Tầng dưới (connector, RemoteEngine, PCAP server, cleaner, mutex, serviceKey) vẫn là module-level singleton — không refactor.
- Mỗi instance `BrowserEngine` có state riêng (`isLaunched`, `context`, `options`...) nhưng dùng chung engine process qua async-lock queue.
