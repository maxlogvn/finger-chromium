# Spec: Bug #16 — `cleaner` dùng `posix` path trên Windows

> Tuân thủ quy ước code tại [CONVENTIONS.md](../CONVENTIONS.md).

## Mô tả

`src/plugin/cleaner.ts` import `posix` path module — dùng forward slash trên Windows gây lỗi lock/unlock file với `proper-lockfile`.

## Yêu cầu

1. `cleaner.ts` dùng Windows native path.
2. `proper-lockfile` hoạt động đúng trên Windows.

## Thiết kế

Tham chiếu: `docs/designs/bug-016-posix-path.design.md`

Đổi một dòng import duy nhất.

## Components

| File | Dòng | Thay đổi |
|------|------|----------|
| `src/plugin/cleaner.ts` | 12 | `import { posix as path } from 'path'` → `import path from 'node:path'` |

## Kiểm tra

- `npm run lint` — không lỗi.
- `npm run build` — bundle ok.
