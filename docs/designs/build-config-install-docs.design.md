# Design: Cấu hình build và tài liệu cài đặt (Build Config & Install Docs)

## Vấn đề cần giải quyết

1. **Không có `prepare` script** -- Khi người dùng cài package từ GitHub (`npm install github:maxlogvn/finger-chromium`), npm không tự động build ra `dist/`. Người dùng phải tự chạy `npm run build` thủ công.

2. **`npm run clean` không chạy trên Windows** -- Script `clean` hiện tại dùng `rm -rf dist` (lệnh Unix), không tương thích với Windows cmd.exe hoặc PowerShell.

3. **Hướng dẫn cài đặt sai** -- Một số tài liệu (product, design) ghi `npm install fingerprint-chromium-engine` (npm registry) nhưng thực tế package chưa publish lên npm, chỉ cài được từ GitHub.

4. **Tiếng Việt thiếu dấu** -- Một số tài liệu có chữ Việt không dấu (ví dụ: `debug-logging.spec.md` viết "Dang" thay vì "Đang").

## Các phương án đã cân nhắc

### 1. Push dist/ lên git (loại)

Bỏ `/dist/` khỏi `.gitignore`, build sẵn rồi commit dist/ vào repo.

**Ưu điểm:** Người dùng cài từ GitHub có thể dùng ngay, không cần build.

**Nhược điểm:**
- Bloat repo -- mỗi lần build tạo ra file binary-like (CJS, ESM), khác biệt rất nhỏ giữa các commit.
- Không phải là convention của JavaScript ecosystem -- `dist/` được coi là build artifact.
- Dễ conflict khi nhiều người cùng phát triển.

**Kết luận:** Loại.

### 2. Thêm `prepare` script, giữ `.gitignore` (chọn)

Thêm `"prepare": "npm run build"` vào `package.json`. npm lifecycle hook `prepare` tự động chạy sau `npm install` khi cài từ Git.

**Ưu điểm:**
- Tuân thủ convention -- `dist/` không trong git, nhưng vẫn có ngay khi cài.
- Không cần thay đổi workflow phát triển.
- Cross-platform nếu `build` script dùng tsup (đã cross-platform).

**Nhược điểm:**
- Phụ thuộc vào user không dùng `--ignore-scripts`.
- Cần máy user có đủ dependencies (TypeScript, tsup) để build.

**Kết luận:** Chọn phương án này.

### 3. Publish lên npm registry (tương lai)

Publish package lên npm, user cài bằng `npm install fingerprint-chromium-engine`.

**Ưu điểm:** Trải nghiệm cài đặt chuẩn nhất.

**Nhược điểm:** Cần CI/CD, npm token, quy trình publish. Chưa phải lúc.

**Kết luận:** Để dành cho tương lai.

## Thiết kế

### 1. Thay đổi `package.json`

| Script | Giá trị hiện tại | Giá trị mới | Lý do |
|---|---|---|---|
| `clean` | `rm -rf dist` | `tsup --clean` | Tương thích Windows, dùng clean có sẵn của tsup |
| `build` | `npm run clean && tsup` | `tsup` | `tsup.config.ts` đã có `clean: true` |
| `prepare` | _(không có)_ | `npm run build` | lifecycle hook, chạy sau `npm install` từ Git |

### 2. Cập nhật tài liệu

- **README.md**: Thêm ghi chú về `prepare` script và fallback build thủ công.
- **Các product/design/spec/overview docs**: Sửa lệnh cài đặt từ npm registry sang GitHub URL.
- **Các doc còn ghi chú `rm -rf`**: Cập nhật thành `tsup --clean`.
- **debug-logging.spec.md**: Fix tiếng Việt thiếu dấu.

---

