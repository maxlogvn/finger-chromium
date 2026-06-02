# Overview: Cấu hình build và tài liệu cài đặt (Build Config & Install Docs)

## Tóm tắt

Đã cập nhật cấu hình build trong `package.json` và sửa tài liệu hướng dẫn cài đặt để hỗ trợ cài package từ GitHub, fix Windows compatibility, fix tiếng Việt thiếu dấu.

## Kết quả thực hiện

| Bước | Kế hoạch | Thực tế | Sai lệch |
|---|---|---|---|
| Bước 1: Sửa package.json | `clean`, `build`, thêm `prepare` | Đúng kế hoạch | Không có |
| Bước 2: Cập nhật tài liệu | README, product, design, spec, overview | Đúng kế hoạch | Không có |
| Bước 3: Fix debug-logging spec | Fix tiếng Việt thiếu dấu | Đúng kế hoạch | Không có |
| Bước 4: Kiểm tra | lint + build | 0 errors, build success | Không có |

## Sai lệch đáng chú ý

Không có.

## Tài liệu liên quan

- `docs/designs/build-config-install-docs.design.md`
- `docs/specs/build-config-install-docs.spec.md`
- `docs/plans/build-config-install-docs.plan.md`

## Ghi chú

- `prepare` script là lifecycle hook của npm, chạy sau `npm install` từ Git.
- `tsup --clean` cross-platform, thay thế `rm -rf dist`.
- Lệnh cài đặt chính thức: `npm install github:maxlogvn/finger-chromium`.
