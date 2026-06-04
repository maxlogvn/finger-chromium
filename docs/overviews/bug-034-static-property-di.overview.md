# Overview: Refactor static property `_execFile` và `_closeTimeout` sang DI

## Tóm tắt

Đã chuyển `RemoteEngine._execFile` và `RemoteEngine._closeTimeout` từ static
public property sang constructor Dependency Injection. Hai static property đã
được xoá, thay bằng private fields `#execFile` và `#closeTimeout` khởi tạo từ
`EngineOptions`. Test inject mock qua constructor thay vì gán static property.
Tất cả 164 tests pass, 0 lỗi lint.

## Kết quả thực hiện

| Bước | Kế hoạch | Thực tế | Sai lệch |
|------|----------|---------|----------|
| 1: Thêm `execFile`, `closeTimeout` vào `EngineOptions` | Thêm 2 optional field | Đã thêm | Không có |
| 2: Thêm private fields `#execFile`, `#closeTimeout` | Thêm 2 private field | Đã thêm | Không có |
| 3: Sửa constructor -- khởi tạo từ options | Dùng `??` với default | Đã sửa | Không có |
| 4: Sửa `#startProcessInternal()` dùng `this.#execFile` | Đổi `RemoteEngine._execFile(` thành `this.#execFile(` | Đã sửa | Không có |
| 5: Sửa `runFunction()` dùng `this.#closeTimeout` | Đổi `RemoteEngine._closeTimeout` thành `this.#closeTimeout` | Đã sửa | Không có |
| 6: Xoá static `_execFile` và `_closeTimeout` | Xoá 2 static property | Đã xoá | Không có |
| 7: Sửa test `connector.test.ts` | Inject `execFile`/`closeTimeout` qua constructor | Đã sửa 6 test cases | Không có |
| 8: `npm run lint` + `npm test` | 0 lỗi ESLint, 162+ tests pass | 0 lỗi, 164 pass, 3 pending | Số test tăng lên 164 (không liên quan) |

## Sai lệch đáng chú ý

Không có. Mọi bước thực hiện đúng kế hoạch.

## Tài liệu liên quan

- `docs/designs/bug-034-static-property-di.design.md`
- `docs/specs/bug-034-static-property-di.spec.md`
- `docs/plans/bug-034-static-property-di.plan.md`
- `docs/overviews/bug-034-static-property-di.overview.md`
- `docs/KNOWN_ISSUES.md` -- chuyển #34 từ OPEN sang FIXED

## Ghi chú

- Issue #34 là hậu quả của Issue #28 (test-runfunction-ipc-core), nơi static
  properties được thêm vào để bypass ESM live binding immutable. Refactor này
  giải quyết vấn đề gốc bằng DI, giúp code sạch hơn và an toàn hơn.
- Tổng test count tăng từ 162 lên 164 do các feature/task khác đã được thêm
  test trước đó -- không liên quan đến refactor này.
- Các tài liệu lịch sử (`test-runfunction-ipc-core.spec.md`, overview) mô tả
  cơ chế static property cũ -- giữ nguyên vì là tài liệu lịch sử.
