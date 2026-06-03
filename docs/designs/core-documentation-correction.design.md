# Design: Hiệu chỉnh tài liệu core theo code thực tế

## Bối cảnh

Tài liệu hiện tại đã có đủ nhóm `design`, `spec`, `plan`, `product`, `overview`, nhưng nhiều file vẫn còn mỏng. Một số đoạn mô tả đúng ý tưởng chung, nhưng chưa giải thích luồng chạy thật trong code. Điều này làm developer mới khó hiểu vì sao mỗi lớp tồn tại và lớp nào gọi lớp nào.

Cụm core là nơi cần sửa trước vì nó là đường đi chính của thư viện: `Chromium` nhận cấu hình từ user, bridge sang Playwright, gọi `FingerprintPlugin`, đi qua `API Connector`, rồi giao tiếp với `RemoteEngine`. Nếu tài liệu của cụm này chưa rõ, các tài liệu nhỏ hơn như proxy, profile, viewport cũng sẽ khó đọc.

Mục tiêu của task này là viết lại tài liệu core theo code thực tế. Tài liệu phải dùng tiếng Việt dễ hiểu, giải thích "tại sao", và không ghi API không tồn tại trong source.

## Câu hỏi làm rõ

- Câu hỏi 1: Nên viết lại toàn bộ tài liệu một lần hay chia theo cụm? → Trả lời: Chia theo cụm core trước để kiểm đúng với code và dễ duyệt.
- Câu hỏi 2: Cụm core gồm những phần nào? → Trả lời: `BrowserEngine`, `Playwright Bridge`, `FingerprintPlugin`, `API Connector`, `RemoteEngine`.
- Câu hỏi 3: Có sửa code trong task này không? → Trả lời: Không. Đây là non-feature task, chỉ sửa tài liệu và roadmap liên quan.
- Câu hỏi 4: Tài liệu cần ưu tiên điều gì? → Trả lời: Đúng với code thực tế, có luồng gọi rõ ràng, có giải thích "tại sao", và có ví dụ copy-paste được.

## Các phương án

### Phương án 1: Viết lại toàn bộ docs trong một lần

Viết lại tất cả file trong `docs/designs`, `docs/specs`, `docs/products`, `docs/overviews`, `docs/plans`.

- Ưu điểm: Có thể đồng bộ toàn bộ tài liệu trong một phiên lớn.
- Nhược điểm: Rất dễ bỏ sót sai lệch vì số lượng file lớn. Khi có lỗi, khó biết lỗi đến từ cụm nào. Cách này cũng khó duyệt vì thay đổi quá rộng.

### Phương án 2: Viết lại cụm core trước

Chỉ xử lý 5 cụm lõi: `BrowserEngine`, `Playwright Bridge`, `FingerprintPlugin`, `API Connector`, `RemoteEngine`.

- Ưu điểm: Bám đúng đường đi chính của hệ thống. Dễ đối chiếu từng docs với từng file source. Có thể dùng làm chuẩn viết cho các cụm còn lại.
- Nhược điểm: Chưa sửa hết toàn bộ tài liệu trong dự án. Cần làm thêm các vòng sau cho proxy, profile, viewport, cleaner, mutex.

### Phương án 3: Viết một feature mẫu trước

Chỉ viết lại một cụm, ví dụ `BrowserEngine`, rồi chờ duyệt style trước khi nhân rộng.

- Ưu điểm: Ít rủi ro, dễ điều chỉnh giọng văn.
- Nhược điểm: Chưa giải quyết được vấn đề lớn nhất là luồng xuyên suốt giữa các lớp core. Nếu chỉ nhìn một file, tài liệu vẫn có thể đúng cục bộ nhưng thiếu bức tranh tổng thể.

## Giải pháp được chọn

- Phương án AI đề xuất: Phương án 2, vì cụm core là luồng chính của thư viện và đủ nhỏ để kiểm kỹ.
- Phương án được chọn: Phương án 2.
- Lý do: Cách này sửa đúng điểm đau hiện tại: tài liệu chưa bám luồng chạy thật. Khi 5 cụm core đã rõ, các vòng sau có thể dựa theo cùng cấu trúc để sửa phần còn lại.
- Ràng buộc hoặc điều kiện kèm theo:
  - Không sửa code trong task này.
  - Không ghi API không tồn tại trong source. Ví dụ docs hiện có nhắc `usePrivateKey()` trong `BrowserEngine`, nhưng `src/adapter/playwright/chromium.ts` hiện không có method này.
  - Mỗi tài liệu cần giải thích "vì sao" bên cạnh "làm gì".
  - Ví dụ code phải có import và không dùng method thiếu trong source hiện tại.
  - Product doc dùng cho người đọc muốn sử dụng hoặc hiểu tính năng. Spec dùng cho người cần đối chiếu kỹ thuật. Design ghi quyết định và lý do chọn hướng sửa.

## Hướng viết lại tài liệu core

Mỗi cụm tài liệu sẽ được viết theo cùng một cách để developer dễ đọc:

1. Mở đầu bằng vai trò thật của cụm đó trong hệ thống.
2. Ghi rõ file source nào là nguồn sự thật.
3. Mô tả luồng chạy theo thứ tự gọi hàm trong code.
4. Liệt kê API public hoặc method quan trọng đúng theo source.
5. Giải thích các quyết định quan trọng, ví dụ vì sao `headless` luôn bị ép về `false`, vì sao profile phải chạy qua thư mục tạm, vì sao `perfectCanvasRequest` dùng timeout `0`.
6. Ghi rõ lỗi, giới hạn, và cleanup để người đọc biết tài nguyên nào được giữ và tài nguyên nào được dọn.
7. Ghi lại sai lệch docs cũ đã sửa để sau này audit lại dễ hơn.

## Luồng core cần thể hiện rõ

Tài liệu sau khi sửa phải giúp người đọc nhìn được luồng chính này:

```txt
BrowserEngine (new instance)
  -> engine.launch()
  -> engine.newContext()
  -> PlaywrightFingerprintPlugin.launchPersistentContext()
  -> FingerprintPlugin._launch(false, options)
  -> api('setup', params)
  -> RemoteEngine.runFunction('setup', params)
  -> FastExecuteScript.exe
```

Luồng cleanup cũng cần được viết rõ:

```txt
engine.quit()
  -> context.close()
  -> engine.cleanup()
  -> browser.close()
  -> connector.cleanup()
  -> engine.kill()
  -> pcapServer.close()
  -> mutex.release()
  -> cleaner.stop()
  -> dataManager.dispose()
```

Hai luồng này quan trọng vì chúng giải thích vì sao task này không thể chỉ sửa từng tài liệu rời rạc. Developer cần hiểu quan hệ giữa các lớp để debug launch, fingerprint, proxy, profile và cleanup.
