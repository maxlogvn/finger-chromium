# Design: Bug #7 — Singleton `Chromium` không hỗ trợ launch nhiều profile song song

## Bối cảnh

`BrowserEngine` (export qua biến `Chromium` singleton) chỉ cho phép `launch()` một lần trong vòng đời.
Test `multi_context.ts` gọi `launchBrowserWithProfile()` cho 2 profile khác nhau trên cùng instance,
dẫn đến lỗi "Phuong thuc launch() chi duoc goi mot lan."

**Nguyên nhân gốc:** Singleton design + mutation-based config (`useProfile`, `useFingerprint`, `useProxy`
ghi đè lên cùng instance state) không cho phép nhiều session độc lập.

**Kiểm tra tầng bên dưới phát hiện:**
- `connector/index.ts` là singleton (`engine`, `lock` là module-level) — `AsyncLock('client')` đảm bảo
  chỉ một request API được xử lý tại một thời điểm.
- `engine.kill()` trong `cleanup()` là global — một `quit()` sẽ giết engine process, ảnh hưởng đến
  session khác.
- `serviceKey` trong `plugin/index.ts` là biến module, không phải instance variable.

=> **Thật sự không thể chạy nhiều session song song** ở tầng engine binary (Worker.exe là single process).

## Câu hỏi làm rõ

- Có cần hỗ trợ parallel session thật sự không? => Engine binary chỉ hỗ trợ 1 session tại 1 thời điểm
  => parallel là bất khả thi ở tầng hiện tại.
- Có thể refactor connector thành non-singleton không? => Rất phức tạp, cần thay đổi toàn bộ
  RemoteEngine, PCAP server, async-lock — không nằm trong scope bug fix này.
- Người dùng thực tế có cần chạy 2 browser profile song song không? => Test là use case duy nhất.

## Các phương án

### Phương án 1: Factory method (`BrowserEngine.create()`) + giữ singleton

Thêm static method `BrowserEngine.create()` trả về instance mới độc lập.
`Chromium` singleton vẫn được giữ cho use case đơn giản.
Test dùng `BrowserEngine.create()` thay vì `Chromium`.

**Ưu điểm:**
- API sạch, non-breaking, cho phép "create" instance riêng cho mỗi profile.
- Giữ được Backward compatibility.

**Nhược điểm:**
- Tầng dưới (connector, engine) vẫn là singleton — "instance mới" thực chất vẫn dùng chung engine,
  async-lock, PCAP server. Người dùng dễ bị nhầm tưởng là truly independent.
- `cleanup()` của instance này có thể ảnh hưởng đến instance khác (vì `connectorCleanup()` là global).
- Cần refactor `serviceKey` từ global sang instance variable.

### Phương án 2: Hỗ trợ launch lại sau quit + state reset + sequential test

Sửa `BrowserEngine` để hỗ trợ vòng đời: launch -> use -> quit -> launch (với config mới).
Test chạy tuần tự: profile 1 -> quit -> profile 2 -> quit (không song song).

**Cụ thể:**
- `launch()`: Giữ guard kiểm tra `isLaunched`, nhưng `quit()` set `isLaunched = false` + reset toàn bộ
  state để `launch()` tiếp theo hoạt động bình thường.
- `newContext()`: Bỏ check "context đã được tạo" hoặc cho phép tạo lại sau `quit()`.
- `quit()`: Reset `this.context`, `this.isLaunched`, `this.options` về mặc định.
- Fix test `multi_context.ts` chạy tuần tự.

**Ưu điểm:**
- Phù hợp với thực tế kiến trúc (engine/connector singleton, không thể parallel).
- Thay đổi tối thiểu, trọng tâm vào chính Bug #7.
- Không tạo illusion "instance độc lập".

**Nhược điểm:**
- Test không còn song song => mất coverage cho use case multi-context.
- Vẫn giữ singleton design có thể gây nhầm lẫn người dùng.

### Phương án 3: Xoá singleton, export class trực tiếp

Xoá `const Chromium = new BrowserEngine()`. Export `BrowserEngine` class.
Người dùng tự tạo instance: `new BrowserEngine()`.
Test tự tạo instance riêng cho mỗi profile.

**Ưu điểm:**
- Thiết kế trong sáng, mỗi instance là độc lập.
- Đúng với "convention over configuration".

**Nhược điểm:**
- **Breaking change** — toàn bộ code người dùng dùng `Chromium` sẽ hỏng.
- Cần refactor nhiều chỗ: `src/index.ts`, `adapter/playwright/utils.ts`, `adapter/playwright/engine.ts`.
- Tầng dưới connector vẫn là singleton => vẫn không thật sự độc lập.

## Giải pháp được chọn

- **Phương án AI đề xuất:** **Phương án 2** (hỗ trợ launch lại sau quit + sequential test).
- **Lý do:**
  1. Thay đổi tối thiểu, giải quyết đúng nguyên nhân gốc: singleton chỉ cho `launch()` 1 lần.
  2. Phù hợp với kiến trúc thực tế: engine/connector là singleton, parallel là bất khả thi.
  3. Không breaking change, người dùng cũ không bị ảnh hưởng.
  4. `quit()` đã có logic set `this.isLaunched = false` nhưng chưa reset state các field khác.
- **Phương án được chọn:** Phương án 3 (xoá singleton, export class trực tiếp)
- **Lý do:** Người dùng lựa chọn — thiết kế trong sáng, mỗi instance độc lập, test có thể tạo nhiều instance riêng.
- **Ràng buộc:** Là breaking change — cần cập nhật toàn bộ import và cách dùng `Chromium` thành `new BrowserEngine()`.
  Tầng dưới (connector/engine) vẫn là singleton — không refactor.
