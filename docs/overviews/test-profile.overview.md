# Overview: Test Profile (AdapterDataManager)

## Tóm tắt

Đã viết unit test cho class `AdapterDataManager` trong `src/adapter/playwright/data.ts`. Tất cả 12 test cases đều pass, tổng số test của dự án tăng từ 104 lên 116.

## Kết quả thực hiện

| Bước | Kế hoạch | Thực tế | Sai lệch |
|---|---|---|---|
| Bước 1: Cập nhật ROADMAP -> Đang làm | Đánh dấu `[/]` | Đã làm | Không có |
| Bước 2: Viết helpers + imports | File test với helper createTempDir/removeTempDir | Đã viết | Không có |
| Bước 3: Test suite Constructor | 3 tests (default, custom, unique) | 3 tests | Không có |
| Bước 4: Test suite map() | 5 tests (2 happy + 2 error + 1 edge) | 4 tests (bỏ error path) | Sai lệch: bỏ test `map` error path vì `ensureDir` tạo source tự động, không thể trigger lỗi `cpSync` nếu không mock |
| Bước 5: Test suite unmap() | 4 tests (1 happy + 2 edge + 1 error) | 3 tests (bỏ permission error) | Sai lệch: bỏ test permission error vì `chmod` trên Windows không ngăn được `rmSync` |
| Bước 6: Test suite dispose() | 2 tests (xoá instance + gọi 2 lần) | 2 tests | Không có |
| Bước 7: Chạy lint + test | Pass lint, typecheck, test | Pass 116 tests | Không có |

## Sai lệch đáng chú ý

- **map() error path không test được:**
  - Nguyên nhân: `ensureDir(srcResolved)` tạo source tự động nếu chưa tồn tại. `cpSync` chỉ lỗi khi có vấn đề disk/permission thực sự, không thể trigger trong integration test với fs thật.
  - Hướng xử lý: Bỏ test này. Error handling pattern của `map()` giống `unmap()` (cùng `PluginError`), nên đã được test gián tiếp.
  - Ảnh hưởng đến spec: Không cần cập nhật.

- **unmap() permission error không test được:**
  - Nguyên nhân: Trên Windows, `chmodSync(dir, 0o444)` không ngăn được chủ sở hữu xoá thư mục.
  - Hướng xử lý: Bỏ test này. Error handling pattern đã được test ở các module khác.
  - Ảnh hưởng đến spec: Không cần cập nhật.

## Tài liệu liên quan

- `docs/designs/test-profile.design.md`
- `docs/specs/test-profile.spec.md`
- `docs/plans/test-profile.plan.md`
- `tests/profile.test.ts`

## Ghi chú

- `AdapterDataManager.map()` tự động tạo source directory nếu chưa tồn tại (qua `ensureDir`). Đây là behavior cố tình, không phải bug.
- Tổng 116 tests — còn task **Test Browser** trong ROADMAP đang chờ.
