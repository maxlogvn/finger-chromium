# Plan: Sửa lỗi biến `serviceKey` ở module scope gây dùng chung key giữa các instance

## Các bước thực hiện

- [ ] Bước 1: Thêm private field `#serviceKey` vào class `FingerprintPlugin`
    - Làm gì: Thêm dòng `#serviceKey: string | undefined;` vào class body, ngay sau `processId` field (dòng 79).
    - File liên quan: `src/plugin/index.ts`
    - Ghi chú: Dùng `undefined` thay vì optional (`string | undefined`) đúng với kiểu cũ.

- [ ] Bước 2: Xoá module-level `let serviceKey`
    - Làm gì: Xoá dòng `let serviceKey: string | undefined;` (dòng 61).
    - File liên quan: `src/plugin/index.ts`

- [ ] Bước 3: Sửa `setServiceKey()` dùng `this.#serviceKey`
    - Làm gì: Đổi `serviceKey = key;` thành `this.#serviceKey = key;`.
    - File liên quan: `src/plugin/index.ts` (dòng 189-191)

- [ ] Bước 4: Sửa `fetch()` dùng `this.#serviceKey`
    - Làm gì: Đổi `key: serviceKey` thành `key: this.#serviceKey`.
    - File liên quan: `src/plugin/index.ts` (dòng 203)

- [ ] Bước 5: Sửa `_launch()` dùng `this.#serviceKey`
    - Làm gì: Đổi `key: typeof options.key === 'string' ? options.key : serviceKey` thành `key: typeof options.key === 'string' ? options.key : this.#serviceKey`.
    - File liên quan: `src/plugin/index.ts` (dòng 251)

- [ ] Bước 6: Xoá section divider "Constants" nếu trống
    - Làm gì: Xoá `// ─── Constants ────────────────────────────────────────────────────` và dòng trống trên nó (dòng 59-60) sau khi đã xoá `let serviceKey`.
    - File liên quan: `src/plugin/index.ts`
    - Phụ thuộc: Yêu cầu bước 2 hoàn thành.

- [ ] Bước 7: Kiểm tra tests hiện tại pass
    - Làm gì: Chạy `npm test` để đảm bảo không có test nào bị broken.
    - Ghi chú: Các test hiện tại chỉ dùng single instance, nên không bị ảnh hưởng.

## Kiểm tra

- `npm run lint`
- `npm run typecheck`
- `npm test`

## Ghi chú

- Thay đổi đơn giản, không ảnh hưởng public API.
- Không cần test mới ở bước này — test hiện tại (156 tests) đã pass sẽ verify không broken.
- Có thể thêm test multi-instance sau ở issue riêng (test coverage gap).
