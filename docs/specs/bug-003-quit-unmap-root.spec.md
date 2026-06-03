# Spec: Bug #3 — `quit()` xoá toàn bộ `BROWSER_RUNNING_DIR`

> Tuân thủ quy ước code tại [CONVENTIONS.md](../CONVENTIONS.md).

## Mô tả

`BrowserEngine.quit()` hiện tại gọi `this.dataManager.unmap(BROWSER_RUNNING_DIR)` — xoá toàn bộ thư mục gốc `.tmp/browser/running/` thay vì chỉ xoá thư mục tạm của instance hiện tại. Hậu quả: các instance `BrowserEngine` khác đang chạy song song bị mất temp dir, dẫn đến mất dữ liệu profile runtime và crash.

## Yêu cầu

- `quit()` chỉ xoá thư mục tạm của instance hiện tại (`instanceTempDir`).
- `quit()` không ảnh hưởng đến thư mục tạm của instance khác.
- Không thay đổi hành vi của `unmap()` — nó vẫn xoá bất kỳ đường dẫn nào được truyền vào.
- Backward compatible: tất cả test hiện tại vẫn pass.

## Thiết kế

Tham chiếu design: `docs/designs/bug-003-quit-unmap-root.design.md`

Phương án được chọn: dùng `this.dataManager.dispose()` thay vì `this.dataManager.unmap(BROWSER_RUNNING_DIR)`.

`dispose()` là method có sẵn của `AdapterDataManager` (dòng 80, `data.ts`), gọi `unmap(this.instanceTempDir)` — chỉ xoá `instanceTempDir` (vd: `.tmp/browser/running/profile/1712345678_a1b2`), không xoá thư mục gốc.

## API / Data flow

Không có thay đổi API public. Thay đổi nội bộ:

```
Trước: quit() → unmap(BROWSER_RUNNING_DIR)     → xoá .tmp/browser/running/
Sau:   quit() → dispose()                       → xoá .tmp/browser/running/profile/{timestamp}_{hex}/
```

## Components

| File | Sửa | Chi tiết |
|---|---|---|
| `src/adapter/playwright/chromium.ts:211` | Sửa 1 dòng | `this.dataManager.unmap(BROWSER_RUNNING_DIR)` → `this.dataManager.dispose()` |

## Xử lý lỗi

Không có lỗi mới phát sinh. `dispose()` (và `unmap()` bên trong) đã có xử lý:
- Thư mục không tồn tại → `console.warn` và return.
- Lỗi filesystem → throw `Error` với message mô tả.

## Kiểm tra

- Happy path: `quit()` chỉ xoá `instanceTempDir`, không xoá `BROWSER_RUNNING_DIR`.
- Edge case: gọi `quit()` nhiều lần — lần đầu xoá temp dir, lần sau `dispose()` bỏ qua vì thư mục đã hết.
- Error case: không có (thay đổi tối thiểu, không throw lỗi mới).
