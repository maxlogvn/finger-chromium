# Product: Quản lý Profile

## Mô tả

Tính năng profile cho phép lưu và tái sử dụng dữ liệu trình duyệt (cookie, localStorage, session) giữa các lần chạy. Profile được copy vào thư mục tạm trước khi browser khởi động — tránh corrupt dữ liệu gốc — và được sao lưu lại sau khi kết thúc session.

## Cách sử dụng

```ts
import { Chromium } from 'fingerprint-chromium-engine';

const context = await Chromium
  .useProfile('./profiles/user_01', {
    loadProxy: true,        // tự động load proxy từ profile cũ
    loadFingerprint: true,  // tự động load fingerprint từ profile cũ
  })
  .launch()
  .newContext();

// ... dùng browser ...

// Tự động lưu profile khi quit
await Chromium.quit();

// Hoặc lưu vào đường dẫn khác
await Chromium.quit('./backup/profile_backup');
```

## Hành vi chi tiết

1. **Khi `launch()`:** Profile gốc được copy vào temp dir với tên duy nhất (timestamp + random hex). Browser chạy trên bản copy này.
2. **Trong khi chạy:** Mọi thay đổi (cookie, localStorage) chỉ ảnh hưởng đến bản copy — profile gốc không bị ảnh hưởng.
3. **Khi `quit()`:** Context được close. Profile từ temp dir copy ngược về thư mục gốc (hoặc thư mục chỉ định trong `saveDataPath`). Temp dir bị xoá.
4. **Load lại:** `loadProxy: true` và `loadFingerprint: true` (mặc định) — engine đọc proxy và fingerprint đã dùng lần trước từ profile và tự động áp dụng.

`AdapterDataManager` trong `src/adapter/playwright/data.ts` quản lý quá trình map/unmap profile. Nó dùng temp dir để tránh corrupt — nếu browser crash trong lúc chạy, profile gốc vẫn còn nguyên.

## Giới hạn và điều kiện

- Mỗi instance chỉ dùng một profile.
- Profile chỉ được lưu khi gọi `quit()`. Nếu process bị kill, dữ liệu trong temp dir sẽ mất.
- Yêu cầu quyền đọc/ghi trên thư mục profile.
- Chỉ hỗ trợ Windows.

## Tài liệu kỹ thuật liên quan

- Spec: `docs/specs/profile-management.spec.md`
- Design: `docs/designs/profile-management.design.md`
- Source: `src/adapter/playwright/data.ts`
