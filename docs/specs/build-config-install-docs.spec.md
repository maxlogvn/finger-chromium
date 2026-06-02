# Spec: Cấu hình build và tài liệu cài đặt (Build Config & Install Docs)

> Tuân thủ quy ước code tại [CONVENTIONS.md](../CONVENTIONS.md).

## Mô tả

Cập nhật `package.json` và tài liệu hướng dẫn cài đặt để hỗ trợ cài package từ GitHub mượt mà (tự động build), đồng thời sửa lỗi tương thích Windows và tiếng Việt.

## Yêu cầu

- Thêm `prepare` script (`npm run build`) -- tự động build khi cài từ GitHub.
- Sửa `clean` script từ `rm -rf dist` thành `tsup --clean` (Windows-compatible).
- `build` script đơn giản hoá: `tsup` (tsup config đã có `clean: true`).
- Cập nhật hướng dẫn cài đặt trong tất cả tài liệu liên quan.

## Thiết kế

Script changes trong `package.json`:

| Script | Trước | Sau |
|---|---|---|
| `clean` | `rm -rf dist` | `tsup --clean` |
| `build` | `npm run clean && tsup` | `tsup` |
| `prepare` | (không có) | `npm run build` |

Xem [Design](../designs/build-config-install-docs.design.md).

## API / Data flow

```
npm install github:maxlogvn/finger-chromium
  -> lifecycle hook: prepare
    -> npm run build -> tsup -> dist/
```

## Components

| File | Thay đổi |
|---|---|
| `package.json` | Sửa `clean`, `build`, thêm `prepare` |
| `README.md` | Thêm prepare note, hướng dẫn build thủ công |
| `docs/` (nhiều file) | Sửa lệnh cài đặt, fix rm note, fix tiếng Việt |

## Xử lý lỗi

- Nếu người dùng dùng `--ignore-scripts`, cần build thủ công bằng `npm run build`.
- `tsup --clean` cross-platform, không lỗi trên Windows.

## Kiểm tra

- `npm run lint` -- 0 errors.
- `npm run build` -- tsup build thành công (ESM + CJS + DTS).
