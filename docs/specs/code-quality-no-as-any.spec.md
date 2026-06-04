# Spec: Loại bỏ hoàn toàn `as any` khỏi codebase

> Tuân thủ quy ước code tại [CONVENTIONS.md](../CONVENTIONS.md).

## Mô tả

Loại bỏ 9 chỗ `as any` trong `src/` và 37 chỗ trong `tests/` bằng cách define
interface cụ thể hoặc dùng type assertion chính xác thay vì `any`,
đảm bảo TypeScript strict mode kiểm tra được toàn bộ codebase.

Thiết kế: `docs/designs/code-quality-no-as-any.design.md`

## Yêu cầu

- Không thay đổi hành vi runtime của bất kỳ chức năng nào.
- Không thay đổi signature của public API (`BaseLaunchOptions`, `FingerprintPlugin`,...).
- `0` chỗ `as any` trong `src/` sau khi hoàn thành.
- Giảm `as any` trong `tests/` xuống mức thấp nhất có thể.
- `npm run typecheck` pass không lỗi.

## Các vị trí cần xử lý

### Nhóm 1: API params thiếu interface (`src/plugin/index.ts:203,249`)

**Vị trí 203** (`fetch()`):
```ts
} as any)) as string;
```
Params object `{ key, options, version }` không khớp `ApiParams` (thiếu `key: string | undefined`, `options: FetchOptions` không tương thích với `options?: { perfectCanvasRequest?: boolean }`).

**Vị trí 249** (`_launch()`):
```ts
} as any)) as SetupResponse;
```
Params object `{ proxy, fingerprint, version, profile, pid, key }` cũng thiếu interface tương ứng.

**Fix:** Thêm type cho `connector.api()` params bằng cách mở rộng `ApiParams` hoặc define interface cụ thể cho từng API call.

### Nhóm 2: Spread call không type (`src/plugin/index.ts:215,231`)

**Vị trí 215** (`versions()`):
```ts
return (await this.#connector.api('versions', { format })) as any;
```
Return type là conditional type `T extends 'extended' ? Version[] : string[]` -- `api()` trả về `unknown`.

**Fix:** Dùng `as unknown as T extends 'extended' ? Version[] : string[]` thay `as any`.

**Vị trí 231** (`configure()`):
```ts
return (this.#configManager.configure as any)(..._args);
```
`_args: any[]` và forward với `as any`.

**Fix:** Type `_args` đúng với `Parameters<typeof ConfigManager.prototype.configure>`.

### Nhóm 3: Merge options không tương thích (`src/plugin/index.ts:244,270`)

**Vị trí 244**:
```ts
value: getProfilePath(options as any),
```
`BaseLaunchOptions` có `args` và `userDataDir` giống `GetProfilePathOptions` -- có thể bỏ `as any`.

**Vị trí 270**:
```ts
} as any);
```
`defaultViewport: undefined` không hợp lệ với `BaseLaunchOptions` (kỳ vọng `null`), `args` merge từ `defaultArgs({ ...options, ...config })` với `config: { [key: string]: unknown }`.

**Fix:** Dùng `as BaseLaunchOptions` hoặc tách biến rõ ràng thay `as any`.

### Nhóm 4: Duck-typing và read-only property

**Vị trí** `src/adapter/playwright/utils.ts:72`:
```ts
if (!isBrowser(target) && !(target as any).newContext) {
```
Dùng duck-typing kiểm tra `newContext` tồn tại.

**Fix:** `'newContext' in target` hoặc type predicate.

**Vị trí** `src/plugin/launcher/index.ts:86`:
```ts
(childProcess as any).killed = true;
```
`ChildProcess.killed` là read-only.

**Fix:** `// @ts-expect-error` với comment giải thích -- đây là trường hợp runtime cần set (process chưa thực sự killed nhưng cần flag để tránh gọi `taskkill` lại).

**Vị trí** `src/adapter/playwright/engine.ts:80`:
```ts
} as any,
```
`launcher` object với `launch` nhận `opts: any` -- signature không khớp.

**Fix:** Type `opts` là `BaseLaunchOptions` và cast `this.pwLauncher[method]()` return bằng `as unknown as` thay `as any`.

## Components

| File | Thay đổi |
|------|----------|
| `src/plugin/index.ts` | Sửa 6 chỗ `as any` -- thêm interface API params, type assertion chính xác |
| `src/plugin/connector/index.ts` | Mở rộng `ApiParams.options` từ `{ perfectCanvasRequest?: boolean }` thành `unknown` |
| `src/plugin/launcher/index.ts` | Sửa 1 chỗ -- `@ts-expect-error` cho `childProcess.killed` |
| `src/adapter/playwright/engine.ts` | Sửa 1 chỗ -- type `launch` opts là `BaseLaunchOptions` |
| `src/adapter/playwright/utils.ts` | Sửa 1 chỗ -- dùng `'newContext' in target` |
| `tests/*.test.ts` | Sửa 37 chỗ `as any` -- dùng interface test riêng hoặc cast cụ thể |

## Xử lý lỗi

- **Logic error do type sai:** Không thể xảy ra nếu fix đúng type -- compile-time check bắt được.
- **`@ts-expect-error` sai:** Nếu code sau này thay đổi khiến lỗi biến mất, TS báo unused error directive.
- **`as unknown as` dư:** Tương tự -- nếu type sau này khớp, có thể bỏ cast.

## Kiểm tra

- `npm run typecheck` -- không còn lỗi type nào (bao gồm cả `as any`).
- `npm run lint` -- không lỗi ESLint mới.
- `npm test` -- 164 tests pass (không thay đổi hành vi).
- `npm run build` -- bundle thành công.
