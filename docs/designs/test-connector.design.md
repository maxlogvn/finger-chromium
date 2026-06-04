# Design: Test Connector (RemoteEngine + Connector + PCAP)

## Bối cảnh

Ba module `connector/engine.ts` (RemoteEngine), `connector/index.ts` (Connector), và `connector/pcapServer/index.ts` (PCAP server) là tầng giao tiếp cốt lõi với binary engine của bablosoft. Hiện tại chưa có test nào cho các module này. Cần viết test để đảm bảo:

- RemoteEngine: tải/giải nén engine, file-based IPC, quản lý vòng đời process.
- Connector: wrapper API, xử lý lỗi (MissingKeyError, PluginError), lazy init PCAP.
- PCAP server: xử lý lệnh binary `0x01` (request ID) và `0x07` (heartbeat).

## Câu hỏi làm rõ

- Có nên dùng sinon để mock hay mock thủ công? → Dùng mock thủ công (factory functions + class overrides) để tránh phụ thuộc thêm thư viện.
- Có cần test tích hợp với engine thật không? → Skip bằng `it.skip` — chỉ chạy khi có engine binary. Không yêu cầu cho đợt này.
- File test đặt ở đâu? → `tests/connector.test.ts` như roadmap đã định.

## Các phương án

### Phương án 1: Hybrid (Khuyên dùng)
Unit test PCAP server với TCP thật (random port), mock các dependencies nặng (axios, chokidar, execFile) cho RemoteEngine và Connector.

- **Ưu điểm:** Nhanh, cô lập, coverage cao, không cần network/engine thật.
- **Nhược điểm:** Cần mock nhiều — phải đảm bảo mock đúng behavior của chokidar và child_process.

### Phương án 2: Full Integration
Tải engine thật từ bablosoft, spawn FastExecuteScript.exe, gọi IPC thật. Dùng `before` hook download một lần, chạy nhiều test case.

- **Ưu điểm:** Test đúng behavior thật, không miss lỗi do mock sai.
- **Nhược điểm:** Chậm (~30s mỗi lần chạy), cần network, dễ fail nếu server bablosoft down, không phù hợp CI.

### Phương án 3: Unit tối thiểu
Chỉ test public methods (Connector.api, RemoteEngine.runFunction, pcapServer.listen/close) với mock tối giản.

- **Ưu điểm:** Dễ viết nhanh.
- **Nhược điểm:** Coverage thấp, bỏ sót edge cases (download fail, checksum mismatch, EADDRINUSE retry, process kill timeout).

## Giải pháp được chọn

- **Phương án AI đề xuất:** Phương án 1 (Hybrid) vì cân bằng giữa coverage, tốc độ, và độ tin cậy.
- **Phương án được chọn:** Phương án 1 (Hybrid) — đã được người duyệt chọn.
- **Lý do:** Nhanh, cô lập, không phụ thuộc network, phù hợp chạy trong CI.
- **Ràng buộc hoặc điều kiện kèm theo:**
  - Dùng mock thủ công (class overrides + factory functions), không thêm sinon.
  - PCAP server test với TCP thật (net.Socket — không mock).
  - RemoteEngine test mock axios, chokidar, child_process.
  - Connector test mock RemoteEngine + pcapServer.
  - Integration test (engine thật) dùng `it.skip` — triển khai sau.
