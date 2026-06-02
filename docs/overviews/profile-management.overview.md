# Overview: Quản lý Profile

## Tóm tắt

Đã triển khai cơ chế copy profile vào thư mục tạm trước khi launch để tránh corrupt dữ liệu gốc. Hỗ trợ map ngược (temp -> destination) khi `quit()`, tự động load lại proxy/fingerprint từ profile cũ. Dùng `AdapterDataManager` để quản lý mapping.

## Kiến trúc

```
AdapterDataManager
  |-- constructor(options)          tạo temp root + instance temp dir
  |-- map(sourceDir)                copy source->temp (1 param)
  |-- map(sourceDir, destDir)       copy source->dest (2 params)
  |-- unmap(tempDir)                xoá temp dir
  |-- dispose()                     xoá toàn bộ temp root
  |
  |-- generateUniqueName()          timestamp + hex -> unique dir name

Profile flow:
  useProfile(dir, opts)
    -> dataManager.map(dir)          copy profile vào temp
    -> plugin.useProfile(tempDir, opts)  gửi temp path lên engine

  quit(saveDataPath?)
    -> dataManager.map(tempDir, saveDataPath ?? saveProfileDirPath)  copy temp về đích
    -> dataManager.unmap(BROWSER_RUNNING_DIR)  xoá temp
```

## Tham chiếu code

| Component | File | Dòng |
|---|---|---|
| `ProfileOptions` interface | `src/types/profile.ts` | 16-30 |
| `AdapterDataManager` class | `src/adapter/playwright/data.ts` | 28-97 |
| Constructor + temp dir | `src/adapter/playwright/data.ts` | 30-45 |
| `generateUniqueName()` | `src/adapter/playwright/data.ts` | 47-52 |
| `map()` overload | `src/adapter/playwright/data.ts` | 54-75 |
| `unmap()` | `src/adapter/playwright/data.ts` | 77-85 |
| `dispose()` | `src/adapter/playwright/data.ts` | 87-97 |
| `useProfile()` (BrowserEngine) | `src/adapter/playwright/chromium.ts` | 113-126 |
| `useProfile()` (FingerprintPlugin) | `src/plugin/index.ts` | 143-147 |
| Profile trong quit() | `src/adapter/playwright/chromium.ts` | 229-273 |

## ProfileOptions

```ts
interface ProfileOptions {
  loadProxy?: boolean;       // @default true -- load proxy từ profile cũ
  loadFingerprint?: boolean; // @default true -- load fingerprint từ profile cũ
}
```

## Quyết định thiết kế

- **Copy profile vào temp trước khi launch**: Tránh corrupt profile gốc nếu browser crash. Nếu không có temp, profile gốc có thể bị hỏng khi đang ghi.
- **`fs.cpSync` / `fs.rmSync` đồng bộ**: Tránh race condition khi multi-instance. Async có thể gây conflict nếu hai instance cùng copy vào một lúc.
- **Temp dir naming: `Date.now()_hex`**: `1717430400000_a3f1` -- timestamp đảm bảo uniqueness, hex ngăn name collision (65536 possibilities).
- **`loadProxy` / `loadFingerprint`**: Khi profile đã có proxy/fingerprint từ session trước, engine có thể load lại -- không cần gọi `useProxy()` / `useFingerprint()` lại.
- **`saveDataPath` trong quit() ghi đè**: Cho phép snapshot profile -- lưu vào path khác path gốc.

## Edge cases

- Source profile không tồn tại -> `fs.cpSync` throw -> `Error` với message rõ.
- Temp dir đã tồn tại (name conflict) -> `fs.cpSync` force: true -> overwrite.
- `rmSync` fail (permission) -> throw `Error` -- user cần kiểm tra quyền.
- Không gọi `useProfile()` -> `this.profileData` default temp -> engine tự tạo profile mới.
- `quit()` khi context undefined -> skip save (không mất data, chỉ không lưu).
- `saveDataPath !== saveProfileDirPath` -> lưu vào path khác (snapshot).

## Lưu ý

- `AdapterDataManager` dùng `fs.cpSync` (đồng bộ) -- tránh race condition.
- Temp dir được tạo trong constructor, không phải lúc `map()`.
- `map()` overload: 1 param (source->temp), 2 params (temp->dest).
- Fallback profile: nếu không gọi `useProfile()`, `_launch()` dùng `getProfilePath(options)` từ `--user-data-dir`.

## Tài liệu liên quan

- `docs/designs/profile-management.design.md`
- `docs/specs/profile-management.spec.md`
- `docs/plans/profile-management.plan.md`
- `docs/products/profile-management.product.md`
- `src/adapter/playwright/data.ts`
- `src/plugin/index.ts`
