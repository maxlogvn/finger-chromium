# Spec: Bug #19 — `isBrowser` type guard dùng string check fragile

> Tuân thủ quy ước code tại [CONVENTIONS.md](../CONVENTIONS.md).

## Mô tả

`isBrowser()` hiện tại dùng duck-typing single-property (`'version' in target`) để phân biệt `Browser` vs `BrowserContext`. Nếu Playwright đổi API (rename, remove method), type guard sai → `onClose()` gắn sai event, `bindHooks()` proxy sai object. Cần tăng độ tin cậy bằng multi-property check.

## Yêu cầu

- `isBrowser()` phải kiểm tra ít nhất 2 method đặc trưng của `Browser` để giảm false positive.
- `isBrowser()` vẫn phải hoạt động như type guard cho `Browser` interface.
- Zero runtime dependency — không thêm package mới.
- Backward compatible: `bindHooks()` và `onClose()` không thay đổi hành vi.

## Thiết kế

Tham chiếu: `docs/designs/bug-019-isbrowser-typeguard.design.md`

Phương án được chọn: duck-typing đa property — kiểm tra đồng thời `version`, `isConnected`, `contexts`.

## API / Data flow

Không có API mới. `isBrowser()` là internal function, không export.

- Input: `unknown`
- Output: `boolean` (type predicate `target is Browser`)

## Components

- `src/adapter/playwright/utils.ts` (sửa) — hàm `isBrowser()` dòng 19-23.

## Xử lý lỗi

Không phát sinh lỗi mới. Nếu target không phải object hợp lệ, trả về `false` như hiện tại.

## Kiểm tra

- Happy path: `isBrowser(browserInstance)` → `true`
- Happy path: `isBrowser(contextInstance)` → `false`
- Edge case: `isBrowser(null)` → `false`
- Edge case: `isBrowser(undefined)` → `false`
- Edge case: `isBrowser({})` → `false`
