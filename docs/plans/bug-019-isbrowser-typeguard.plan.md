# Plan: Bug #19 — `isBrowser` type guard dùng string check fragile

## Các bước thực hiện

- [ ] Bước 1: Sửa hàm `isBrowser()` — thêm check `isConnected` và `contexts`
    - Làm gì: Thay điều kiện `'version' in target` bằng kiểm tra đồng thời `'isConnected' in target && 'contexts' in target && 'version' in target`.
    - File liên quan: `src/adapter/playwright/utils.ts:19-23`
    - Ghi chú: Import type `Browser` đã có ở dòng 10.

- [ ] Bước 2: Kiểm tra code
    - `npm run lint`
    - `npm run typecheck`
    - `npm run build`

## Kiểm tra

- `npm run lint`
- `npm run typecheck`
- `npm run build`

## Ghi chú

- Thay đổi chỉ gói gọn trong 1 hàm, không ảnh hưởng module khác.
- Hành vi `bindHooks()` và `onClose()` không đổi — chỉ type guard chặt hơn.
