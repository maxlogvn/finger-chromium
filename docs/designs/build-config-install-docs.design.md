# Design: Cấu hình build và tài liệu cài đặt (Build Config & Install Docs)

## Bối cảnh

1. **Không có `prepare` script** -- Khi cài từ GitHub (`npm install github:maxlogvn/finger-chromium`), npm không tự động build. Người dùng phải tự chạy `npm run build` thủ công.
2. **`npm run clean` không chạy trên Windows** -- Dùng `rm -rf dist` (Unix), không tương thích Windows.
3. **Hướng dẫn cài đặt sai** -- Một số tài liệu ghi `npm install fingerprint-chromium-engine` (npm registry) nhưng package chưa publish.
4. **Tiếng Việt thiếu dấu** -- Một số tài liệu có lỗi chính tả.

## Câu hỏi làm rõ

- Nên push `dist/` lên git không? → Không, `dist/` là build artifact, giữ trong `.gitignore`.
- Dùng `prepare` hay `postinstall`? → `prepare` là lifecycle hook chuẩn cho build khi cài từ Git.
- Có cần thêm CI/CD? → Chưa, package chưa publish lên npm.

## Các phương án

### Phương án 1: Push dist/ lên git (loại)

Build sẵn, commit `dist/` vào repo.

- Ưu điểm: Người dùng cài từ GitHub có thể dùng ngay.
- Nhược điểm: Bloat repo, không phải convention, dễ conflict.

### Phương án 2: Thêm `prepare` script + fix clean script (chọn)

Thêm `"prepare": "npm run build"`, sửa `clean` thành `tsup --clean`.

- Ưu điểm: Tuân thủ convention, cross-platform, không thay đổi workflow.
- Nhược điểm: Phụ thuộc user không dùng `--ignore-scripts`.

### Phương án 3: Publish lên npm registry (tương lai)

- Ưu điểm: Trải nghiệm cài đặt chuẩn.
- Nhược điểm: Cần CI/CD, npm token. Chưa phải lúc.

## Giải pháp được chọn

- **Phương án AI đề xuất:** Phương án 2 (prepare script + fix clean).
- **Phương án được chọn:** Phương án 2.
- **Lý do:** Giải quyết vấn đề ngay, cross-platform, không thay đổi workflow phát triển.
