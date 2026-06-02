# Overview: Cấu hình build và tài liệu cài đặt (Build Config & Install Docs)

## Mục tiêu

Cập nhật cấu hình build trong `package.json` và sửa tài liệu hướng dẫn cài đặt để hỗ trợ cài package trực tiếp từ GitHub, đồng thời fix tiếng Việt thiếu dấu trong các tài liệu.

## Kết quả

### package.json

| Script | Trước | Sau | Lý do |
|---|---|---|---|
| `clean` | `rm -rf dist` | `tsup --clean` | `rm -rf` không chạy trên Windows |
| `build` | `npm run clean && tsup` | `tsup` | tsup đã có `clean: true` trong config |
| `prepare` | _(không có)_ | `npm run build` | Tự động build khi cài từ GitHub |

### Tài liệu đã cập nhật

| File | Thay đổi |
|---|---|
| `README.md` | Thêm ghi chú về `prepare` script, fallback build thủ công |
| `finger-chromium/products/project-infrastructure.product.md` | Sửa lệnh cài đặt từ npm registry sang GitHub URL |
| `finger-chromium/designs/project-infrastructure.design.md` | Sửa lệnh cài đặt, fix ghi chú `rm -rf` |
| `finger-chromium/specs/project-infrastructure.spec.md` | Cập nhật bảng scripts, fix ghi chú clean |
| `finger-chromium/specs/debug-logging.spec.md` | Fix tiếng Việt thiếu dấu ("Dang" -> "Đang", "tai" -> "tải") |
| `finger-chromium/overviews/project-infrastructure.overview.md` | Cập nhật sai lệch `rm -rf` thành `tsup --clean` |
| `finger-chromium/Welcome.md` | Cập nhật ghi chú `npm run clean` |
| `finger-chromium/ROADMAP.md` | Thêm mục "Cấu hình build và tài liệu cài đặt" |

## Kiểm tra

- `npm run lint` -- 0 errors, 16 warnings (pre-existing, không do thay đổi này)
- `npm run build` -- tsup build thành công (ESM + CJS + DTS)

## Sai lệch so với kế hoạch

Không có sai lệch. Task được thực hiện đúng như thiết kế đã duyệt.

## Ghi chú kỹ thuật

- **`prepare` script** là lifecycle hook của npm, tự động chạy sau `npm install` khi cài từ Git. Nếu người dùng dùng `--ignore-scripts`, cần build thủ công bằng `npm run build`.
- **`tsup --clean`** sử dụng cơ chế clean có sẵn của tsup (xoá thư mục output trước khi build), tương thích cross-platform.
- **Lệnh cài đặt chính thức:** `npm install maxlogvn/finger-chromium` (không phải `npm install fingerprint-chromium-engine` vì chưa publish lên npm registry).

---

