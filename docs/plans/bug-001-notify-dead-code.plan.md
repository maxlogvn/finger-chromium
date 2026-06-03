# Plan: Bug #1 — `notify()` dead code

## Các bước thực hiện

- [ ] Bước 1: Import `notify` vào `src/plugin/connector/index.ts`
    - Làm gì: Thêm `import { notify } from './utils'` ở đầu file.
    - File liên quan: `src/plugin/connector/index.ts`
    - Ghi chú: Đặt ở nhóm import third-party, sau dòng `import debugFactory from 'debug'`.

- [ ] Bước 2: Gọi `notify()` trong luồng `api()` khi thiếu key
    - Làm gì: Trong `api()`, ở nhánh `throw new MissingKeyError(...)`, gọi `notify(params.key)` trước và gán kết quả vào `notifyTimer`.
    - File liên quan: `src/plugin/connector/index.ts` (hàm `api()`)
    - Phụ thuộc: Bước 1.
    - Ghi chú:
      ```
      if (error.includes('key is missing')) {
        notifyTimer = notify(params.key);
        throw new MissingKeyError(error);
      }
      ```

- [ ] Bước 3: Kiểm tra biên dịch và lint
    - Làm gì: Chạy `npm run lint` và `npm run typecheck` để đảm bảo không lỗi.
    - Ghi chú: Kiểm tra import không dùng có bị ESLint báo không.

## Kiểm tra

- `npm run lint` -- ESLint + Prettier
- `npm run typecheck` -- TypeScript type check
- `npm test` -- Mocha tests

## Ghi chú

- `notify()` dùng `once()` nên chỉ in thông báo một lần dù gọi nhiều lần.
- `clearTimeout(notifyTimer)` trong `finally` đã có sẵn -- sau khi gán timer từ `notify()`, finally sẽ dọn timer đúng cách.
