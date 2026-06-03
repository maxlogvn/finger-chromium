# Spec: Bug #9 — `BrowserEngine.launch()` dùng `Error` thô

> Tuân thủ quy ước code tại [CONVENTIONS.md](../CONVENTIONS.md).

## Mô tả

`BrowserEngine` tại `src/adapter/playwright/chromium.ts` có 3 chỗ throw `Error` thô. Theo CONVENTIONS.md, mọi lỗi engine phải dùng `PluginError`.

## Yêu cầu

1. Mọi `throw new Error(...)` trong `chromium.ts` phải được đổi thành `throw new PluginError(...)`.
2. `PluginError` phải được import hợp lệ.

## Thiết kế

Tham chiếu: `docs/designs/bug-009-error-tho.design.md`

- Thêm `import { PluginError } from '../../plugin/errors'` vào đầu file chromium.ts.
- Đổi `Error` thành `PluginError` ở 3 vị trí.

## Components

| File | Dòng | Thay đổi |
|------|------|----------|
| `src/adapter/playwright/chromium.ts` | ~11 | Thêm import `PluginError` |
| `src/adapter/playwright/chromium.ts` | 136 | `Error` → `PluginError` |
| `src/adapter/playwright/chromium.ts` | 164 | `Error` → `PluginError` |
| `src/adapter/playwright/chromium.ts` | 167 | `Error` → `PluginError` |

## Xử lý lỗi

Không thay đổi hành vi — chỉ thay đổi error class. Message giữ nguyên.

## Kiểm tra

- `npm run lint` — không lỗi.
- `npm run typecheck` — type pass.
- `npm run build` — bundle ok.
