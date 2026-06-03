# Design: Bug #11 — `defaultLauncher` mutable state

## Bối cảnh

`src/adapter/playwright/engine.ts` có `defaultLauncher` là object khởi tạo ở module scope — global mutable state dùng chung cho mọi instance `PlaywrightFingerprintPlugin`. Khi unit test với launcher mock, state này không thể thay thế được vì đã được khởi tạo tại thời điểm import module. Ảnh hưởng đến khả năng test `BrowserEngine` và `PlaywrightFingerprintPlugin` một cách độc lập.

## Câu hỏi làm rõ

- Có cần giữ backward compatibility cho `new BrowserEngine()` không? → Có, constructor không tham số vẫn phải hoạt động.
- `defaultLoader` (trong `loader.ts`) có cần thay đổi không? → Không, nó chỉ chứa config strings, không có side-effect.

## Các phương án

### Phương án 1: Factory function + inject qua constructor (Khuyến nghị)

Xoá `defaultLauncher` và `browserType` khỏi module scope. Thay bằng `createDefaultLauncher()` function. `BrowserEngine` constructor nhận `launcher?` param.

- **Ưu điểm:**
  - Không còn global mutable state
  - Unit test inject được mock launcher trực tiếp qua constructor
  - Backward compatible — không tham số vẫn hoạt động nhờ factory
- **Nhược điểm:**
  - `Loader.load()` gọi `require()` mỗi lần tạo default — nhưng đây là singleton internally nên chỉ tốn lần đầu

### Phương án 2: Lazy getter cho defaultLauncher

Giữ cấu trúc hiện tại, chuyển `defaultLauncher` thành getter (lazy init) và thêm param launcher vào `BrowserEngine`.

- **Ưu điểm:** Đơn giản, ít thay đổi
- **Nhược điểm:** `browserType` vẫn load ở module scope (side-effect khi import)

## Giải pháp được chọn

- **Phương án AI đề xuất:** Phương án 1 — Factory function + inject qua constructor
- **Phương án được chọn:** Phương án 1
- **Lý do:** Dứt điểm, không còn global mutable state, không còn side-effect khi import
- **Ràng buộc:** `BrowserEngine` constructor không tham số vẫn hoạt động (default launcher từ factory)
