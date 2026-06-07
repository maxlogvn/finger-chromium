# Hướng dẫn nâng cao

Tài liệu này mô tả các tính năng và kỹ thuật nâng cao khi sử dụng `fingerprint-chromium-engine`.

## Sử dụng Playwright launcher tuỳ chỉnh

Mặc định, engine sử dụng launcher Playwright tích hợp sẵn. Bạn có thể thay thế bằng launcher tuỳ chỉnh nếu cần.

```ts
import { BrowserEngine } from 'fingerprint-chromium-engine';
import { chromium as playwrightChromium } from 'playwright-core';

const engine = new BrowserEngine();

const context = await engine
  .useFingerprint(fp)
  .useProxy(proxyUrl)
  .useLauncher(playwrightChromium)
  .launch({ headless: false })
  .newContext();
```

**Khi nào cần launcher tuỳ chỉnh**:
- Dùng phiên bản Playwright khác với mặc định.
- Dùng bản Chromium đã được patch hoặc tuỳ chỉnh.
- Cần kiểm soát chi tiết các tham số launch.

---

## Sử dụng Connector tuỳ chỉnh

Connector là thành phần giao tiếp giữa engine và Playwright. Bạn có thể truyền connector tuỳ chỉnh qua tham số thứ hai của `useLauncher()`.

```ts
import type Connector from './path/to/connector';

const customConnector: Connector = {
  // ... triển khai tuỳ chỉnh
};

engine.useLauncher(playwrightChromium, customConnector);
```

---

## Biến môi trường

Engine hỗ trợ các biến môi trường để tuỳ chỉnh hành vi:

| Biến                   | Mặc định                 | Mô tả                                               |
| ---------------------- | ------------------------ | --------------------------------------------------- |
| `BABLOSOFT_KEY`        | (trống)                  | Private key để kết nối service                       |
| `ENGINE_WORKING_DIR`   | `.tmp/browser/engine`    | Thư mục làm việc của engine (tải, giải nén)           |
| `BROWSER_RUNNING_DIR`  | `.tmp/browser/running`   | Thư mục runtime của trình duyệt                       |
| `DEBUG`                | (trống)                  | Bật debug log. VD: `browser-with-fingerprints:*`      |

### Cấu hình thư mục engine

```bash
# PowerShell
$env:ENGINE_WORKING_DIR = "D:\engines\chromium"
$env:BROWSER_RUNNING_DIR = "D:\browsers\running"
```

```bash
# Hoặc qua file .env
ENGINE_WORKING_DIR=D:\engines\chromium
BROWSER_RUNNING_DIR=D:\browsers\running
```

**Lưu ý**: Đường dẫn phải là đường dẫn tuyệt đối nếu cần tránh nhầm lẫn với cwd.

---

## Debug logging

Engine sử dụng thư viện `debug` để log theo namespace:

```bash
# Bật toàn bộ log
set DEBUG=browser-with-fingerprints:*

# Chỉ bật log của connector
set DEBUG=browser-with-fingerprints:connector

# Chỉ bật log của engine
set DEBUG=browser-with-fingerprints:connector:engine

# Bật log của pcap server
set DEBUG=browser-with-fingerprints:connector:pcapServer

# Bật log của cleaner
set DEBUG=browser-with-fingerprints:cleaner
```

---

## Chạy ở chế độ headless

```ts
const context = await engine
  .useFingerprint(fp)
  .useProxy(proxyUrl)
  .launch({ headless: true })
  .newContext();
```

**Lưu ý về headless**:
- Một số website có thể phát hiện chế độ headless và chặn.
- Fingerprint vẫn hoạt động bình thường ở chế độ headless.
- PerfectCanvas hoạt động cả trong headless mode.

---

## Tuỳ chỉnh viewport

```ts
const context = await engine
  .useFingerprint(fp)
  .launch({
    headless: false,
    viewport: { width: 1920, height: 1080 },
  })
  .newContext({
    viewport: { width: 1280, height: 720 },
  });
```

Viewport có thể được đặt ở cả `launch()` (mặc định) và `newContext()` (ghi đè).

---

## Tuỳ chỉnh locale và timezone

```ts
const context = await engine
  .useFingerprint(fp)
  .useProxy('http://proxy-de:8080', {
    changeTimezone: true,
    changeBrowserLanguage: true,
  })
  .launch({
    locale: 'de-DE',
    timezoneId: 'Europe/Berlin',
  })
  .newContext();
```

Khi `changeTimezone` và `changeBrowserLanguage` được bật, các giá trị này sẽ bị ghi đè bởi proxy. Chỉ đặt thủ công khi muốn giá trị cố định.

---

## Chạy nhiều phiên đồng thời

```ts
async function runConcurrentSessions(count: number) {
  const sessions = Array.from({ length: count }, async (_, i) => {
    const engine = new BrowserEngine();

    try {
      const fp = await BrowserEngine.newFingerprint({
        tags: ['Chrome', 'Desktop', 'Windows 10'],
        timeLimit: '30 days',
      });

      const context = await engine
        .useFingerprint(fp)
        .useProxy(`http://user:pass@proxy-${i}:8080`)
        .useProfile(`./profiles/session_${i}`)
        .launch({ headless: true })
        .newContext();

      const page = await context.newPage();
      await page.goto('https://example.com');
      console.log(`[session_${i}] ${await page.title()}`);
    } catch (err) {
      console.error(`[session_${i}] Lỗi:`, err);
    } finally {
      await engine.close();
    }
  });

  await Promise.all(sessions);
}

// Chạy 5 phiên đồng thời
await runConcurrentSessions(5);
```

**Lưu ý khi chạy đồng thời**:
- Mỗi phiên cần một thư mục profile riêng.
- Mỗi phiên cần một instance `BrowserEngine` riêng.
- Giới hạn số lượng phiên tuỳ thuộc vào tài nguyên hệ thống (RAM, CPU).
- `async-lock` và `proper-lockfile` đảm bảo an toàn khi nhiều phiên cùng truy cập tài nguyên dùng chung.

---

## Tăng timeout cho engine

```ts
// Nếu gặp EngineTimeoutError, bạn có thể tăng timeout
engine.setEngineTimeout(120_000); // 2 phút (mặc định có thể là 60s)

// Nếu gặp RequestTimeoutError
engine.setRequestTimeout(60_000); // 1 phút
```

Các method này chỉ nên được gọi trước `launch()`.

---

## Truy cập engine gốc

```ts
const engine = new BrowserEngine();
engine.useFingerprint(fp).launch();

// Truy cập engine gốc cho các tác vụ nâng cao
const rawEngine = engine.engine;
// rawEngine chứa các method cấp thấp hơn để tương tác trực tiếp với engine C++
```

---

## Quản lý bộ nhớ

```ts
async function runWithMemoryLimit() {
  const engine = new BrowserEngine();

  try {
    const context = await engine
      .useFingerprint(fp)
      .launch({
        headless: true,
        args: [
          '--max_old_space_size=512',  // Giới hạn heap 512MB
          '--disable-dev-shm-usage',    // Tránh dùng /dev/shm (container)
        ],
      })
      .newContext();

    // ... thao tác ...
  } finally {
    await engine.close(); // Giải phóng bộ nhớ
  }
}
```

---

## Dọn dẹp tài nguyên tạm

Engine tạo các file tạm trong thư mục `.tmp/`. Định kỳ dọn dẹp:

```ts
import { existsSync, rmSync } from 'node:fs';

function cleanupTempFiles() {
  const tempDirs = ['.tmp/browser/engine', '.tmp/browser/running'];

  for (const dir of tempDirs) {
    if (existsSync(dir)) {
      rmSync(dir, { recursive: true, force: true });
      console.log(`Đã xoá: ${dir}`);
    }
  }
}
```

**Lưu ý**: Không xoá thư mục tạm khi engine đang chạy. SettingsCleaner sử dụng `proper-lockfile` để ngăn xoá file khi engine binary đang dùng.

---

## Lưu ý

- **Thread safety**: JavaScript đơn luồng nhưng `await` có thể interleave. Engine dùng `async-lock` để serialize truy cập API và ghi file cấu hình.
- **Process safety**: `proper-lockfile` ngăn xoá file tạm khi binary C++ đang dùng, dùng lock file trên ổ đĩa.
- **Không dùng chung instance**: Mỗi `BrowserEngine` instance chỉ nên được dùng bởi một tác vụ tại một thời điểm.
- **Dọn dẹp định kỳ**: File tạm có thể chiếm nhiều GB. Dọn dẹp định kỳ để tiết kiệm ổ đĩa.
