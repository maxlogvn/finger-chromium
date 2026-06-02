# Spec: Native Mutex

## Mô tả

Native Mutex load C++ addon (`mutex.node`) để tạo Windows named mutex cho engine binary. Hỗ trợ win32 32-bit và 64-bit.

## API / Interfaces chính

### `create(name)`

```ts
export const create = mutex.create;
// type: (name: string) => void
```

Tạo Windows named mutex với tên `name`.

Trong thực tế, tên mutex là `BASProcess<uuid>` (VD: `BASProcess550e8400-e29b-41d4-a716-446655440000`) với UUID random mỗi lần launch -- cho phép nhiều instance chạy đồng thời.

### `mutex` (default export)

```ts
const mutex: MutexModule = loadNativeAddon();
// MutexModule: { create: (name: string) => void, [key: string]: unknown }
```

## Luồng dữ liệu

```
Import mutex từ 'fingerprint-chromium-engine'
    │
    ├── createRequire(import.meta.url) → require
    │
    ├── require(`plugin/mutex/win32-x64/mutex.node`) → native addon
    │   └── Lỗi? → kiểm tra platform/arch → Error
    │
    └── Export create() function
                │
                ▼
FingerprintPlugin gọi create('BASProcess')
    │
    └── Windows kernel tạo named mutex
```

## File liên quan

| File | Vai trò |
|---|---|
| `src/plugin/mutex/index.ts` | Loader cho mutex.node (48 dòng) |
| `plugin/mutex/win32-x64/mutex.node` | C++ addon 64-bit (binary, runtime) |
| `plugin/mutex/win32-ia32/mutex.node` | C++ addon 32-bit (binary, runtime) |

## Xử lý lỗi

| Lỗi | Điều kiện |
|---|---|
| `Unsupported OS architecture for named mutex.` | Windows nhưng arch không phải x64/ia32 |
| `Unsupported OS platform for named mutex.` | Platform không phải Windows |

## Ghi chú kỹ thuật

- `createRequire(import.meta.url)` với `import.meta.url` là đường dẫn file hiện tại (ESM).
- `PACKAGE_PATH` resolve từ `__dirname` lên 3 cấp: `mutex/` -> `plugin/` -> `src/` -> package root.
- `.node` file không thể bundle -- được copy vào dist/ khi build.
- `package.json` `files` field cần bao gồm thư mục `plugin/mutex/`.

---
