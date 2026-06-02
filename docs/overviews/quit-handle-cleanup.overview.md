# Overview: Fix quit() không dọn dẹp hết handles

## Tóm tắt

Đã mở rộng `quit()` để dọn dẹp toàn bộ tài nguyên nền: worker.exe, engine process, PCAP server, cleaner timer, mutex. Node.js process có thể thoát tự nhiên sau quit.

## Kết quả thực hiện

| Step | Kế hoạch | Thực tế | Sai lệch |
|---|---|---|---|
| 1 | engine.ts: process ref + kill() | Done | Không có |
| 2 | pcapServer: server ref + close() | Done | Không có |
| 3 | connector: cleanup() | Done | Không có |
| 4 | cleaner: stop() + unlock | Done | Không có |
| 5 | mutex: release() | Done | Không có |
| 6 | plugin: browser ref + cleanup() | Done | Không có |
| 7 | PlaywrightFingerprintPlugin override | Bỏ qua | Không cần -- plugin.cleanup() đã xử lý |
| 8 | chromium.ts: quit() mở rộng | Done | Không có |

## Sai lệch đáng chú ý

- **Bỏ `isConnected()` check:** `Browser` interface không có method này. Thay bằng try/catch: `this.browser.close().catch(() => {})`.
- **Bỏ Step 7:** PlaywrightFingerprintPlugin override không cần thiết.

## Tài liệu liên quan

- `docs/designs/quit-handle-cleanup.design.md`
- `docs/specs/quit-handle-cleanup.spec.md`
- `docs/plans/quit-handle-cleanup.plan.md`

## Ghi chú

- Lint: 0 errors. Build: success.
- Thứ tự cleanup quan trọng: browser (worker.exe) trước, engine sau, cleaner cuối.
