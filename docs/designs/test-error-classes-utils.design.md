# Design: Test Error classes & Utilities

## Bối cảnh

Hiện tại dự án chỉ có 2 file test (`multi-profile-singleton.test.ts` và `quit-cleanup.test.ts`), tập trung vào integration và hành vi runtime. Các module cốt lõi như `errors.ts`, `utils.ts`, `common/index.ts`, `loader/index.ts` chưa có unit test nào.

Cụ thể:
- **errors.ts** — 5 class lỗi (PluginError base + 4 subclass). Cần test: khởi tạo, kế thừa, message format, stack trace, toStringTag.
- **utils.ts** — 4 function (defaultArgs, getProfilePath, validateConfig, validateLauncher). Cần test: logic lọc args, xử lý profile path, validation edge cases.
- **common/index.ts** — scripts object với 2 function (waitForResize, getViewport). Cần test: cấu trúc, kiểu trả về.
- **loader/index.ts** — class Loader với static import() và instance load(). Cần test: resolve package, version validation, error cases.

## Câu hỏi làm rõ

- Có cần test `common/index.ts` không? scripts là in-browser code chạy qua `page.evaluate()`, không thể test thuần Node.js. → Chỉ test cấu trúc export (scripts là object, có đúng key), không test logic runtime.
- `loader/index.ts` dùng `require()` (createRequire) — có cần mock module system? → Dùng try/catch tự nhiên của Loader.import(), chỉ test happy path với module thật và error case khi package không tồn tại.
- Cần mock `PluginError` trong test utils? → Không, import thật từ errors.ts.

## Các phương án

### Phương án 1: Unit test thuần — tách riêng từng module
Mỗi module test độc lập, dùng describe/it theo module.

- Ưu điểm: Dễ đọc, dễ maintain, isolation tốt.
- Nhược điểm: Cần nhiều describe block, hơi dài file.

### Phương án 2: Gộp test theo chức năng (horizontal)
Test theo "hành vi" thay vì module — ví dụ "test validation" gồm validateConfig + validateLauncher + error classes.

- Ưu điểm: Nhóm các hành vi liên quan, giảm số describe.
- Nhược điểm: Khó map code → test, khó maintain về sau.

### Phương án 3: Phương án 1 nhưng tách thành nhiều file nhỏ
Mỗi module một file test riêng: `errors.test.ts`, `utils.test.ts`, `loader.test.ts`, `common.test.ts`.

- Ưu điểm: Isolation tối đa, dễ tìm test theo module.
- Nhược điểm: Quá nhiều file cho module nhỏ, tăng overhead.

## Giải pháp được chọn

- **Phương án AI đề xuất:** Phương án 1 — một file `tests/utils.test.ts`, test từng module trong describe riêng. Đủ isolation, không phân mảnh file.
- **Phương án được chọn:** (do người duyệt điền sau)
- **Lý do:** Các module đều nhỏ (< 100 dòng mỗi file), gộp chung một file là phù hợp. File test hiện có cũng dùng pattern này (quit-cleanup.test.ts test 6 module khác nhau).
- **Ràng buộc:** Unit test thuần, không mock nặng. Không cần Playwright hay engine thật.
