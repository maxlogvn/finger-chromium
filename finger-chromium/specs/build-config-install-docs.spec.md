# Spec: Cấu hình build và tài liệu cài đặt (Build Config & Install Docs)

## Mô tả

Cập nhật `package.json` và tài liệu hướng dẫn cài đặt để hỗ trợ cài package từ GitHub một cách mượt mà (tự động build), đồng thời sửa các lỗi tiếng Việt thiếu dấu trong tài liệu.

## Yêu cầu

1. Thêm `prepare` script vào `package.json` để npm tự động build khi cài từ GitHub.
2. Sửa `clean` script để tương thích Windows (dùng tsup built-in clean).
3. Cập nhật hướng dẫn cài đặt trong tất cả tài liệu liên quan.
4. Fix tiếng Việt thiếu dấu trong tài liệu.

## Thiết kế

### package.json scripts

| Script | Lệnh | Mô tả |
|---|---|---|
| `clean` | `tsup --clean` | Xoá thư mục dist |
| `build` | `tsup` | Build ESM + CJS + DTS |
| `prepare` | `npm run build` | Lifecycle hook sau npm install |

Luồng hoạt động:

```
User chạy: npm install maxlogvn/finger-chromium
                                   |
                                   v
              npm chạy lifecycle hook: prepare
                                   |
                                   v
              prepare -> npm run build -> tsup -> dist/
                                   |
                                   v
              User import { Chromium } từ 'fingerprint-chromium-engine'
```

### Tài liệu cần cập nhật

| File | Thay đổi |
|---|---|
| `README.md` | Thêm ghi chú prepare script, hướng dẫn build thủ công nếu dùng --ignore-scripts |
| `finger-chromium/products/project-infrastructure.product.md` | Sửa lệnh cài đặt từ npm registry sang GitHub URL, thêm prepare note |
| `finger-chromium/designs/project-infrastructure.design.md` | Sửa lệnh cài đặt, xoá ghi chú pre-existing bug |
| `finger-chromium/specs/project-infrastructure.spec.md` | Cập nhật bảng scripts, sửa ghi chú clean |
| `finger-chromium/specs/debug-logging.spec.md` | Fix "Dang" -> "Đang", "tai" -> "tải" |
| `finger-chromium/overviews/project-infrastructure.overview.md` | Sửa mục clean trên bảng sai lệch |
| `finger-chromium/Welcome.md` | Cập nhật ghi chú npm run clean |
| `finger-chromium/ROADMAP.md` | Thêm mục mới cho task này |

## Kiểm tra

- `npm run lint` -- 0 errors.
- `npm run build` -- tsup build thành công (ESM + CJS + DTS).

---

