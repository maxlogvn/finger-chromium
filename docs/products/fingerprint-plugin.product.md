# Product: FingerprintPlugin

## Mô tả

`FingerprintPlugin` là lõi điều phối fingerprint engine. Nó không phải lớp tiện nhất cho user cuối, nhưng là lớp quan trọng nhất để hiểu browser được setup như thế nào.

Nếu `BrowserEngine` là mặt ngoài của API, thì `FingerprintPlugin` là nơi thật sự gọi service, chuẩn bị profile, spawn `worker.exe`, cấu hình viewport và cleanup.

## Cách sử dụng

Thông thường bạn dùng singleton `plugin` qua Playwright Bridge. Khi cần dùng trực tiếp:

```ts
import FingerprintPlugin, { plugin } from './src/plugin';

plugin.setServiceKey(process.env.BABLOSOFT_KEY ?? '');
plugin.setWorkingFolder('.tmp/browser/engine');

const fingerprint = await plugin.fetch({
  tags: ['Microsoft Windows', 'Chrome'],
});

plugin
  .useFingerprint(fingerprint, { safeWebGL: true })
  .useProxy('http://user:pass@127.0.0.1:8080', {
    changeTimezone: true,
  })
  .useProfile('./profiles/user_01', {
    loadProxy: true,
    loadFingerprint: true,
  });

const browser = await plugin.spawn({
  args: ['--window-size=1280,720'],
});

await browser.close();
await plugin.cleanup();

const customPlugin = FingerprintPlugin.create(customLauncher);
```

## Hành vi chi tiết

Các method cấu hình (`useFingerprint`, `useProxy`, `useProfile`, `useBrowserVersion`) chỉ lưu config đã validate. Chúng trả về `this` để chain.

`fetch()` và `versions()` gọi service qua `api()`. Cả hai dùng `serviceKey` đã set bằng `setServiceKey()`.

`spawn()` gọi `_launch(true, options)`. Với bridge Playwright, `_launch(false, options)` được gọi từ `PlaywrightFingerprintPlugin`.

Lifecycle `_launch()` gồm 6 bước:

1. Lấy proxy từ `--proxy-server` nếu user chưa gọi `useProxy()`.
2. Gọi `api('setup')` để engine chuẩn bị fingerprint, proxy, profile và browser path.
3. Đăng ký cleaner và tạo Windows named mutex.
4. Chọn launcher mặc định hoặc launcher custom.
5. Spawn `worker.exe` với `headless: false`.
6. Chạy `configure()` và `synchronize()` để setup viewport và file `.ini`.

`headless: false` được ép ở bước spawn vì một số fingerprint check phát hiện headless mode. Đây là quyết định chủ động để browser giống phiên thật hơn.

## Cleanup

`cleanup()` dọn theo thứ tự:

```txt
browser.close()
  -> connectorCleanup()
  -> mutex.release()
  -> cleaner.stop()
```

Thứ tự này giúp đóng browser trước, rồi mới dọn engine connector và tài nguyên nền. Nếu `browser.close()` lỗi, code vẫn tiếp tục cleanup phần còn lại.

## Giới hạn và điều kiện

- Cần gọi `setServiceKey()` trước các thao tác cần service key như `fetch()`, `versions()` hoặc setup.
- `_launch()` là protected method, không nên gọi trực tiếp từ bên ngoài.
- `FingerprintPlugin` không tự chặn launch nhiều lần. Wrapper như `BrowserEngine` chịu trách nhiệm guard flow public.
- Nếu dùng launcher custom, nên tạo qua `FingerprintPlugin.create()` để validate launcher trước.

## Tài liệu kỹ thuật liên quan

- Spec: `docs/specs/fingerprint-plugin.spec.md`
- Design: `docs/designs/fingerprint-plugin.design.md`
- Source: `src/plugin/index.ts`
