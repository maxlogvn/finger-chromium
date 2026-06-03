# Design: Bug #16 — `cleaner` dùng `posix` path trên Windows

## Bối cảnh

`src/plugin/cleaner.ts:12` import POSIX path module thay vì Windows native:

```ts
import { posix as path } from 'path';
```

`proper-lockfile` dùng path này để lock/unlock file. Trên Windows, forward slash (`/`) có thể gây lỗi resolve đường dẫn — dẫn đến lock file thất bại, cleanup không chạy.

## Câu hỏi làm rõ

- Có chỗ nào trong `cleaner.ts` phụ thuộc vào POSIX path behavior (forward slash, v.v.) không? → Không. Tất cả đều là path join/resolve cơ bản — Windows native path hoạt động tương tự.
- Có module nào khác dùng `posix` path không? → Chỉ `cleaner.ts`.

## Các phương án

### Phương án 1: Đổi sang `node:path` mặc định
```ts
import path from 'node:path';
```

- **Ưu điểm:** Dùng path chuẩn của Node.js cho Windows, tương thích `proper-lockfile`.
- **Nhược điểm:** Không có.

### Phương án 2: Giữ nguyên và dùng `path.win32`
```ts
import { win32 as path } from 'path';
```

- **Ưu điểm:** Tường minh Windows path.
- **Nhược điểm:** `node:path` mặc định đã tự chọn platform-appropriate — dùng `win32` là redundant. Cũng không cần thiết vì project chỉ hỗ trợ Windows.

## Giải pháp được chọn

### Phương án AI đề xuất: Phương án 1
Dùng `import path from 'node:path'` — chuẩn, đơn giản, tương thích.
