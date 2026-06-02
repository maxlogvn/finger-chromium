# Plan: Quản lý Profile

## Các bước thực hiện

- [x] **Bước 1: Tạo `src/adapter/playwright/data.ts`**
  - Class `AdapterDataManager` với `tempRootDir` và `instanceTempDir`.
  - Options interface `AdaDataManagerOptions`.

- [x] **Bước 2: Implement `generateUniqueName()`**
  - `${Date.now()}_${Math.floor(Math.random() * 0xffff).toString(16).padStart(4, '0')}`.
  - 4 hex digits (65536 giá trị) + timestamp -> collision cực thấp.

- [x] **Bước 3: Implement `map()` với 2 overloads**
  - `map(source)` -> copy source vào instanceTempDir.
  - `map(temp, destination)` -> copy temp vào destination.
  - Dùng `fs.cpSync` với `recursive: true, force: true`.

- [x] **Bước 4: Implement `unmap()` và `dispose()`**
  - `unmap(path)` -> `fs.rmSync` xoá thư mục.
  - `dispose()` -> gọi `unmap(instanceTempDir)`.

- [x] **Bước 5: Tích hợp vào `BrowserEngine.useProfile()` và `quit()`**
  - `useProfile()` gọi `dataManager.map(source)`.
  - `quit()` gọi `dataManager.map(temp, destination)` + `dataManager.unmap()`.

## File liên quan

| File | Vai trò |
|---|---|
| `src/adapter/playwright/data.ts` | AdapterDataManager class (98 dòng) |
| `src/adapter/playwright/chromium.ts` | BrowserEngine tích hợp profile |
| `src/types/profile.ts` | ProfileOptions interface |

## Kiểm tra

- `npm run lint` -- 0 errors.
- Test: map/unmap lifecycle.
- Test: temp dir được xoá sau dispose.

---
