# Hướng dẫn quản lý Profile

Tài liệu này mô tả chi tiết cách sử dụng profile để duy trì trạng thái phiên duyệt web qua các lần khởi động. Profile lưu cookie, localStorage, session storage, và các dữ liệu khác giúp bạn duy trì phiên đăng nhập và trạng thái duyệt web.

## Tổng quan

Profile là một thư mục trên ổ đĩa chứa toàn bộ dữ liệu phiên của trình duyệt. Khi bạn gọi `engine.close()`, dữ liệu được lưu vào thư mục này. Lần khởi động sau, nếu bạn gọi `useProfile()` cùng đường dẫn, dữ liệu sẽ được tải lại.

```ts
// Phiên đầu tiên
const engine = new BrowserEngine();
await engine
  .useFingerprint(fp)
  .useProxy(proxyUrl)
  .useProfile('./profiles/user_01')
  .launch()
  .newContext();

// ... thao tác với trang web ...

await engine.close(); // Profile được lưu về ./profiles/user_01

// Phiên tiếp theo
const engine2 = new BrowserEngine();
await engine2
  .useProfile('./profiles/user_01', {
    loadFingerprint: true,
    loadProxy: true,
  })
  .launch()
  .newContext();
// Fingerprint và proxy được tự động load từ profile
```

---

## ProfileOptions -- Tham khảo

| Thuộc tính         | Kiểu      | Mặc định | Mô tả                                                           |
| ------------------ | --------- | -------- | --------------------------------------------------------------- |
| `loadProxy`        | `boolean` | `true`   | Tự động load proxy đã dùng lần trước từ thư mục profile          |
| `loadFingerprint`  | `boolean` | `true`   | Tự động load fingerprint đã dùng lần trước từ thư mục profile    |

---

## Luồng hoạt động

### Ghi profile (save)

Khi gọi `engine.close()`, engine thực hiện các bước sau:

1. **Đóng BrowserContext** -- giải phóng toàn bộ page và tài nguyên đang mở.
2. **Lưu profile** -- dữ liệu được ghi vào thư mục `useProfile()`.
3. **Cleanup engine** -- giải phóng engine binary và các tài nguyên C++.
4. **Dispose data manager** -- giải phóng bộ nhớ và lock.

```ts
await engine.close();                              // Lưu về path trong useProfile()
await engine.close('./profiles/user_backup');      // Ghi đè path cho lần này
```

### Đọc profile (load)

Khi gọi `engine.launch()` với `useProfile()`:

1. `useProfile(dirPath)` -- đăng ký thư mục profile.
2. `launch()` -- đọc dữ liệu từ thư mục (nếu có).
   - Nếu `loadFingerprint: true`: tự động load fingerprint đã lưu.
   - Nếu `loadProxy: true`: tự động load proxy đã lưu.
3. `newContext()` -- khởi tạo context với dữ liệu profile đã load.

---

## Sử dụng cơ bản

### Tạo profile mới

```ts
const engine = new BrowserEngine();
const context = await engine
  .useFingerprint(fp)
  .useProxy(proxyUrl)
  .useProfile('./profiles/user_01')
  .launch({ headless: false })
  .newContext();

const page = await context.newPage();
await page.goto('https://example.com/login');

// Đăng nhập...
await page.fill('#username', 'user123');
await page.fill('#password', 'secret');
await page.click('button[type="submit"]');

// Đợi login thành công
await page.waitForSelector('.dashboard');

// Đóng và lưu -- cookie được lưu lại
await engine.close();
```

### Tải lại profile

```ts
const engine = new BrowserEngine();
const context = await engine
  .useProfile('./profiles/user_01', {
    loadFingerprint: true,
    loadProxy: true,
  })
  .launch({ headless: false })
  .newContext();

const page = await context.newPage();
await page.goto('https://example.com/dashboard');
// Vẫn đăng nhập -- cookie đã được load từ profile
```

### Ghi đè fingerprint khi tải profile

```ts
const engine = new BrowserEngine();
const context = await engine
  .useFingerprint(newFingerprint)     // Fingerprint mới
  .useProfile('./profiles/user_01', {
    loadFingerprint: false,            // Không load fingerprint cũ
    loadProxy: true,                   // Vẫn load proxy cũ
  })
  .launch()
  .newContext();
```

### Lưu profile sang thư mục khác

```ts
const engine = new BrowserEngine();
const context = await engine
  .useProfile('./profiles/user_01')   // Load từ đây
  .launch()
  .newContext();

// ... thao tác ...

await engine.close('./profiles/user_01_backup');  // Nhưng lưu sang đây
```

---

## Đường dẫn profile

### Đường dẫn tương đối

```ts
engine.useProfile('./profiles/user_01');        // Tương đối với thư mục hiện tại (cwd)
engine.useProfile('profiles/user_01');           // Cũng tương đối với cwd
```

### Đường dẫn tuyệt đối

```ts
engine.useProfile('C:\\Users\\user\\profiles\\user_01');
```

### Thư mục mặc định

Nếu không gọi `useProfile()`, engine sẽ dùng thư mục mặc định:

```
./data/profiles/default
```

Thư mục này nằm trong thư mục gốc của dự án.

---

## Cấu trúc thư mục profile

Mỗi thư mục profile chứa:

```
profiles/
  user_01/
    Default/              # Dữ liệu Chrome profile (cookie, localStorage...)
    fingerprint.json      # Fingerprint đã dùng
    proxy.json            # Proxy đã dùng
  user_02/
    Default/
    fingerprint.json
    proxy.json
```

**Lưu ý**: Bạn không nên chỉnh sửa thủ công các file trong thư mục profile. Chúng được quản lý bởi engine.

---

## Ví dụ nâng cao

### Quản lý nhiều profile

```ts
const profiles = ['user_01', 'user_02', 'user_03'];

for (const profileName of profiles) {
  const engine = new BrowserEngine();

  try {
    // Lấy fingerprint riêng cho mỗi profile
    const fp = await BrowserEngine.newFingerprint({
      tags: ['Chrome', 'Desktop', 'Windows 10'],
      timeLimit: '30 days',
    });

    // Proxy riêng cho mỗi profile
    const proxy = `http://user:pass@proxy-${profileName}:8080`;

    const context = await engine
      .useFingerprint(fp)
      .useProxy(proxy)
      .useProfile(`./profiles/${profileName}`)
      .launch({ headless: true })
      .newContext();

    const page = await context.newPage();
    await page.goto('https://example.com');
    console.log(`${profileName}: ${await page.title()}`);
  } finally {
    await engine.close();
  }
}
```

### Sao lưu profile

```ts
async function backupProfile(src: string, dest: string) {
  const engine = new BrowserEngine();

  try {
    const context = await engine
      .useProfile(src)
      .launch()
      .newContext();

    // Không thao tác gì, chỉ mở và đóng để lưu
  } finally {
    await engine.close(dest);
  }
}

await backupProfile('./profiles/user_01', './backups/user_01_2024');
```

### Kiểm tra profile đã tồn tại

```ts
import { existsSync } from 'node:fs';

function profileExists(name: string): boolean {
  return existsSync(`./profiles/${name}/Default`);
}

if (profileExists('user_01')) {
  console.log('Profile đã tồn tại, tải lại...');
  engine.useProfile('./profiles/user_01', {
    loadFingerprint: true,
    loadProxy: true,
  });
} else {
  console.log('Profile mới, cần cấu hình đầy đủ...');
  engine
    .useFingerprint(fp)
    .useProxy(proxyUrl)
    .useProfile('./profiles/user_01');
}
```

---

## Lưu ý quan trọng

- **Luôn gọi `close()`**: Nếu không gọi `engine.close()`, profile sẽ không được lưu về thư mục. Dữ liệu phiên (cookie, localStorage...) sẽ bị mất.
- **Không dùng chung profile**: Không nên dùng cùng một thư mục profile cho nhiều instance đang chạy đồng thời. Điều này có thể gây hỏng dữ liệu.
- **Sao lưu định kỳ**: Profile chứa dữ liệu quan trọng (cookie, session). Hãy sao lưu định kỳ để tránh mất mát.
- **Tự động load**: Khi `loadFingerprint` và `loadProxy` đều là `true` (mặc định), bạn chỉ cần gọi `useProfile()` là đủ để khôi phục toàn bộ phiên trước đó.
- **Ghi đè path khi close**: Truyền `saveDataPath` vào `close()` để lưu profile sang thư mục khác với `useProfile()`.
- **Dọn dẹp profile cũ**: Profile chiếm dung lượng ổ đĩa (có thể hàng trăm MB). Hãy dọn dẹp định kỳ các profile không còn dùng.
