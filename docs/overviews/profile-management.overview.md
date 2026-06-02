# Overview: Quản lý Profile

## Mục tiêu

Tạo `AdapterDataManager` quản lý copy profile vào thư mục tạm khi launch, restore khi quit, tránh corrupt profile gốc.

## Kết quả

- `src/adapter/playwright/data.ts`: 98 dòng, class `AdapterDataManager`.
- `map()` 2 overloads: source->temp, temp->destination.
- `unmap()` + `dispose()` dọn dẹp temp dir.

## Kiểm tra

- `npm run lint` -- 0 errors.

## Sai lệch so với kế hoạch

Không có sai lệch.

## Ghi chú kỹ thuật

### `map()` 2 overloads dùng TypeScript overload, không phải optional parameter

```ts
map(sourceProfileDir: string): string;
map(tempProfileDir: string, destinationDir: string): string;
```

Code gọi phải chọn đúng overload.

### Temp dir naming

```
<tempRootDir>/<timestamp>_<random4hex>
VD: .tmp/browser/running/profile/1712345678_a1b2/
```

`Math.random()` thay `crypto.randomBytes` -- không cần bảo mật cao, tránh blocking. 4 hex digits (65536 giá trị) + timestamp ms đảm bảo uniqueness.

### Instance isolation

Mỗi `AdapterDataManager` instance có `instanceTempDir` riêng. Khi `dispose()`, chỉ xoá temp dir của instance đó. Không ảnh hưởng instance khác.

### `ensureDir()` tự động tạo source

```ts
private ensureDir(dirPath: string): void {
  fs.mkdirSync(dirPath, { recursive: true });
}
```

Nếu source profile chưa tồn tại, `map()` tự tạo thư mục rỗng -- profile sẽ được engine khởi tạo sau.

### Error messages

`cpSync` fail -> `throw new Error('[DataManager] Sao chép thất bại: "${src}" → "${dest}".\n[error message]')`
`rmSync` fail -> `throw new Error('[DataManager] Dọn dẹp thất bại: "${path}".\n[error message]')`

### Không cleanup handler cho process crash

Nếu process crash, temp dir còn sót lại. CleanupDaemon (cleaner.ts) sẽ dọn sau.

---
