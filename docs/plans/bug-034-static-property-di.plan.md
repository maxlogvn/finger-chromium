# Plan: Refactor static property `_execFile` và `_closeTimeout` sang DI

Tham chiếu: [Design](../designs/bug-034-static-property-di.design.md) | [Spec](../specs/bug-034-static-property-di.spec.md)

## Các bước thực hiện

- [ ] Bước 1: Thêm `execFile` và `closeTimeout` vào `EngineOptions` interface
    - Làm gì: Thêm 2 optional field vào `EngineOptions` trong `src/plugin/connector/engine.ts`.
      ```ts
      execFile?: typeof nodeExecFile;
      closeTimeout?: number;
      ```
    - File liên quan: `src/plugin/connector/engine.ts:75-84`
    - Ghi chú: `nodeExecFile` đã được import ở dòng 20.

- [ ] Bước 2: Thêm private fields `#execFile` và `#closeTimeout` vào class
    - Làm gì: Thêm 2 private field ngay sau dòng 204 (`#process`), trước constructor.
      ```ts
      #execFile: typeof nodeExecFile;
      #closeTimeout: number;
      ```
    - File liên quan: `src/plugin/connector/engine.ts:200-205`
    - Phụ thuộc: Bước 1 hoàn thành.

- [ ] Bước 3: Sửa constructor -- khởi tạo `#execFile` và `#closeTimeout` từ options
    - Làm gì: Thêm 2 dòng vào constructor (dòng 206-212).
      ```ts
      this.#execFile = options.execFile ?? nodeExecFile;
      this.#closeTimeout = options.closeTimeout ?? CLOSE_TIMEOUT;
      ```
    - File liên quan: `src/plugin/connector/engine.ts:206-212`
    - Phụ thuộc: Bước 2 hoàn thành.

- [ ] Bước 4: Sửa `#startProcessInternal()` dùng `this.#execFile`
    - Làm gì: Đổi `RemoteEngine._execFile(` thành `this.#execFile(` ở dòng 364.
    - File liên quan: `src/plugin/connector/engine.ts:364`
    - Phụ thuộc: Bước 3 hoàn thành.

- [ ] Bước 5: Sửa `runFunction()` dùng `this.#closeTimeout`
    - Làm gì: Đổi `RemoteEngine._closeTimeout` thành `this.#closeTimeout` ở dòng 292.
    - File liên quan: `src/plugin/connector/engine.ts:292`
    - Phụ thuộc: Bước 3 hoàn thành.

- [ ] Bước 6: Xoá static `_execFile` và `_closeTimeout`
    - Làm gì: Xoá 2 dòng khai báo static property (dòng 193-197).
      Xoá cả comment `/** @internal For testing... */` đi kèm.
    - File liên quan: `src/plugin/connector/engine.ts:193-197`
    - Phụ thuộc: Bước 4, 5 hoàn thành (đảm bảo không còn reference).

- [ ] Bước 7: Sửa test `connector.test.ts` -- inject qua constructor
    - Làm gì:
      - Xoá `origExecFile` / `origCloseTimeout` save/restore (dòng 276-277, 308-309, 318-319).
      - Thay `RemoteEngine._execFile = mockFn` bằng truyền `execFile: mockFn` vào constructor
        của từng test case (dòng 310-314).
      - Thay `RemoteEngine._closeTimeout = 100` (dòng 407) bằng truyền `closeTimeout: 100`.
      - Sửa `simulateResponse` helper: tham số `mockProc` có thể lấy từ context hiện tại
        (không cần đổi vì `mockProc` vẫn là module-level variable trong describe block).
    - File liên quan: `tests/connector.test.ts:276-320, 353, 366, 381, 394, 407-408, 424`
    - Phụ thuộc: Bước 6 hoàn thành.

- [ ] Bước 8: Chạy `npm run lint` + `npm test`
    - Làm gì: Verify không có lỗi lint, tất cả test pass.
    - Ghi chú: Dùng `--timeout 10000` cho mocha nếu cần.

## Kiểm tra

- `npm run lint` -- không lỗi ESLint.
- `npm test` -- tất cả 162+ tests pass.
- `npm run typecheck` -- không lỗi TypeScript.

## Ghi chú

- `nodeExecFile` import vẫn cần dùng làm default value trong constructor -- không xoá.
- `CLOSE_TIMEOUT` export vẫn cần cho default value -- không xoá.
- `Connector` (connector/index.ts) không thay đổi -- không cần sửa.
