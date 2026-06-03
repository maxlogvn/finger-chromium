# Design: BrowserEngine -- Fluent API

## Bối cảnh

`BrowserEngine` là lớp public-facing nằm sau singleton `Chromium`. Đây là điểm vào chính cho user khi muốn cấu hình fingerprint, proxy, profile rồi tạo `BrowserContext` của Playwright.

Source làm nguồn sự thật: `src/adapter/playwright/chromium.ts`. Interface public liên quan nằm ở `src/types/PWChromium.ts`.

Tài liệu cũ mô tả đúng ý tưởng Fluent API, nhưng còn thiếu luồng thật giữa `BrowserEngine` và `PlaywrightFingerprintPlugin`. Một số ví dụ cũng nhắc method đổi key trực tiếp, trong khi class hiện tại không có method đó. Vì vậy tài liệu cần viết lại theo code hiện tại, không theo API dự kiến.

## Câu hỏi làm rõ

- Singleton hay factory? → Singleton `Chromium`, vì engine và profile runtime dùng tài nguyên nền, không nên tạo nhiều instance không kiểm soát.
- Fluent API hay config object? → Fluent API, vì user có thể đọc chuỗi cấu hình theo đúng thứ tự: fingerprint, proxy, profile, launch, context.
- Cho phép `launch()` nhiều lần không? → Không. `launch()` chỉ chuẩn bị engine một lần. Nếu gọi lại, trạng thái profile và context có thể bị lẫn.
- Key bảo mật lấy từ đâu? → Từ `process.env.BABLOSOFT_KEY` qua constant `PRIVATE_KEY`. Code hiện không có method public để đổi key trên `BrowserEngine`.

## Các phương án

### Phương án 1: Truyền toàn bộ config vào `launch()`

```ts
await Chromium.launch({
  fingerprint,
  proxy,
  profile,
});
```

- Ưu điểm: Tất cả cấu hình nằm trong một object.
- Nhược điểm: Dễ biến `launch()` thành method quá tải. User khó đọc hơn vì fingerprint, proxy, profile có option riêng và ý nghĩa riêng.

### Phương án 2: Fluent API qua singleton `Chromium`

```ts
const context = await Chromium
  .useFingerprint(fingerprintData)
  .useProxy('http://user:pass@host:port')
  .useProfile('./profiles/user_01')
  .launch()
  .newContext();
```

- Ưu điểm: Luồng đọc giống luồng chạy thật. Mỗi method chỉ giữ một trách nhiệm nhỏ.
- Nhược điểm: User phải gọi đúng thứ tự. `launch()` phải có guard để tránh gọi lại.

### Phương án 3: Factory tạo instance mới cho mỗi session

```ts
const browser = createChromium();
```

- Ưu điểm: Dễ cô lập nhiều session hơn.
- Nhược điểm: Không khớp thiết kế hiện tại. Engine, cleaner, PCAP server và thư mục runtime đang được quản lý theo singleton.

## Giải pháp được chọn

- Phương án AI đề xuất: Phương án 2.
- Phương án được chọn: Phương án 2.
- Lý do: Fluent API khớp cách code hiện tại lưu cấu hình trong field riêng rồi đẩy xuống `PlaywrightFingerprintPlugin` tại `launch()`.
- Ràng buộc hoặc điều kiện kèm theo:
  - `launch()` chỉ được gọi một lần cho mỗi vòng đời.
  - `newContext()` chỉ được gọi sau `launch()`.
  - Mỗi instance chỉ giữ một `BrowserContext`. Muốn tạo context mới thì gọi `quit()` trước.
  - `useProfile()` map profile sang thư mục tạm để tránh ghi trực tiếp vào profile gốc khi browser đang chạy.
  - `quit()` phải gọi `engine.cleanup()` vì đóng context chưa đủ để dọn worker, engine process, PCAP server, cleaner và mutex.

## Luồng thiết kế

Luồng chính của `BrowserEngine`:

```txt
Chromium.useFingerprint/useProxy/useProfile
  -> BrowserEngine.launch()
  -> PlaywrightFingerprintPlugin.setServiceKey()
  -> PlaywrightFingerprintPlugin.setWorkingFolder()
  -> PlaywrightFingerprintPlugin.useProfile/useProxy/useFingerprint()
  -> BrowserEngine.newContext()
  -> PlaywrightFingerprintPlugin.launchPersistentContext()
```

`BrowserEngine` không tự spawn browser. Nó chỉ gom cấu hình và gọi bridge Playwright. Việc setup fingerprint thật nằm sâu hơn ở `FingerprintPlugin._launch()` và `RemoteEngine`.

Luồng dọn dẹp:

```txt
Chromium.quit()
  -> context.close()
  -> AdapterDataManager.map(runtimeProfile, targetProfile)
  -> engine.cleanup()
  -> AdapterDataManager.dispose()              // chỉ xoá temp dir của instance
```

Thứ tự này quan trọng. Context cần đóng trước để dữ liệu profile ngừng thay đổi. Sau đó mới lưu profile và dọn engine nền.
