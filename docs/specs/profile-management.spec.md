# Spec: Quản lý Profile

## File: `src/adapter/playwright/data.ts` (98 dòng)

### Class `AdapterDataManager`

#### Properties

| Property | Kiểu | Mô tả |
|---|---|---|
| `tempRootDir` | `string` (private) | Thư mục gốc chứa temp profiles |
| `instanceTempDir` | `string` (private) | Thư mục tạm riêng cho instance này |

#### Constructor

```ts
constructor(options: AdaDataManagerOptions = {}) {
  this.tempRootDir = options.tempRootDir ?? path.join(BROWSER_RUNNING_DIR, 'profile');
  this.instanceTempDir = path.join(this.tempRootDir, this.generateUniqueName());
}
```

#### Methods

| Method | Tham số | Trả về | Mô tả |
|---|---|---|---|
| `map(inputDir)` | `string` | `string` | Copy inputDir vào instanceTempDir, trả về temp path |
| `map(inputDir, targetDir)` | `string, string` | `string` | Copy inputDir vào targetDir, trả về targetDir |
| `unmap(tempDirPath)` | `string` | `void` | Xoá thư mục tạm (rmSync) |
| `dispose()` | – | `void` | Gọi unmap(instanceTempDir) |

#### Private Methods

```ts
private ensureDir(dirPath: string): void
private generateUniqueName(): string
```

### `map()` Flow

| Bước | Code | Mô tả |
|---|---|---|
| 1 | `dest = targetDir ?? this.instanceTempDir` | Xác định đích |
| 2 | `srcResolved = path.resolve(inputDir)` | Resolve path |
| 3 | `this.ensureDir(srcResolved)` | Đảm bảo source tồn tại |
| 4 | `this.ensureDir(path.dirname(destResolved))` | Tạo thư mục cha cho đích |
| 5 | `fs.cpSync(srcResolved, destResolved, { recursive: true, force: true })` | Copy |
| 6 | `return destResolved` | Trả về path đích |

### `unmap()` Flow

| Bước | Code | Mô tả |
|---|---|---|
| 1 | `if (!fs.existsSync(resolvedPath))` | Nếu không tồn tại -> warn, return |
| 2 | `fs.rmSync(resolvedPath, { recursive: true, force: true })` | Xoá |

### Options Interface (từ `src/types/profile.ts`)

```ts
export interface ProfileOptions {
  loadProxy?: boolean;        // default: true
  loadFingerprint?: boolean;  // default: true
}
```

### Integration trong BrowserEngine

```ts
// useProfile -> map source -> temp
this.saveProfileDirPath = dirPath;
this.profileData = [this.dataManager.map(dirPath), options];

// quit -> map temp -> destination
const targetSavePath = saveDataPath ?? this.saveProfileDirPath;
if (targetSavePath) {
  this.dataManager.map(this.profileData[0], targetSavePath);
}
this.dataManager.unmap(BROWSER_RUNNING_DIR);
```

---

## Xử lý lỗi

| Tình huống | Hành vi |
|---|---|
| Source profile không tồn tại | `ensureDir()` tạo source nếu chưa có |
| `cpSync` thất bại | Throw `Error('[DataManager] Sao chép thất bại: ...')` |
| `rmSync` thất bại | Throw `Error('[DataManager] Dọn dẹp thất bại: ...')` |
| Temp dir không tồn tại khi unmap | `console.warn('Bỏ qua xoá: thư mục không tồn tại')` |

---

## Kiểm tra

- `map()` -> verify copy đúng nội dung.
- `unmap()` -> verify xoá thành công.
- `dispose()` -> verify xoá instance temp dir.
- Error handling: `cpSync` fail, `rmSync` fail.

---
