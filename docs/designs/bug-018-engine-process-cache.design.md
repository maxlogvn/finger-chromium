# Design: Bug #18 — Cache engine process giữa các API calls

## Bối cảnh

Hiện tại mỗi lần gọi `runFunction()` trong `src/plugin/connector/engine.ts` đều spawn một process `FastExecuteScript.exe` mới (dòng 191-192), bất kể process cũ còn sống hay không.

Thực tế `FastExecuteScript.exe` với flag `--mock-connector` là một daemon process — nó chạy nền, chờ request file trong thư mục `r/`, xử lý và ghi phản hồi. Một process hoàn toàn có thể xử lý nhiều request liên tiếp.

Mỗi lần spawn process mới gây:
- Tốn thời gian khởi động engine (download + extract + spawn)
- Tiêu tốn tài nguyên hệ thống (mỗi process ~50-100MB RAM)
- Chậm đáng kể khi ứng dụng gọi nhiều API (fetch fingerprint, setup, configure...)

## Câu hỏi làm rõ

- Process engine có thực sự xử lý được nhiều request không? → Có, vì nó chạy ở chế độ `--mock-connector`, watch thư mục `r/` và xử lý từng request file.
- Nếu process crash giữa chừng thì sao? → Cần phát hiện và spawn lại. Dùng `kill(pid, 0)` để kiểm tra process còn sống.
- Timeout khởi động có áp dụng cho lần dùng lại không? → Không, timeout chỉ áp dụng khi thực sự spawn process mới. Lần dùng lại trả về ngay.

## Các phương án

### Phương án 1: Cache process trong `#startProcess()` (đề xuất)

Thêm check đầu method `#startProcess()`: nếu `this.#process` còn sống (chưa killed, PID còn chạy), return thẳng `this.#process` thay vì spawn mới.

```
#startProcess(timeout):
  if (this.#process và còn alive):
    return this.#process
  // ... spawn mới như cũ ...
```

- Ưu điểm:
  - Thay đổi tối thiểu, chỉ 1 method.
  - Tự động spawn lại nếu process chết.
  - `kill()` vẫn set `#process = undefined` — lần gọi sau sẽ spawn mới.
- Nhược điểm:
  - Cần helper kiểm tra process alive (dùng `kill(pid, 0)` hoặc `process.killed`).
  - Timeout chỉ áp dụng cho lần spawn đầu tiên — về mặt logic đã đúng.

### Phương án 2: Cache process trong `runFunction()`

Thêm check ở đầu `runFunction()` trước khi gọi `#startProcess()`.

```
runFunction(name, params):
  if (!this.#process hoặc !còn alive):
    await this.#startProcess()
  // ... tạo request file và watch ...
```

- Ưu điểm: Tương tự PA1.
- Nhược điểm: Logic cache nằm sai tầng — `runFunction()` không nên quan tâm process lifecycle. `#startProcess()` nên trả về process đang chạy, không nhất thiết phải spawn mới.

## Giải pháp được chọn

- **Phương án AI đề xuất:** Phương án 1 — cache trong `#startProcess()`.
- **Phương án được chọn:** Phương án 1 (người duyệt đã approve).
- **Lý do:** Thay đổi tối thiểu, đúng trách nhiệm (method trả về process đã sẵn sàng), tự động phát hiện và restart khi process chết.

### Chi tiết implement

**Helper mới — `#isProcessAlive(proc?: ChildProcess): boolean`:**
```ts
#isProcessAlive(proc?: ChildProcess): boolean {
  if (!proc) return false;
  if (proc.killed) return false;
  try {
    process.kill(proc.pid!, 0); // signal 0 = kiểm tra tồn tại
    return true;
  } catch {
    return false;
  }
}
```

**Sửa `#startProcess()`:**
```ts
async #startProcess(timeout?: number): Promise<ChildProcess> {
  if (this.#isProcessAlive(this.#process)) {
    debug('Tái sử dụng tiến trình engine hiện tại');
    return this.#process!;
  }
  // ... spawn mới như cũ, timeout chỉ áp dụng khi spawn ...
}
```

**Biến cần thêm:**
- `#isProcessAlive()` — helper method private.

**Ràng buộc:**
- `kill()` vẫn giữ nguyên: set `this.#process = undefined` — lần gọi `#startProcess()` sau sẽ spawn mới.
- Không ảnh hưởng đến cleanup logic hiện tại.
- Không ảnh hưởng đến `connector/index.ts` (caller không thay đổi).
