# Design: Hệ thống kiểu (Type System)

## Bối cảnh

Thư viện cần cung cấp TypeScript types cho người dùng: interface chính `PWChromium` (fluent API), và các option type `FingerprintOptions`, `ProxyOptions`, `ProfileOptions`, `FetchOptions`. Các type này được dùng bởi cả code nội bộ và người dùng cuối.

## Câu hỏi làm rõ

- Nên để type trong file riêng hay gộp chung? → File riêng, tránh circular dependency, dễ maintain.
- `PWChromium` có nên là class hay interface? → Interface, vì implementation là `BrowserEngine` class.
- Có cần export tất cả type không? → Chỉ export public types. Internal types giữ internal.

## Các phương án

### Phương án 1: Gộp tất cả type vào một file

- Ưu điểm: Dễ tìm, chỉ một file.
- Nhược điểm: File lớn, khó maintain, circular dependency tiềm ẩn.

### Phương án 2: Tách thành 5 file riêng (chọn)

- Ưu điểm: Mỗi file một trách nhiệm, dễ maintain, dễ import.
- Nhược điểm: Nhiều file, cần quản lý import.

## Giải pháp được chọn

- **Phương án AI đề xuất:** Phương án 2 (5 files riêng).
- **Phương án được chọn:** Phương án 2.
- **Lý do:** Giúp codebase sạch, dễ mở rộng, tránh circular dependency.
- **Cấu trúc:**
  - `PWChromium.ts` — Interface chính, fluent API methods.
  - `fingerprint.ts` — `FingerprintOptions`.
  - `proxy.ts` — `ProxyOptions` (WebRTC, DNS, IP detection,...).
  - `profile.ts` — `ProfileOptions` (loadProxy, loadFingerprint).
  - `fetch.ts` — `FetchOptions` (tags, timeLimit, browser version,...).

### Chi tiết kỹ thuật

**`IPString = string & {}`:** Dùng kỹ thuật branded type để tạo type riêng cho IP string. `string & {}` là intersection với empty object type, tạo ra subtype của `string` có thể phân biệt với `string` thường ở compile time. Điều này giúp type-safe hơn khi truyền tham số — function nhận `IPString` sẽ báo lỗi nếu truyền `string` thường, tránh nhầm lẫn giữa IP và các giá trị chuỗi khác.

**`PWChromium` là interface, không phải class:** Implementation là `BrowserEngine` class (`src/adapter/playwright/chromium.ts`). Dùng interface giúp tách contract ra khỏi implementation, cho phép thay đổi implementation mà không ảnh hưởng đến người dùng. Người dùng dùng `new BrowserEngine()` để tạo instance. `Chromium` là alias class cho backward compatibility.
