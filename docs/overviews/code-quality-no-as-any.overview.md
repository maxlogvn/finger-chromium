# Overview: Loại bỏ hoàn toàn `as any` khỏi codebase

## Tóm tắt

Đã loại bỏ hoàn toàn 9 chỗ `as any` trong `src/` và 37 chỗ trong `tests/`
bằng cách define interface cụ thể, dùng type assertion chính xác (`as unknown as`),
thay duck-typing `as any` bằng `in` operator, và dùng `@ts-expect-error` cho
trường hợp read-only property cần set ở runtime.

## Kết quả thực hiện

| Bước | Kế hoạch | Thực tế | Sai lệch |
|---|---|---|---|
| Bước 1: Widen `ApiParams.options` | `options?: unknown` + fix access | Giống kế hoạch | Không có |
| Bước 2: Fix API params (fetch/versions/setup) | Bỏ `as any`, thêm interface | Bỏ `as any` từ fetch và setup. versions dùng `as unknown as` | Không thêm `FetchParams`/`SetupParams` vì không cần (ApiParams.options đã widen) |
| Bước 3: Fix configure() | Type `_args` với `Parameters` | Dùng typed params + `@ts-expect-error` cho forwarding | Phải dùng `@ts-expect-error` vì `SyncWrapper` generic không tương thích với call site |
| Bước 4a: Export + sửa `getProfilePath` | Export `GetProfilePathOptions` + bỏ cast | Giống kế hoạch | Không có |
| Bước 4b: Fix launch call | Tạo biến trung gian `BaseLaunchOptions` | Giống kế hoạch | Không có |
| Bước 5: Fix duck-typing `newContext` | Dùng `in` operator | Giống kế hoạch | Không có |
| Bước 6: Fix `killed` read-only | `@ts-expect-error` | Giống kế hoạch | Không có |
| Bước 7: Fix launcher type engine.ts | Type `opts` là `BaseLaunchOptions` | Giống kế hoạch + thêm import `Browser` | Không có |
| Bước 8: Fix test files | 37 chỗ `as any` -> cast cụ thể | Giống kế hoạch | Không có |

## Sai lệch đáng chú ý

- **configure() forwarding type:** Kế hoạch dùng `Parameters<typeof ConfigManager.prototype.configure>` để type `_args`.
  Thực tế `SyncWrapper` (`<T>(fn: () => Promise<T> | T) => Promise<T>`) là generic function type không tương thích
  với call site (`(fn: () => Promise<void>) => Promise<void>`). Giải pháp: dùng `@ts-expect-error` cho forwarding call,
  vì code path này chỉ chạy trong edge case (base class không override bởi subclass).
- **FetchParams/SetupParams interfaces:** Kế hoạch có thêm 2 interface, thực tế không cần vì sau bước 1
  (`ApiParams.options` thành `unknown`), object literal tự động khớp với `ApiParams` nhờ `[key: string]: unknown`.

## Tài liệu liên quan

- `docs/designs/code-quality-no-as-any.design.md`
- `docs/specs/code-quality-no-as-any.spec.md`
- `docs/plans/code-quality-no-as-any.plan.md`
- `docs/overviews/code-quality-no-as-any.overview.md` (file này)

## Ghi chú

- Không thay đổi hành vi runtime -- chỉ type-level changes.
- Còn 4 warning `@typescript-eslint/no-explicit-any` từ code cũ (không phải `as any`):
  `engine.ts:92,93` và `loader/index.ts:36,56` -- nằm ngoài scope task này.
