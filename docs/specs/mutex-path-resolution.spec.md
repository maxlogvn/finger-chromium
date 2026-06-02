# Spec: Mutex Path Resolution

> Tuân thủ quy ước code tại [CONVENTIONS.md](../CONVENTIONS.md).

## Mô tả

Fix lỗi path resolution của native mutex module (`mutex.node`) sau khi tsup bundle. Hiện tại hardcoded `../../../` bị sai vị trí thư mục, dẫn đến lỗi `Unsupported OS architecture for named mutex`.

## Yêu cầu

1. Mutex path phải resolve chính xác dù code chạy từ source (dev), từ dist bundle, hay từ `node_modules`.
2. Không thay đổi API public -- vẫn export `create` và `default`.
3. Giữ nguyên hành vi lỗi hiện tại nếu mutex.node thực sự không tồn tại.

## Thiết kế chi tiết

### File thay đổi

| File | Thay đổi |
|---|---|
| `src/plugin/mutex/index.ts` | Thêm `resolvePackageRoot()`, thay `path.resolve(__dirname, '../../../')` bằng walk-up |

### Hàm `resolvePackageRoot`

```typescript
function resolvePackageRoot(startDir: string): string {
  let current = startDir;
  while (true) {
    try {
      const pkg = requireNative(path.join(current, 'package.json'));
      if (pkg.name === 'fingerprint-chromium-engine') return current;
    } catch {
      // chưa tìm thấy -- tiếp tục đi lên
    }
    const parent = path.dirname(current);
    if (parent === current) {
      throw new Error('[Mutex] Không tìm thấy thư mục gốc của package fingerprint-chromium-engine.');
    }
    current = parent;
  }
}
```

### Thứ tự khởi tạo

Không thay đổi -- vẫn là top-level module scope:

```typescript
const requireNative = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const PACKAGE_PATH = resolvePackageRoot(path.dirname(__filename));
const mutex: MutexModule = (() => { ... })();
export default mutex;
export const create = mutex.create;
```

## API / Data flow

**Không thay đổi API public.**

Dữ liệu vào:
- `import.meta.url` -> `fileURLToPath` -> `__filename`
- `path.dirname(__filename)` -> thư mục chứa file hiện tại
- `resolvePackageRoot()` -> package root (string path)

Dữ liệu ra:
- `PACKAGE_PATH` -> đường dẫn tuyệt đối tới package root

## Components

- **`src/plugin/mutex/index.ts`:** Component duy nhất bị ảnh hưởng.

## Xử lý lỗi

| Tình huống | Hành vi |
|---|---|
| Không tìm thấy package root | Throw Error với message chi tiết |
| mutex.node không tồn tại cho platform/arch hiện tại | Giữ nguyên: throw "Unsupported OS architecture for named mutex" |
| package.json không đọc được (corrupt) | Catch, tiếp tục đi lên tìm cấp khác |
| process.arch không phải ia32/x64 | Giữ nguyên: throw "Unsupported OS architecture for named mutex" |
| process.platform không phải win32 | Giữ nguyên: throw "Unsupported OS platform for named mutex" |

## Kiểm tra

1. `npm run build` -- bundle thành công, dist/index.js chứa code walk-up đúng.
2. `npm run lint` -- 0 error.
3. `npm test` -- tất cả test pass.
4. Kiểm tra thủ công: copy dist vào project client, xác nhận không còn lỗi mutex.

---

