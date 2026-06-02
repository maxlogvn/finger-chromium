# Product: Hook Binding

## Tổng quan

Hook Binding intercept Playwright methods để tự động resize viewport mỗi khi tạo page mới. Viewport không thể thay đổi sau khi set -- tránh phá vỡ fingerprint.

## Cách hoạt động

Khi bạn gọi `context.newPage()`:

1. Hook binding intercept lời gọi
2. `onPageCreated` hook được gọi
3. CDP resize viewport về kích thước fingerprint
4. `setViewportSize()` bị chặn -- in warning

```ts
// setViewportSize sẽ không hoạt động
await page.setViewportSize({ width: 800, height: 600 });
// Warning: "Khong the thay doi viewport: kich thuoc da bi khoa boi fingerprint"
```

## Lưu ý

- Hook chỉ ảnh hưởng pages mới, không resize page đã tồn tại
- Page đầu tiên được resize ngay trong `configure()` của PlaywrightBridge
