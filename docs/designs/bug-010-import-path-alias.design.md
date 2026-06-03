# Design: Bug #10 — Import path alias `'src/types/fetch'` không khớp tsconfig

## Bối cảnh

`src/adapter/playwright/chromium.ts:24` import `FetchOptions` với path `'src/types/fetch'`:
```ts
import type { FetchOptions } from 'src/types/fetch';
```

Trong `tsconfig.json`, alias path được định nghĩa là `@src/*` → `src/*`, không phải `src/*`. Import `'src/types/fetch'` không khớp với bất kỳ alias nào, và cũng không phải relative path. Điều này có thể không resolve được ở một số môi trường (ts-node, jiti runtime...).

## Câu hỏi làm rõ

- **Có file nào khác dùng `src/types/` không?** → Không, grep chỉ tìm thấy 1 occurrence tại `chromium.ts:24`.
- **Có file nào dùng `@src/` không?** → Không, grep không tìm thấy.
- **Thư viện có dùng `src/types/` trong published bundle không?** → `tsup` bundle dùng `tsconfig.json` với `paths` alias để resolve, có thể hoạt động nhưng fragile.

## Các phương án

### Phương án 1: Đổi thành relative path `'../../types/fetch'`

Đây là cách import phổ biến nhất trong codebase. Hiện tại `chromium.ts` đã dùng relative path cho các import khác: `'../../plugin/errors'`, `'../../types/PWChromium'`, `'../../types/profile'`, `'../../types/fingerprint'`, `'../../types/proxy'`.

- **Ưu điểm:**
  - Nhất quán với 4 import còn lại trong cùng file.
  - Resolve được trên mọi môi trường (ts-node, jiti, tsc, tsup).
  - Không cần sửa tsconfig.json hay bất kỳ file cấu hình nào.
- **Nhược điểm:**
  - Không có. Đây là fix an toàn nhất.

### Phương án 2: Thêm alias `src/*` vào tsconfig.json

Thêm `"src/*": ["src/*"]` vào `paths` trong tsconfig.json.

- **Ưu điểm:**
  - Giữ nguyên absolute import style.
- **Nhược điểm:**
  - Alias `src/*` tự tham chiếu (`src/*` → `src/*`) có thể gây lỗi resolve — TypeScript có thể không chấp nhận vì nó là identity mapping.
  - Tạo thêm một alias mang tính "workaround" thay vì fix đúng nguyên nhân.
  - Các import khác trong dự án đều dùng relative path.

### Phương án 3: Đổi alias thành `@/*` và dùng `@/types/fetch`

- **Ưu điểm:**
  - Đẹp, ngắn gọn.
- **Nhược điểm:**
  - Phải sửa tất cả các file import hiện có (dù hiện không có file nào dùng `@src/`).
  - Rủi ro tương thích với tools build (tsup có thể không resolve alias).

## Giải pháp được chọn

- **Phương án AI đề xuất:** Phương án 1 (relative path).
- **Lý do:** An toàn nhất, nhất quán với các import khác trong cùng file, không cần sửa config.
- **Phương án được chọn:** (chờ người duyệt)
