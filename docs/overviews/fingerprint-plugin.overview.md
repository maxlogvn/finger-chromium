# Overview: FingerprintPlugin

File: `src/plugin/index.ts` (282 dòng), singleton `plugin`.

## Lưu ý kỹ thuật

- `serviceKey` là module-level variable (không phải class property). Điều này có nghĩa tất cả instance FingerprintPlugin chia sẻ cùng một key. Đây là thiết kế vì key là global setting.
- `_launch()` có tham số `useDefaultLauncher` -- đây là flag nội bộ để phân biệt 2 đường dẫn launch. Playwright bridge gọi `_launch(false, ...)` để dùng custom launcher. Plugin standalone gọi `_launch(true, ...)` để spawn worker.exe trực tiếp.
- `setProxyFromArguments()` parse `--proxy-server` từ mảng args. Đây là fallback cho trường hợp proxy được cấu hình qua arg command line thay vì qua fluent API.
- `configure()` override ở PlaywrightFingerprintPlugin: method này nhận `BrowserContext` thay vì `Browser` -- type safety không hoàn hảo ở điểm này.
- `SetupResponse` chứa `[key: string]: unknown` -- response format từ engine binary có thể thay đổi tuỳ version, cần xử lý linh hoạt.
