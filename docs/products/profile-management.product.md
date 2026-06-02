# Product: Quản lý Profile

## Tổng quan

Profile được copy vào thư mục tạm trước khi dùng. Browser không bao giờ ghi trực tiếp vào thư mục gốc -- tránh corrupt.

## Cách dùng

```ts
Chromium.useProfile('./profiles/user_01', {
  loadProxy: true,        // Tự động nạp proxy từ profile cũ
  loadFingerprint: true,  // Tự động nạp fingerprint từ profile cũ
});
```

## Cơ chế

1. `useProfile('./profiles/user_01')`:
   - Copy `./profiles/user_01` → `<BROWSER_RUNNING_DIR>/profile/1712345678_a1b2/`
   - Browser chạy trên thư mục tạm

2. `Chromium.quit()`:
   - Copy thư mục tạm → `./profiles/user_01`
   - Xoá thư mục tạm

## Lưu ý

- Nếu browser crash trước khi quit, profile trên thư mục tạm bị mất -- CleanupDaemon sẽ dọn sau
- `Math.random()` dùng cho tên temp dir -- an toàn vì không cần bảo mật cao
