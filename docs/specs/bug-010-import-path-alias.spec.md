# Spec: Bug #10 — Import path alias `'src/types/fetch'` không khớp tsconfig

> Tuân thủ quy ước code tại [CONVENTIONS.md](../CONVENTIONS.md).

## Mô tả

Import `from 'src/types/fetch'` tại `src/adapter/playwright/chromium.ts:24` dùng absolute path không có alias tương ứng trong `tsconfig.json` (chỉ có `@src/*`, không có `src/*`). Cần đổi thành relative path để đảm bảo resolve được trên mọi môi trường.

## Yêu cầu

- `FetchOptions` vẫn được import đúng type sau khi sửa.
- Import path phải resolve được trên tất cả môi trường: `tsc`, `tsup`, `ts-node`, `jiti`.
- Không thay đổi tsconfig.json hoặc cấu hình build.
- Import mới phải nhất quán với các import type khác trong cùng file (đều dùng relative path `../../types/...`).

## Thiết kế

Đổi dòng 24 từ:
```ts
import type { FetchOptions } from 'src/types/fetch';
```
thành:
```ts
import type { FetchOptions } from '../../types/fetch';
```

Tham chiếu design: `docs/designs/bug-010-import-path-alias.design.md`

## API / Data flow

Không có thay đổi về API hay data flow. Đây là thay đổi thuần về import path — runtime behavior hoàn toàn giống nhau.

## Components

- `src/adapter/playwright/chromium.ts` (sửa) — đổi import path `'src/types/fetch'` → `'../../types/fetch'`.

## Xử lý lỗi

- Import path sai → TypeScript báo lỗi tại compile time. Không có error case runtime.

## Kiểm tra

- TypeScript type check: `tsc --noEmit` phải pass.
- Build: `tsup` bundle phải thành công.
- Lint: ESLint phải pass.
