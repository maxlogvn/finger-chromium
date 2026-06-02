# Design: Mutex Path Resolution

## Vấn đề cần giải quyết

File `src/plugin/mutex/index.ts` dùng hardcoded relative path `../../../` để tìm package root:

```typescript
const PACKAGE_PATH = path.resolve(__dirname, '../../../');
```

**Tại source:** `__dirname` = `src/plugin/mutex/`, `../../../` = package root. Hoạt động đúng.

**Sau khi tsup bundle:** code bị dồn vào `dist/index.js`, `__dirname` = `dist/`. `../../../` từ `dist/` trỏ lên trên 3 cấp, xa hơn package root 2 cấp -- path resolve sai, không tìm thấy `mutex.node`.

**Khi cài qua npm:** `node_modules/fingerprint-chromium-engine/dist/index.js` cũng gặp lỗi tương tự.

## Các phương án đã cân nhắc

### 1. Điều chỉnh số lượng `../` (loại)

Đổi `../../../` thành `../` để vừa với vị trí `dist/`.

**Ưu điểm:** Sửa 1 dòng, nhanh.

**Nhược điểm:**
- Không chạy được khi chạy trực tiếp từ source (dev mode qua tsx).
- Phụ thuộc vào cấu trúc bundle -- nếu thay đổi số cấp thư mục trong bundle, lại hỏng.

**Kết luận:** Loại.

### 2. Walk-up algorithm tìm package root (chọn)

Dùng thuật toán đi lên từ thư mục hiện tại, ở mỗi cấp đọc `package.json` và kiểm tra `name === 'fingerprint-chromium-engine'`. Giống hàm `resolvePackageRoot` trong `src/plugin/connector/engine.ts:47`.

**Ưu điểm:**
- Hoạt động chính xác ở mọi vị trí (source, dist, node_modules).
- Không phụ thuộc vào cấu trúc bundle.
- Code tách biệt, dễ kiểm tra.

**Nhược điểm:**
- Cần duyệt qua các thư mục cha (trung bình 1-3 lần).
- Trùng lặp code nhỏ với `engine.ts` (có thể trích shared utility sau này).

**Kết luận:** Chọn.

### 3. Trích `resolvePackageRoot` thành shared utility

Đưa hàm `resolvePackageRoot` từ `engine.ts` ra `src/common/`, dùng chung cho cả mutex và engine.

**Ưu điểm:**
- DRY, tái sử dụng.
- Một chỗ sửa, tất cả cùng hưởng.

**Nhược điểm:**
- Phạm vi ảnh hưởng rộng hơn (sửa engine.ts + mutex/index.ts + common mới).
- `engine.ts` hiện dùng named function `resolvePackageRoot` ở module scope, cần kiểm tra kỹ.
- Mutex được load rất sớm (top-level import), thêm một tầng gián tiếp.

**Kết luận:** Tốt cho tương lai, nhưng hiện tại ưu tiên phương án 2 (inline) -- đơn giản, an toàn, ít thay đổi.

## Thiết kế

### Thay đổi trong `src/plugin/mutex/index.ts`

Thêm hàm `resolvePackageRoot` trước khi dùng:

```typescript
function resolvePackageRoot(startDir: string): string {
  let current = startDir;
  while (true) {
    try {
      const pkg = requireNative(path.join(current, 'package.json'));
      if (pkg.name === 'fingerprint-chromium-engine') return current;
    } catch {
      // chưa tìm thấy -- đi tiếp
    }
    const parent = path.dirname(current);
    if (parent === current) {
      throw new Error('Không tìm thấy thư mục gốc của package fingerprint-chromium-engine.');
    }
    current = parent;
  }
}
```

Sau đó thay:

```typescript
const PACKAGE_PATH = path.resolve(__dirname, '../../../');
```

thành:

```typescript
const PACKAGE_PATH = resolvePackageRoot(path.dirname(__filename));
```

In ra:

Bỏ dòng khai báo `__dirname` vì không còn dùng nữa:

```typescript
const __filename = fileURLToPath(import.meta.url);
```

### Luồng xử lý

```
import.meta.url
    -> fileURLToPath -> __filename
    -> path.dirname -> thư mục chứa file hiện tại
    -> resolvePackageRoot()
        -> while loop: đọc package.json từng cấp cha
        -> tìm thấy "fingerprint-chromium-engine" -> return path
    -> PACKAGE_PATH
    -> path.join(PACKAGE_PATH, 'plugin/mutex/{platform}-{arch}/mutex.node')
    -> requireNative(modulePath)
```

## Xử lý lỗi

- **Không tìm thấy package root:** throw Error với message rõ ràng.
- **mutex.node không tồn tại:** giữ nguyên xử lý cũ (throw Unsupported OS architecture / platform).
- **package.json malformed:** catch vào nhánh "chưa tìm thấy", tiếp tục đi lên.

## Tác động

- **Phạm vi:** Chỉ file `src/plugin/mutex/index.ts`.
- **API public:** Không thay đổi.
- **Kiểm thử:** Build lại dist, chạy lint, test. Kiểm tra thủ công bằng cách replace dist trong project client.

---

