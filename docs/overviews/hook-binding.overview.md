# Overview: Hook Binding

File: `src/adapter/playwright/utils.ts` (124 dòng).

## Lưu ý kỹ thuật

- Có 2 implementation của `setViewport`: một trong `plugin/browser.ts` (dùng `chrome-remote-interface`) và một trong `adapter/utils.ts` (dùng `page.context().newCDPSession`). Chúng khác nhau ở cách kết nối CDP nhưng cùng thuật toán delta correction.
- `isBrowser()` type guard kiểm tra `'version' in target && typeof target.version === 'function'` -- đây là heuristic, có thể sai nếu object có property version function.
- `resetOptions()` dùng spread operator để merge `viewport: null` vào options. Nếu options có `viewport` khác null, nó sẽ bị override.
- `patchPage` proxy `setViewportSize` in warning bằng tiếng Việt: "Khong the thay doi viewport: kich thuoc da bi khoa boi fingerprint". Đây là UX decision -- warning thay vì throw error để không crash page.
