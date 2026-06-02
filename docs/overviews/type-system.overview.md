# Overview: Hệ thống kiểu (Type System)

## Mục tiêu

Định nghĩa hệ thống type an toàn, rõ ràng cho toàn bộ thư viện, bao gồm:
- Interface public API (`PWChromium`).
- 4 interface cho các nhóm tùy chọn: fingerprint, proxy, profile, fetch.
- Các helper types: `Tag`, `Time`, `IPExtractionMethod`, `PublicIPReplacement`, `PrivateIPReplacement`.

## Kết quả

- 5 file TypeScript trong `src/types/`, tổng cộng 632 dòng (bao gồm JSDoc và comments).
- Mỗi file độc lập, không có circular dependency.
- Tất cả field đều có JSDoc với `@default` value.
- `PWChromium.ts` được re-export trực tiếp từ `src/index.ts`.
- Các type còn lại (`FingerprintOptions`, `ProxyOptions`, `ProfileOptions`, `FetchOptions`) được re-export từ `src/adapter/playwright/chromium.ts`.

## Kiểm tra

- `npm run lint` -- 0 errors, 16 warnings (pre-existing, không liên quan đến types).
- TypeScript compile không lỗi khi dùng `tsc --noEmit` (kiểm tra type consistency).
- Các type được dùng trong codebase (adapter, plugin) đều import đúng đường dẫn.

## Sai lệch so với kế hoạch

| Kế hoạch | Thực tế | Lý do |
|---|---|---|
| Tất cả type export từ `src/types/` | `PWChromium` export từ `types/`, các type còn lại export từ `adapter/playwright/chromium.ts` | `PluginLaunchOptions` được định nghĩa trong adapter, các type fingerprint/proxy/profile được re-export qua adapter để tiện import một chỗ |
| `usePrivateKey` trong `PWChromium` interface | Không có trong interface (chỉ có trong `BrowserEngine` class) | `usePrivateKey` là method của `BrowserEngine`, không phải interface. Interface `PWChromium` chỉ định nghĩa method chính thức |

## Ghi chú kỹ thuật

- `plugin/index.ts` và `plugin/config.ts` cũng có các định nghĩa type nội bộ. Các type này không được export ra ngoài, chỉ dùng trong nội bộ module `plugin/`.
- `IPString` dùng branded type `string & {}` -- đây là kỹ thuật để TypeScript phân biệt IP string với string thông thường. Tại runtime, nó vẫn là string.

---
