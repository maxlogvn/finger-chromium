# Product: Browser Launcher

## Mô tả

`Browser Launcher` có nhiệm vụ spawn Chromium `worker.exe` và phát hiện DevTools listening URL từ output của process. Đây là lớp thấp nhất trong chuỗi launch — sau khi `FingerprintPlugin._launch()` gọi `api('setup')` để engine chuẩn bị cấu hình, nó dùng launcher này để thực sự mở browser.

## Cách sử dụng

Trong luồng thông thường, bạn không gọi launcher trực tiếp. Nó được `FingerprintPlugin._launch()` gọi nội bộ.

Dùng trực tiếp khi cần debug hoặc custom:

```ts
import { launch } from './plugin/launcher';

const browser = await launch({
  executablePath: './path/to/worker.exe',
  debuggingPort: 9222,
  args: ['--window-size=1280,720', '--parent-process-id=12345'],
});

console.log('DevTools URL:', browser.url);
await browser.close();
```

## Hành vi chi tiết

- `launch()` spawn `worker.exe` và parse dòng đầu tiên khớp `DevTools listening on <url>` từ stderr/stdout.
- Nếu không tìm thấy URL sau 30 giây, throw error.
- `close()` dùng `taskkill /pid <pid> /T /F` (Windows) để kill toàn bộ process tree — đảm bảo không còn child process sống sót.
- `configure()` là no-op — chỉ để tương thích với interface `Browser`.

```ts
interface Browser {
  url: string;
  close: () => Promise<void>;
  configure: () => Promise<void>;
}
```

## Giới hạn và điều kiện

- Chỉ hoạt động trên Windows (dùng `taskkill`).
- Cần `executablePath` trỏ đến `worker.exe` hợp lệ.
- `close()` dùng `SIGKILL` tương đương — process không có cơ hội cleanup.

## Tài liệu kỹ thuật liên quan

- Spec: `docs/specs/browser-launcher.spec.md`
- Design: `docs/designs/browser-launcher.design.md`
- Source: `src/plugin/launcher/index.ts`
