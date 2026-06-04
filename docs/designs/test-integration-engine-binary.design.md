# Design: Integration test với engine binary thật FastExecuteScript.exe

## Bối cảnh

Hiện tại 162 test đều là unit/hybrid — không có test nào gọi engine thật (`FastExecuteScript.exe`). Pipeline download -> extract -> spawn -> `runFunction('ping', {})` chưa bao giờ được verify. Nếu bablosoft thay đổi API, checksum, URL, hoặc nếu code bị hỏng ở tầng spawn/IPC, tất cả tests vẫn pass xanh nhưng library fail hoàn toàn khi chạy thật.

## Câu hỏi làm rõ

- **Engine có chạy được mà không cần PCAP server không?** Không. Engine yêu cầu PCAP server (TCP mock) để kết nối khi spawn với `--mock-pcap-port`. Phải chạy PCAP server trước.
- **Có cần `BABLOSOFT_KEY` để gọi `ping` không?** Cần. `ping` là API function của bablosoft engine, cần key để authenticate. Nếu không có key, engine trả về lỗi "key is missing".
- **Integration test có cần clean PCAP server state giữa các test không?** PCAP server dùng `once()` — chỉ init một lần. Nếu test trước đã listen, test sau dùng chung port. Không ảnh hưởng.
- **Download engine có mất nhiều thời gian không?** Có. Engine binary ~20-50 MB, download + extract có thể mất 30-120 giây tuỳ network.
- **Test có cần cleanup file engine đã download không?** Nếu dùng temp directory, nên cleanup để tránh tốn disk. Nếu dùng thư mục data mặc định (`CWD = path.join(process.cwd(), 'data')`), không cleanup vì test khác có thể reuse.

## Các phương án

### Phương án 1: Integration test riêng trong `tests/connector.test.ts`

Thêm `describe('Integration — engine thật')` vào cuối file `connector.test.ts`, sau tất cả unit test. Dùng `before` hook để setup PCAP server và temp directory. Dùng `it.skip` khi `BABLOSOFT_KEY` không được set.

- **Ưu điểm:** Tận dụng cùng file, không cần thêm config. Chung PCAP server instance.
- **Nhược điểm:** File đã dài (515 dòng). Integration test cần timeout lớn hơn (120s vs 30s hiện tại). Ảnh hưởng đến `--exit` behavior.

### Phương án 2: File integration test riêng `tests/integration-connector.test.ts`

Tạo file riêng cho integration test. Copy/duplicate PCAP server listen pattern. Setup cục bộ với temp directory isolation.

- **Ưu điểm:** Tách biệt rõ ràng. Timeout riêng (có thể tăng trong `.mocharc.yml` hoặc dùng `this.timeout()`). Không ảnh hưởng unit test.
- **Nhược điểm:** Duplicate code PCAP server setup. Tốn thêm file management.

### Phương án 3: Directory integration riêng `tests/integration/engine.test.ts`

Tạo thư mục `tests/integration/` riêng, với helper function chung để setup PCAP + temp dir. Dùng mocha `--timeout` riêng cho integration tests. Có thể config qua `.mocharc.integration.yml` hoặc npm script riêng.

- **Ưu điểm:** Clean separation, có thể chạy riêng (`npm run test:integration`). Helper tái sử dụng được.
- **Nhược điểm:** Overhead config. Cần thêm npm script. Phức tạp hơn mức cần thiết cho task này.

## Giải pháp được chọn

- **Phương án AI đề xuất:** Phương án 2 — File integration test riêng `tests/integration-connector.test.ts`.
  - Lý do: File connector.test.ts đã 515 dòng, thêm integration test sẽ làm file quá dài và timeout khác biệt gây rối. File riêng cho phép đặt timeout cao (120s) mà không ảnh hưởng unit test. Pattern đơn giản, không cần thêm npm script — mocha tự động pick file theo pattern `tests/**/*.ts`.
- **Phương án được chọn:** (do người duyệt điền)
- **Lý do:** (do người duyệt điền)
- **Ràng buộc hoặc điều kiện kèm theo:**
  - `BABLOSOFT_KEY` phải được set trong environment để test chạy.
  - PCAP server phải được start trước (reuse `once()` pattern).
  - Temp directory được cleanup sau mỗi test suite.
  - Timeout 120s cho toàn bộ integration describe block.
