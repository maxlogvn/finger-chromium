# Product: Quản lý Profile

## Tổng quan

Profile quản lý qua AdapterDataManager -- tự động copy sang temp khi dùng, restore khi quit.

## Cách dùng

```ts
Chromium.useProfile('./profiles/user_01', {
  loadProxy: true,
  loadFingerprint: true,
});
```

## Cơ chế bảo vệ

1. `useProfile()` → copy profile vào thư mục tạm
2. Browser chạy trên thư mục tạm → không corrupt dữ liệu gốc
3. `quit()` → copy từ temp về thư mục gốc, xoá temp
