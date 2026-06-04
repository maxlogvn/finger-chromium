# Plan: Integration test với engine binary thật FastExecuteScript.exe

## Các bước thực hiện

- [ ] Bước 1: Tạo file `tests/integration-connector.test.ts` với boilerplate
    - Làm gì: Tạo file test mới, thêm `import` cho mocha + assert + path + fs + pcapServer + RemoteEngine.
    - File liên quan: `tests/integration-connector.test.ts` (tạo mới)
    - Ghi chú: Dùng ESM import như các file test khác. Import `pcapServer` để lấy port, import `RemoteEngine` trực tiếp.

- [ ] Bước 2: Viết `before()` + `after()` hooks
    - Làm gì: Trong `before()`: tạo temp directory (`fs.mkdtemp`), start PCAP server (`pcapServer.listen()`), set timeout (`this.timeout(120000)`). Trong `after()`: cleanup temp directory (`fs.rm`). Không close PCAP server.
    - File liên quan: `tests/integration-connector.test.ts`
    - Phụ thuộc: Yêu cầu bước 1 hoàn thành.

- [ ] Bước 3: Viết `describe()` với `describe.skip` khi thiếu `BABLOSOFT_KEY`
    - Làm gì: Dùng ternary: `process.env.BABLOSOFT_KEY ? describe(...) : describe.skip(...)`. Toàn bộ integration test nằm trong block này.
    - File liên quan: `tests/integration-connector.test.ts`
    - Phụ thuộc: Yêu cầu bước 2 hoàn thành.

- [ ] Bước 4: Viết test case 1 — ping với key hợp lệ
    - Làm gì: Tạo `RemoteEngine` với `cwd: tempDir, engineTimeout: 120000`. Gọi `setArgs(['--mock-pcap-port=${port}'])`. Gọi `runFunction('ping', { key: process.env.BABLOSOFT_KEY })`. Assert `result.error === undefined` và `result.response` tồn tại.
    - File liên quan: `tests/integration-connector.test.ts`
    - Phụ thuộc: Yêu cầu bước 3 hoàn thành.
    - Ghi chú: Đây là test quan trọng nhất — verify pipeline end-to-end (download, extract, spawn, IPC).

- [ ] Bước 5: Viết test case 2 — ping không có key
    - Làm gì: Tạo `RemoteEngine` mới với cùng temp dir. Gọi `runFunction('ping', {})`. Assert `result.error === 'key is missing'`.
    - File liên quan: `tests/integration-connector.test.ts`
    - Phụ thuộc: Yêu cầu bước 4 hoàn thành (reuse engine binary đã download ở step 4).
    - Ghi chú: Engine binary đã được download ở test case 1 — test này chỉ verify error handling.

- [ ] Bước 6: Viết test case 3 — nhiều IPC call liên tiếp
    - Làm gì: Dùng cùng engine instance từ test case 1 (hoặc engine mới cùng temp dir). Gọi `runFunction('ping', { key })` 2-3 lần liên tiếp. Assert mỗi lần đều thành công. Verify process được reuse (engine không spawn lại).
    - File liên quan: `tests/integration-connector.test.ts`
    - Phụ thuộc: Yêu cầu bước 5 hoàn thành.
    - Ghi chú: `RemoteEngine.#startProcess()` cache process qua `#isProcessAlive()`.

- [ ] Bước 7: Kiểm tra
    - Làm gì: Chạy lint, typecheck, và test.
    - File liên quan: (không)
    - Phụ thuộc: Yêu cầu tất cả bước trên hoàn thành.

## Kiểm tra

- `npm run lint` — ESLint không lỗi mới
- `npm run typecheck` — TypeScript pass
- `npm test` — tất cả test pass (unit + integration). Integration test được skip nếu không có `BABLOSOFT_KEY`.
- Nếu có `BABLOSOFT_KEY`: verify integration test pass (3 test cases xanh).

## Ghi chú

- Engine binary download có thể mất 30-120 giây — cần timeout 120000ms.
- Test có thể fail nếu bablosoft server down hoặc network có vấn đề.
- Không nên chạy integration test song song với unit test nếu PCAP server bị close giữa chừng. Hiện tại mocha chạy tuần tự, không vấn đề.
- Nếu thêm integration test trong tương lai, cân nhắc tạo helper function chung.
