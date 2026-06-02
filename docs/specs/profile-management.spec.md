# Spec: Quản lý Profile

## Class: AdapterDataManager (98 dòng)

### Properties

```ts
private tempRootDir: string;       // <BROWSER_RUNNING_DIR>/profile
private instanceTempDir: string;   // <tempRootDir>/<timestamp>_<random>
```

### Constructor

```ts
constructor(options: AdaDataManagerOptions = {}) {
  this.tempRootDir = options.tempRootDir ?? path.join(BROWSER_RUNNING_DIR, 'profile');
  this.instanceTempDir = path.join(this.tempRootDir, this.generateUniqueName());
}
```

### Methods

| Method | Mô tả |
|---|---|
| `map(sourceProfileDir: string): string` | Copy source → temp, return temp path |
| `map(tempProfileDir: string, destinationDir: string): string` | Copy temp → dest, return dest |
| `unmap(tempDirPath: string): void` | Xoá temp dir (rmSync) |
| `dispose(): void` | Gọi unmap(instanceTempDir) |

### ProfileOptions

```ts
interface ProfileOptions {
  loadProxy?: boolean;        // default: true
  loadFingerprint?: boolean;  // default: true
}
```

Khi `loadProxy` hoặc `loadFingerprint` là `true`, engine binary sẽ đọc lại config từ profile đã lưu (trong `.ini` files).

### Integration trong BrowserEngine

```ts
// useProfile
this.saveProfileDirPath = dirPath;
this.profileData = [this.dataManager.map(dirPath), options];

// quit
if (this.saveProfileDirPath) {
  this.dataManager.map(tempDirPath, saveDataPath ?? this.saveProfileDirPath);
}
this.dataManager.unmap(BROWSER_RUNNING_DIR);
```
