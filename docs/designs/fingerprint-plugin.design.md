# Design: FingerprintPlugin -- Core orchestrator

## Bối cảnh

`FingerprintPlugin` là lõi điều phối của thư viện. Nó nhận cấu hình fingerprint, proxy, profile, gọi service qua `API Connector`, spawn `worker.exe`, rồi cấu hình browser sau khi mở.

Source làm nguồn sự thật: `src/plugin/index.ts`. Helper liên quan nằm ở `src/plugin/utils.ts` và `src/plugin/config.ts`.

`BrowserEngine` và `PlaywrightFingerprintPlugin` đều đi xuống lớp này. Vì vậy docs của `FingerprintPlugin` phải giải thích đủ rõ lifecycle, nếu không developer sẽ khó debug các lỗi launch, setup, profile hoặc cleanup.

## Câu hỏi làm rõ

- `FingerprintPlugin` có phải public API không? → Có thể dùng trực tiếp, nhưng thường được dùng qua `PlaywrightFingerprintPlugin` hoặc singleton `plugin`.
- Fluent API hay config object? → Fluent API, vì fingerprint, proxy, profile và browser version có vòng đời riêng.
- Có cần singleton không? → Có export `plugin` singleton để bridge Playwright dùng mặc định.
- Có hỗ trợ launcher custom không? → Có, qua constructor hoặc `static create()`.
- `spawn()` khác bridge Playwright thế nào? → `spawn()` dùng launcher mặc định và trả `Browser`; bridge gọi `_launch(false, options)` để trả `BrowserContext`.

## Các phương án

### Phương án 1: Đưa toàn bộ logic vào Playwright Bridge

Bridge tự validate config, gọi API, spawn browser, resize viewport và cleanup.

- Ưu điểm: Ít lớp hơn khi đọc riêng Playwright.
- Nhược điểm: Logic fingerprint bị khóa vào Playwright. Khó dùng launcher khác và dễ duplicate cleanup.

### Phương án 2: Tách plugin core và bridge

`FingerprintPlugin` giữ lifecycle core. Bridge chỉ chuyển đổi sang API Playwright.

- Ưu điểm: Lifecycle setup/spawn/configure/cleanup nằm một nơi. Bridge nhỏ hơn và dễ kiểm.
- Nhược điểm: Cần hiểu `_launch()` khi debug sâu.

### Phương án 3: Chỉ dùng API Connector trực tiếp

Caller tự gọi `api('setup')`, tự spawn browser và tự cleanup.

- Ưu điểm: Linh hoạt nhất.
- Nhược điểm: Caller phải biết quá nhiều chi tiết engine. Dễ leak process hoặc sai profile path.

## Giải pháp được chọn

- Phương án AI đề xuất: Phương án 2.
- Phương án được chọn: Phương án 2.
- Lý do: Tách plugin core giúp giữ lifecycle fingerprint ở một nơi, trong khi Playwright Bridge chỉ lo tương thích API Playwright.
- Ràng buộc hoặc điều kiện kèm theo:
  - Config methods phải validate input bằng `validateConfig()`.
  - `_launch()` là protected method vì caller bên ngoài không nên tự bỏ qua lifecycle.
  - `headless` bị ép về `false` khi spawn để giảm rủi ro bị fingerprint check phát hiện headless.
  - Cleanup phải đóng browser trước, rồi mới dọn connector, mutex và cleaner.

## Lifecycle được chọn

```txt
useFingerprint/useProxy/useProfile/useBrowserVersion
  -> fetch()/versions() nếu cần dữ liệu service
  -> spawn() hoặc Playwright Bridge gọi _launch()
  -> api('setup')
  -> cleaner + mutex
  -> spawn worker.exe
  -> configure + synchronize
  -> cleanup()
```

`_launch()` có hai chế độ:

- `useDefaultLauncher = true`: dùng launcher mặc định từ `src/plugin/launcher`.
- `useDefaultLauncher = false`: dùng launcher custom, thường là launcher proxy từ Playwright Bridge.

Thiết kế này giúp cùng một lifecycle setup engine có thể phục vụ cả browser launcher mặc định và Playwright persistent context.
