# Design: Test Profile (AdapterDataManager)

## Bối cảnh

Module `src/adapter/playwright/data.ts` chứa class `AdapterDataManager` — quản lý ánh xạ profile từ thư mục gốc sang thư mục tạm để tránh corrupt khi browser đang chạy. Class này hiện chưa có unit test nào.

Các phương thức public:
- `constructor(options?)` — tạo instance temp dir
- `map(source)` / `map(source, target)` — copy profile
- `unmap(path)` — xoá temp dir
- `dispose()` — dọn dẹp instance temp dir

Cần viết test để đảm bảo các phương thức hoạt động đúng trong mọi tình huống.

## Câu hỏi làm rõ

- Có mock fs không? → Không. Dùng thư mục temp thật (đã ghi rõ trong ROADMAP).
- Test edge cases nào? → Source không tồn tại, target không tồn tại, unmap khi chưa map, unmap nhiều lần, generateUniqueName format.
- Cần test private methods không? → `generateUniqueName()` nên test gián tiếp qua constructor. `ensureDir()` test qua map/unmap.

## Các phương án

### Phương án 1: Integration-style với thư mục temp thật

Tạo temp directory thật, dùng `fs.mkdtemp` để tạo thư mục tạm trước mỗi test, dọn dẹp sau mỗi test.

- Ưu điểm: Test sát thực tế, không mock, dễ debug.
- Nhược điểm: Chậm hơn mock (nhưng không đáng kể với vài chục test).

### Phương án 2: Mock fs hoàn toàn

Dùng sinon hoặc proxyquire để mock `fs.cpSync`, `fs.rmSync`, `fs.mkdirSync`, `fs.existsSync`.

- Ưu điểm: Nhanh, kiểm soát được edge cases.
- Nhược điểm: Phức tạp hơn, không test được fs behavior thật.

### Phương án 3: Kết hợp — integration cho happy path, mock cho error path

Happy path dùng fs thật, error path dùng mock để simulate lỗi (quyền truy cập, disk error).

- Ưu điểm: Vừa kiểm tra thực tế vừa test được error handling.
- Nhược điểm: Hai cơ chế khác nhau, khó maintain.

## Giải pháp được chọn

- **Phương án AI đề xuất:** Phương án 1 (integration-style với thư mục temp thật).
- **Phương án được chọn:** (người duyệt điền sau)
- **Lý do:** Đơn giản, đúng với hướng dẫn trong ROADMAP, module nhỏ nên integration test vẫn nhanh. Error path có thể simulate bằng cách dùng fs `chmod` để tạo permission error trên Windows.
