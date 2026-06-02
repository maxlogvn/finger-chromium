# Design: Hook Binding

## Bối cảnh

Khi fingerprint được inject vào browser, viewport bị lock ở kích thước nhất định. Nếu người dùng hoặc Playwright tự động gọi `setViewportSize` (ví dụ khi tạo page mới với defaultViewport), viewport sẽ thay đổi -- gây sai lệch fingerprint.

Cần intercept (proxy) các method Playwright để đảm bảo:
1. `newContext()` và `newPage()` luôn tạo page với viewport null (kích thước thật).
2. `setViewportSize()` không thể thay đổi viewport sau khi đã set.
3. Page mới được tạo tự động resize đúng kích thước fingerprint.

Ngoài ra, cần cleanup handler để dọn dẹp khi browser/context đóng.

## Câu hỏi làm rõ

- Ai gọi bindHooks? → PlaywrightFingerprintPlugin.configure().
- Có cần proxy Browser.newContext không? → Có, nếu target là Browser (không phải BrowserContext).
- Làm sao biết target là Browser hay BrowserContext? → Dùng `isBrowser()` check `version` property.

## Các phương án

### Phương án 1: Dùng Playwright event listeners
Dùng `context.on('page', handler)` thay vì proxy.

- Ưu điểm: Đơn giản, không can thiệp vào prototype.
- Nhược điểm: Không intercept được `setViewportSize`. Không chặn được `newContext` options.

### Phương án 2: Proxy method (chọn)
Dùng JavaScript `Proxy` để wrap `newContext`, `newPage`, `setViewportSize`.

- Ưu điểm: Kiểm soát hoàn toàn -- chặn setViewportSize, reset viewport null, hook onPageCreated.
- Nhược điểm: Can thiệp sâu vào đối tượng Playwright. Rủi ro nếu Playwright thay đổi internal API.

### Phương án 3: CDP-based intercept
Không proxy, dùng CDP để chặn resize.

- Ưu điểm: Tách biệt khỏi Playwright API.
- Nhược điểm: CDP không có event cho setViewportSize. Không biết khi nào page mới được tạo.

## Giải pháp được chọn

- Phương án AI đề xuất: Phương án 2 (Proxy method).
- Phương án được chọn: Phương án 2.
- Lý do: Kiểm soát toàn diện viewport lifecycle. `Proxy` pattern không ảnh hưởng đến đối tượng gốc.
- Ràng buộc: Reset viewport = `null` khi tạo context/page mới. onPageCreated hook được gọi sau khi page thật sự được tạo.
