# Design: Native Mutex -- Windows named mutex

## Bối cảnh

BASProcess yêu cầu named mutex để đồng bộ truy cập tài nguyên. Dùng native C++ addon (`mutex.node`) cho hiệu năng và chính xác.

## Câu hỏi làm rõ

- Dùng module JavaScript thuần hay native addon? → Native (mutex.node) vì cần kernel-level mutex.
- Hỗ trợ architecture nào? → win32-ia32 (32-bit) + win32-x64 (64-bit).

## Các phương án

### Phương án 1: proper-lockfile (file lock)

Không đáp ứng yêu cầu named mutex của BASProcess.

### Phương án 2: Native C++ addon (chọn)

- Ưu điểm: Kernel-level named mutex, đúng yêu cầu worker.exe.
- Nhược điểm: Cần maintain binary cho mỗi architecture.

## Giải pháp được chọn

- **Phương án AI đề xuất:** Phương án 2 (native addon).
- **Phương án được chọn:** Phương án 2.
- **Cơ chế:** resolvePackageRoot -> load `mutex.node` từ `plugin/mutex/{platform}-{arch}/` -> export `create(name)` và `release(name)`.
