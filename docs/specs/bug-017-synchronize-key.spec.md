# Spec: Bug #17 — `synchronize` ghi `BAS_NOT_SET` cho `availWidth/availHeight`

> Tuân thủ quy ước code tại [CONVENTIONS.md](../CONVENTIONS.md).

## Mô tả

`src/plugin/config.ts:synchronize()` tìm `bounds.availWidth`/`bounds.availHeight` nhưng API setup trả về `bounds.width`/`bounds.height`. Cần map đúng key.

## Yêu cầu

1. `synchronize()` ghi đúng giá trị `availWidth`/`availHeight` vào `.ini` từ `bounds.width`/`bounds.height`.

## Thiết kế

Tham chiếu: `docs/designs/bug-017-synchronize-key.design.md`

Đổi loop key `['availWidth', 'availHeight']` thành cặp `[iniKey, boundsKey]` với mapping `availWidth → width`, `availHeight → height`.

## Components

| File | Dòng | Thay đổi |
|------|------|----------|
| `src/plugin/config.ts` | 73-81 | Đổi loop variable để map `iniKey` → `boundsKey` |

## Kiểm tra

- `npm run lint` — không lỗi.
- `npm run build` — bundle ok.
