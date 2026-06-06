# Design: Unit Tests cho Core (`tests/unit/core.spec.ts`)

> **Version:** 1.0 | **Cập nhật lần cuối:** 2026-06-06  
> **Người viết:** AI Agent | **Người phản biện:** (chờ duyệt)

## Bối cảnh

Dự án đã có smoke test (cần `BABLOSOFT_KEY` và browser thật) và test utilities (`tests/helpers.ts`), nhưng chưa có unit test cho các module core không phụ thuộc browser. Cụ thể:

- **`src/plugin/errors.ts`**: 5 error class -- mỗi class có constructor riêng kèm `dedent`, cần test `instanceof` chain và custom message.
- **`src/index.ts`**: Export công khai -- cần đảm bảo class, type, error đúng kiểu và tồn tại.
- **`src/plugin/config.ts`**: `ConfigManager` với `getValidPollInterval()`, `configure()`, `synchronize()` -- có logic validate, lock, read/write file cần test với mock filesystem.

Thiếu unit test làm chậm refactor, dễ gây hồi quy, và tăng technical debt.

## Câu hỏi làm rõ

1. **Câu hỏi:** Có nên dùng mock filesystem (memfs) cho config tests hay mock `fs/promises`?
   → **Trả lời:** Dùng temp directory thật (`fs.mkdtempSync`) kết hợp cleanup trong `after`. Vì `sinon`, `mock-fs`, `memfs` đều không có trong `devDependencies`, không muốn thêm dependency mới chỉ để mock fs cho một module nhỏ. `getValidPollInterval()` là pure function, test trực tiếp không cần mock.
2. **Câu hỏi:** Export check nên dùng runtime assert (`typeof`) hay TypeScript type test (`tsd`)?
   → **Trả lời:** Runtime assert với Node `assert` module (có sẵn, không cài thêm). `chai` và `tsd` không có trong dependencies.
3. **Câu hỏi:** Có cần test `ConfigManager` với file .ini thật hay mock hoàn toàn?
   → **Trả lời:** `ConfigManager.synchronize()` cần file .ini thật trong temp directory và cleanup sau mỗi test. Không mock fs vì không có thư viện hỗ trợ.

## Các phương án

### Phương án 1: Một file `core.spec.ts`, tách nhóm bằng describe

Gộp tất cả test (errors, exports, config) vào một file `tests/unit/core.spec.ts`, mỗi nhóm một `describe` riêng.

- **Ưu điểm:** Gọn, đúng tên file đã định trong issue, dễ định vị.
- **Nhược điểm:** Config test phức tạp hơn (mock fs, lock) có thể làm file quá dài.
- **Rủi ro:** File trở nên khó đọc khi thêm module mới.

### Phương án 2: Tách config test riêng (`config.spec.ts`)

`core.spec.ts` chỉ test errors và exports. `config.spec.ts` riêng cho ConfigManager.

- **Ưu điểm:** Phân tách rõ ràng, config test có setup mock phức tạp không ảnh hưởng errors/exports.
- **Nhược điểm:** Lệch với tên issue (`tests/unit/core.spec.ts`), cần sửa TRACKING.md.
- **Rủi ro:** Nhỏ.

### Phương án 3: Viết test pure function riêng, tích hợp test mức integration cho config

Errors/exports dùng unit test thuần. Config dùng integration test với thư mục tạm thật (dùng `fs.mkdtemp` + cleanup sau test).

- **Ưu điểm:** Không cần mock fs, test thực tế hơn.
- **Nhược điểm:** Chậm hơn (I/O thật), cleanup phức tạp, dễ fail trên CI.
- **Rủi ro:** File tạm không được cleanup nếu test crash.

## Đánh giá so sánh

| Tiêu chí | Phương án 1 | Phương án 2 | Phương án 3 |
|----------|-------------|-------------|-------------|
| Độ phức tạp | Thấp | Thấp | Trung bình |
| Dễ bảo trì | Cao (1 file) | Cao (tách biệt) | Trung bình |
| Tốc độ test | Nhanh (mock) | Nhanh (mock) | Chậm hơn (I/O thật) |
| Độ tin cậy | Phụ thuộc mock | Phụ thuộc mock | Cao (fs thật) |
| Mở rộng được | Kém (1 file) | Tốt (thêm file) | Tốt |

## Giải pháp được chọn

- **Phương án AI đề xuất:** Phương án 1 (một file, tách describe) vì:
  - Đúng tên file đã thống nhất trong issue.
  - Dùng Mocha describe/suite để tổ chức, file không quá dài (~200 dòng).
  - Config test dùng temp directory thật (`fs.mkdtempSync`), không cần thêm thư viện mock.
  - Khi project phát triển, có thể tách config ra file riêng sau mà không ảnh hưởng API test.
- **Phương án được chọn (sau review):** (do người duyệt điền)
- **Lý do:** ...
- **Ràng buộc/Điều kiện:** Dùng Mocha + Node assert (có sẵn). Không thêm thư viện test mới.

## Rủi ro và biện pháp giảm thiểu

| Rủi ro | Mức độ | Biện pháp |
|--------|--------|------------|
| Temp directory không được cleanup nếu test crash | Trung bình | Dùng `afterEach` + `after` kết hợp `try/finally` để đảm bảo cleanup. |
| File core.spec.ts quá dài sau này | Thấp | Tách module sau -- không ảnh hưởng test hiện tại. |
| Config test phụ thuộc I/O thật chậm hơn mock | Thấp | Dùng temp dir trên ramdisk (OS temp), thời gian chấp nhận được (~ms). |
