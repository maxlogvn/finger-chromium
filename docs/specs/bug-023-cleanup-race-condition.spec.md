# Spec: Cleanup race condition -- await engine process exit trước khi dọn dẹp (Bug fix #23)

> Tuân thủ quy ước code tại [CONVENTIONS.md](../CONVENTIONS.md).

## Mô tả

`RemoteEngine.kill()` hiện tại là fire-and-forget -- gửi SIGTERM đến `FastExecuteScript.exe` và trả về ngay mà không đợi process thoát. `FingerprintPlugin.cleanup()` gọi `cleaner.stop()` ngay sau `connector.cleanup()`, dẫn đến cleaner xoá file khi process còn ghi, gây lỗi `EBUSY` trên Windows.

Fix: chuyển `kill()` và `cleanup()` sang async, await process exit với timeout + SIGKILL fallback.

## Yêu cầu

- `RemoteEngine.kill()` phải đợi process con thoát hẳn trước khi resolve.
- Nếu process không thoát sau timeout (mặc định 5000ms), dùng SIGKILL để force kill.
- `Connector.cleanup()` phải trả về `Promise<void>`, await `engine.kill()`.
- `FingerprintPlugin.cleanup()` phải await `connector.cleanup()`.
- Không thay đổi behavior của các method khác.
- Backward compatible: `RemoteEngine` vẫn giữ `kill()` method, chỉ đổi signature từ `void` sang `Promise<void>`.

## Thiết kế

Tham chiếu: `docs/designs/bug-023-cleanup-race-condition.design.md`

## API / Data flow

### RemoteEngine.kill() -- hiện tại

```
kill(): void
  ├── Gửi SIGTERM đến process
  └── this.#process = undefined (ngay lập tức)
```

### RemoteEngine.kill() -- sau fix

```
async kill(timeout = 5000): Promise<void>
  ├── Nếu không có process hoặc đã killed → return
  ├── Tạo exitPromise = new Promise(resolve => proc.once('exit', resolve))
  ├── Gửi SIGTERM
  ├── Race giữa exitPromise và timeout:
  │   ├── exitPromise resolve → process đã thoát
  │   └── Timeout → gửi SIGKILL, await exitPromise
  ├── this.#process = undefined
  └── Return
```

### Connector.cleanup()

```
// Hiện tại:
cleanup(): void → this.#engine.kill()

// Sau fix:
async cleanup(): Promise<void> → await this.#engine.kill()
```

### FingerprintPlugin.cleanup()

```
// Hiện tại:
async cleanup(): Promise<void>
  ├── await this.browser.close()
  ├── this.#connector.cleanup()   // void, không await được
  └── await this.#cleaner.stop()  // chạy ngay sau kill

// Sau fix:
async cleanup(): Promise<void>
  ├── await this.browser.close()
  ├── await this.#connector.cleanup()  // await process exit
  └── await this.#cleaner.stop()       // chạy sau khi process đã thoát
```

## Components

- `src/plugin/connector/engine.ts` (sửa) -- `kill()` từ `void` → `async Promise<void>`, thêm `timeout` param. Thêm `KILL_TIMEOUT = 5000` constant.
- `src/plugin/connector/index.ts` (sửa) -- `cleanup()` từ `void` → `async Promise<void>`.
- `src/plugin/index.ts` (sửa) -- `cleanup()` await `this.#connector.cleanup()`.

## Xử lý lỗi

- **Process không thoát sau timeout (5000ms):** gửi `SIGKILL`, sau đó await exit. Không throw lỗi -- đây là cleanup path, không nên throw exception.
- **Process đã killed trước đó:** `kill()` kiểm tra `this.#process.killed` và `this.#isProcessAlive()` -- nếu đã chết thì return ngay.
- **Gọi `kill()` nhiều lần:** An toàn -- kiểm tra process tồn tại trước khi kill. Sau khi set `this.#process = undefined`, lần gọi sau sẽ return ngay.

## Kiểm tra

- Happy path: gọi `kill()`, process nhận SIGTERM và thoát trong timeout, resolve đúng.
- Timeout + SIGKILL: mock process không thoát sau SIGTERM, verify SIGKILL được gọi.
- Double call: gọi `kill()` hai lần, lần thứ hai không throw.
- `cleanup()` async: verify `Connector.cleanup()` trả về Promise và await đúng.
