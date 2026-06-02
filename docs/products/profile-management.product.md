# Product: Quản lý Profile

## Tổng quan

Profile chứa cookie, localStorage, IndexedDB, extension data. Để tránh corrupt khi browser crash, profile được copy vào thư mục tạm trước khi dùng, và chỉ ghi lại vào thư mục gốc khi bạn gọi `quit()`.

## Cách dùng

```ts
// Lưu profile sau khi dùng
Chromium.useProfile('./profiles/user_01', {
  loadProxy: true,        // Tự động nạp lại proxy config từ profile
  loadFingerprint: true,  // Tự động nạp lại fingerprint config
});

// Khi quit, profile tự động được lưu
await Chromium.quit();
// Tương đương: Chromium.quit('./profiles/user_01')
```

## Cơ chế bảo vệ

```
useProfile('./profiles/user_01')
    │
    ▼
AdapterDataManager.map(source)
    │
    ▼
Copy → <BROWSER_RUNNING_DIR>/profile/1712345678_a1b2/
    │
    ▼
Browser chạy trên thư mục tạm
    │
    ▼
Chromium.quit()
    │
    ▼
Copy temp → ./profiles/user_01
Xoá temp dir
```

## ProfileOptions

```ts
interface ProfileOptions {
  loadProxy?: boolean;        // default: true
  loadFingerprint?: boolean;  // default: true
}
```

Khi `loadProxy: true`, engine sẽ đọc proxy config từ profile cũ (đã lưu trong `.ini` files). Tương tự cho fingerprint.

## Lưu ý

- **Browser crash**: nếu browser crash trước khi quit, profile thay đổi sẽ bị mất (vì chưa copy về). CleanupDaemon sẽ dọn thư mục tạm sau.
- **Cache profile**: mỗi lần `useProfile()` là một temp dir mới. Dùng lại profile path sẽ tạo temp dir khác.
- **Không dùng useProfile**: nếu không gọi `useProfile()`, engine dùng profile mặc định trong `<BROWSER_RUNNING_DIR>/profile/`.
