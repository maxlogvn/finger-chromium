# Spec: File Cleanup Daemon

## Mô tả

Daemon dọn file tạm, chạy timer 15s.

## Config

| Option | Default | Mô tả |
|---|---|---|
| `interval` | 15000 | Timer interval (ms) |
| `cleanDir` | `BROWSER_RUNNING_DIR` | Thư mục dọn |
| `ignorePatterns` | `[]` | Pattern bỏ qua |
| `includePatterns` | `[]` | Pattern bao gồm |

## Lock check

Dùng `proper-lockfile.check(path)` trước khi delete.
File đang lock → bỏ qua.

---

Xem thêm: [Design](../designs/file-cleanup-daemon.design.md) | [Plan](../plans/file-cleanup-daemon.plan.md)
