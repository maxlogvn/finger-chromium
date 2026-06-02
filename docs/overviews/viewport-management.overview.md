# Overview: Quản lý Viewport

## Mục tiêu

Resize viewport browser qua CDP để khớp với fingerprint, đồng bộ availWidth/availHeight vào file .ini của engine.

## Kết quả

- `src/plugin/browser.ts`: CDP resize cho standalone mode (88 dòng).
- `src/plugin/config.ts`: configure + synchronize (86 dòng).
- `src/adapter/playwright/utils.ts` (phần viewport): CDP resize cho Playwright bridge mode.

## Kiểm tra

- `npm run lint` -- 0 errors (1 pre-existing warning `no-explicit-any` tại utils.ts:70).

## Sai lệch so với kế hoạch

Không có sai lệch.

## Ghi chú kỹ thuật

### Hai implementation của setViewport

| File | Cách kết nối CDP | Dùng khi nào |
|---|---|---|
| `plugin/browser.ts` | `chrome-remote-interface` connect trực tiếp | Standalone mode |
| `adapter/playwright/utils.ts` | `page.context().newCDPSession(page)` | Playwright bridge mode |

Cả 2 cùng thuật toán delta correction. Cần maintain song song -- khi sửa 1 file phải sửa cả 2.

### Delta correction algorithm

- Delta mặc định: `{ width: 16, height: 88 }` -- window chrome Chromium trên Windows.
- Loop tối đa `MAX_RESIZE_RETRIES = 3` lần.
- Mỗi lần sai: `delta += (expected - actual)` cho từng chiều.
- Nếu lần cuối vẫn sai: `console.warn('[Fingerprint] Không thể đặt kích thước viewport chính xác.')` (ở playwright/utils.ts) hoặc `console.warn('Không thể đặt kích thước viewport chính xác.')` (ở plugin/browser.ts).

### BAS_NOT_SET

`BAS_NOT_SET = -170141183460469231731687303715884105727` -- `int128` min value trong C/C++. Không thể nhầm lẫn với kích thước viewport thật (luôn dương).

### setTimeout(2000) trong synchronize

Delay 2s giữa phase 1 và phase 2. Nếu `quit()` được gọi ngay sau `configure()`, phase 2 chưa kịp chạy -> file .ini giữ giá trị `BAS_NOT_SET`. Cần refactor để không dùng hardcoded delay.

### waitForResize potential hang

Script dùng `ResizeObserver` + double `requestAnimationFrame` -- không có timeout. Nếu resize không xảy ra (browser treo), promise treo vô hạn, `setViewport()` không resolve.

---
