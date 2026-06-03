# Spec: Test Profile (AdapterDataManager)

> Tuân thủ quy ước code tại [CONVENTIONS.md](../CONVENTIONS.md).

## Mô tả

Viết unit test cho class `AdapterDataManager` trong `src/adapter/playwright/data.ts`. Test với thư mục temp thật (fs thật, không mock) để đảm bảo các thao tác map/unmap profile hoạt động đúng trên Windows.

## Yêu cầu

- Phải test được tất cả phương thức public: `constructor`, `map`, `unmap`, `dispose`.
- Test phải tạo thư mục temp thật trước mỗi test case và dọn dẹp sau mỗi test.
- Phải cover: happy path, edge cases (source không tồn tại, unmap nhiều lần, unmap chưa map).
- Không được mock fs — dùng fs thật.
- File test: `tests/profile.test.ts`.
- Phải tương thích với Mocha + tsx runner hiện tại.
- Tuân thủ các conventions trong file test: header comment, section divider, mô tả tiếng Việt.

## Thiết kế

Tham chiếu: `docs/designs/test-profile.design.md`

Kiến trúc test:
- `beforeEach`: tạo temp dir bằng `fs.mkdtemp`, tạo source profile dir với file test.
- `afterEach`: xoá temp dir bằng `fs.rm`.
- Test suite gồm 4 nhóm: constructor, map, unmap, dispose.

## API / Data flow

Input:
- `map(sourceDir)` — copy từ source vào instance temp dir.
- `map(sourceDir, targetDir)` — copy từ source vào target cụ thể.
- `unmap(dir)` — xoá thư mục temp.
- `dispose()` — xoá instance temp dir.
- Constructor: `new AdapterDataManager({ tempRootDir })` — tạo instance temp dir.

Output:
- map trả về `string` (đường dẫn thư mục đích đã copy).
- unmap/dispose trả về `void`.
- Throw `PluginError` nếu copy/xoá thất bại.

Data flow:
```
tempRootDir (configurable) → instanceTempDir (tự sinh)
    → map(source) → copy vào instanceTempDir
    → map(source, target) → copy vào target chỉ định
    → unmap(path) → xoá thư mục
    → dispose() → xoá instanceTempDir
```

## Components

Module cần test:
- `src/adapter/playwright/data.ts` — class `AdapterDataManager`.

File test mới:
- `tests/profile.test.ts` — viết mới.

Không cần sửa source code.

## Xử lý lỗi

Test cần verify các lỗi sau được throw đúng kiểu (PluginError):

| Tình huống | Expected | Ghi chú |
|-----------|----------|---------|
| `unmap()` với path không tồn tại | Không throw — gọi `console.warn` và return | Đã test |
| `map()` với source rỗng (empty string) | Throw `PluginError` | `path.resolve` vẫn hoạt động nhưng `fs.cpSync` lỗi |

> **map() error path (source không tồn tại):** Không test được. `ensureDir(srcResolved)` tạo source tự động nếu chưa tồn tại — không thể trigger lỗi `cpSync` trong integration test với fs thật.
>
> **unmap() permission error:** Không test được trên Windows. `chmodSync(dir, 0o444)` không ngăn được chủ sở hữu xoá thư mục.

## Kiểm tra

### Constructor
- Nên tạo instance với temp root mặc định (BROWSER_RUNNING_DIR/profile).
- Nên tạo instance với temp root chỉ định.
- Nên sinh tên instanceTempDir duy nhất (timestamp + hex).

### map() (4 tests)
- Nên copy file từ source vào instanceTempDir (happy path — 1 tham số).
- Nên copy file từ source vào target chỉ định (2 tham số).
- Nên tạo thư mục đích nếu chưa tồn tại.
- Nên throw PluginError khi source là empty string.
- ~~Nên throw PluginError khi source không tồn tại.~~ — **Bỏ:** `ensureDir` tạo source tự động, không thể trigger lỗi trong integration test.

### unmap() (3 tests)
- Nên xoá thư mục đã map thành công.
- Nên không throw khi path không tồn tại (console.warn).
- Nên làm việc với relative path (path.resolve bên trong).
- ~~Nên throw PluginError khi không xoá được (permission error).~~ — **Bỏ:** Windows `chmod` không ngăn được chủ sở hữu xoá thư mục.

### dispose()
- Nên xoá instanceTempDir (kiểm tra bằng fs.existsSync sau dispose).
- Nên có thể gọi dispose() nhiều lần mà không lỗi (lần 2 thấy không tồn tại — console.warn).
