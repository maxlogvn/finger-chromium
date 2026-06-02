# Product: BrowserEngine

## Mô tả

`BrowserEngine` là API chính mà user dùng qua singleton `Chromium`. Nó gom các cấu hình thường dùng như fingerprint, proxy, profile, rồi tạo `BrowserContext` để user thao tác bằng Playwright.

Nói ngắn gọn: `BrowserEngine` là lớp "điều phối bên ngoài". Nó không tự inject fingerprint. Nó chuẩn bị cấu hình đúng thứ tự và chuyển việc launch thật cho `PlaywrightFingerprintPlugin`.

## Cách sử dụng

Key bảo mật được đọc từ biến môi trường `BABLOSOFT_KEY`.

```ts
import { Chromium } from 'fingerprint-chromium-engine';

const fingerprintData = await Chromium.newFingerprint({
  tags: ['Microsoft Windows', 'Chrome'],
});

const context = await Chromium
  .useFingerprint(fingerprintData, {
    safeWebGL: true,
    usePerfectCanvas: true,
  })
  .useProxy('http://user:pass@127.0.0.1:8080', {
    changeTimezone: true,
    changeGeolocation: true,
    changeWebRTC: 'replace',
  })
  .useProfile('./profiles/user_01', {
    loadProxy: true,
    loadFingerprint: true,
  })
  .launch({
    viewport: { width: 1280, height: 720 },
  })
  .newContext();

const page = await context.newPage();
await page.goto('https://example.com');

await Chromium.quit();
```

## Hành vi chi tiết

`useFingerprint()`, `useProxy()` và `useProfile()` chỉ đăng ký cấu hình. Chúng chưa mở browser và chưa gọi engine.

`launch()` là bước khóa cấu hình. Method này:

- hợp nhất options mặc định với options user truyền vào,
- set service key từ `BABLOSOFT_KEY`,
- set thư mục làm việc của engine,
- truyền profile, proxy, fingerprint xuống `PlaywrightFingerprintPlugin`.

`newContext()` mới là bước tạo `BrowserContext`. Bên trong, method này gọi `engine.launchPersistentContext()`. `launchPersistentContext` là API Playwright dùng thư mục profile cố định, nên phù hợp với profile bền vững.

`quit()` đóng context, lưu profile nếu có, rồi gọi `engine.cleanup()`. Cần gọi cleanup vì đóng context chưa chắc dọn hết worker process, engine process, PCAP server, cleaner và mutex.

## Giới hạn và điều kiện

- `Chromium` là singleton. Thiết kế này giúp tránh nhiều engine instance tranh chấp cùng thư mục runtime.
- `launch()` chỉ gọi được một lần cho mỗi vòng đời. Muốn chạy phiên mới thì gọi `quit()` trước.
- Mỗi vòng đời chỉ có một `BrowserContext`.
- `useProfile()` không ghi trực tiếp vào thư mục profile gốc khi browser đang chạy. Profile được map sang thư mục tạm để giảm nguy cơ corrupt dữ liệu.
- Code hiện tại không có method public để đổi key trên `BrowserEngine`. Nếu cần đổi key, dùng biến môi trường `BABLOSOFT_KEY` trước khi chạy process Node.js.

## Khi nào dùng

Dùng `Chromium` khi muốn flow đơn giản nhất:

```txt
cấu hình fingerprint/proxy/profile
  -> launch
  -> newContext
  -> dùng Playwright
  -> quit
```

Nếu cần can thiệp sâu vào launcher Playwright, dùng `repackChromium(launcher)`. Chỉ nên dùng khi hiểu rõ launcher custom, vì thay sai launcher có thể làm fingerprint không được setup đúng.

## Tài liệu kỹ thuật liên quan

- Spec: `docs/specs/browser-engine.spec.md`
- Design: `docs/designs/browser-engine.design.md`
- Source: `src/adapter/playwright/chromium.ts`
