# Overview: Sửa lỗi biến `serviceKey` ở module scope gây dùng chung key giữa các instance

## Tóm tắt

Đã chuyển biến `serviceKey` từ module-level (`let serviceKey`) thành instance private field (`#serviceKey`) trong class `FingerprintPlugin`. Fix này ngăn việc các instance ghi đè key lẫn nhau khi chạy song song.

## Kết quả thực hiện

| Bước | Kế hoạch | Thực tế | Sai lệch |
|---|---|---|---|
| Bước 1: Thêm `#serviceKey` field | Thêm `#serviceKey: string \| undefined` vào class body | Hoàn thành | Không có |
| Bước 2: Xoá `let serviceKey` module-level | Xoá dòng 61 | Hoàn thành | Không có |
| Bước 3: Sửa `setServiceKey()` | Đổi `serviceKey = key` thành `this.#serviceKey = key` | Hoàn thành | Không có |
| Bước 4: Sửa `fetch()` | Đổi `key: serviceKey` thành `key: this.#serviceKey` | Hoàn thành | Không có |
| Bước 5: Sửa `_launch()` | Đổi `serviceKey` thành `this.#serviceKey` | Hoàn thành | Không có |
| Bước 6: Xoá section divider "Constants" | Xoá section divider | Hoàn thành | Không có |
| Bước 7: Kiểm tra tests | `npm test` | 162 tests pass | Không có |

## Sai lệch đáng chú ý

Không có.

## Tài liệu liên quan

- `docs/designs/bug-032-servicekey-module-scope.design.md`
- `docs/specs/bug-032-servicekey-module-scope.spec.md`
- `docs/plans/bug-032-servicekey-module-scope.plan.md`
- `docs/KNOWN_ISSUES.md` — chuyển #32 từ OPEN sang FIXED

## Ghi chú

- Đây là bug class "module-level mutable state" tương tự các fix trước: AsyncLock (#22), cleaner (#6), remote engine (#7), defaultLauncher (#3).
- Sau fix này, `src/plugin/index.ts` không còn module-level mutable state nào.
- Issue GitHub [#32](https://github.com/maxlogvn/finger-chromium/issues/32) cần được đóng sau khi đồng bộ.
