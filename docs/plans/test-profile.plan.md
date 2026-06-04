# Plan: Test Profile (AdapterDataManager)

## Các bước thực hiện

- [x] Bước 1: Cập nhật ROADMAP.md — chuyển Test Profile thành "Đang làm"
    - File liên quan: `docs/ROADMAP.md`
    - Ghi chú: Đánh dấu mục Test Profile ở lines 380-390 từ `[-]` thành `[/]`

- [x] Bước 2: Viết test file `tests/profile.test.ts` — helpers và suites
    - File liên quan: `tests/profile.test.ts` (tạo mới)
    - Làm gì:
        - Header comment mô tả luồng test
        - Import: `describe/it/beforeEach/afterEach` từ mocha, `strictEqual/ok/doesNotThrow/rejects` từ assert, `path`, `fs/promises`, `AdapterDataManager` từ data.ts
        - Helper `createTempDir()`: dùng `fs.mkdtemp` tạo temp dir, tạo thư mục `source` với file `test.txt` bên trong
        - Helper `removeTempDir()`: xoá temp dir trong afterEach
    - Phụ thuộc: Không

- [x] Bước 3: Viết test suite — Constructor
    - File liên quan: `tests/profile.test.ts`
    - Làm gì:
        - Test 1: constructor với tempRootDir mặc định — kiểm tra instanceTempDir chứa tempRootDir
        - Test 2: constructor với tempRootDir chỉ định — kiểm tra path đúng
        - Test 3: hai instance khác nhau có instanceTempDir khác nhau
    - Ghi chú: Dùng `ok(instance.tempDir.includes(...))` — cần access private field qua any cast hoặc test gián tiếp

- [x] Bước 4: Viết test suite — map()
    - File liên quan: `tests/profile.test.ts`
    - Làm gì:
        - Test 4: map(source) trả về string và copy file thành công (1 tham số)
        - Test 5: map(source, target) copy vào target chỉ định (2 tham số)
        - Test 6: map() tạo thư mục đích nếu chưa tồn tại
        - Test 7: map() với source không tồn tại — throw PluginError
        - Test 8: map() với source là empty string — throw PluginError
    - Ghi chú: Dùng `rejects` từ assert cho async error path (map không async, nên dùng `throws` từ assert)

- [x] Bước 5: Viết test suite — unmap()
    - File liên quan: `tests/profile.test.ts`
    - Làm gì:
        - Test 9: unmap() xoá thư mục đã map thành công
        - Test 10: unmap() path không tồn tại — không throw (dùng doesNotThrow)
        - Test 11: unmap() với relative path — hoạt động bình thường
        - Test 12: unmap() không có quyền xoá — throw PluginError (dùng fs.chmodSync để tạo read-only)

- [x] Bước 6: Viết test suite — dispose()
    - File liên quan: `tests/profile.test.ts`
    - Làm gì:
        - Test 13: dispose() xoá instanceTempDir
        - Test 14: dispose() gọi 2 lần — lần 2 không throw

- [x] Bước 7: Chạy kiểm tra
    - Làm gì: `npm run lint` + `npm test`
    - Ghi chú: Sửa lỗi nếu có

## Kiểm tra
Các lệnh cần chạy để xác nhận kết quả sau khi code xong:
- `npm run lint`
- `npm run typecheck`
- `npm test`

## Ghi chú
- Module dùng `fs.cpSync` — có thể không hoạt động trên Node.js < 16.7 (dự án yêu cầu >= 18, nên OK).
- Test unmap với permission error trên Windows dùng `fs.chmodSync(dir, 0o444)` để set read-only.
- `instanceTempDir` là private field — test gián tiếp qua `map()` hoặc dùng `(dataManager as any).instanceTempDir`.
- Cần import `describe`/`it` từ mocha để tương thích với ESM.
