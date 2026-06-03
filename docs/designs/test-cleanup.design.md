# Design: Test Cleanup (SettingsCleaner + ConfigManager + Mutex)

## Bối cảnh

Ba module `cleaner.ts`, `config.ts`, và `mutex/index.ts` hiện chưa có unit test. Chúng xử lý các tác vụ cleanup quan trọng (dọn file tạm, đồng bộ cấu hình engine .ini, Windows named mutex). Cần viết test để đảm bảo các module này hoạt động đúng, đặc biệt là các edge cases (lock conflict, timeout, ENOENT, platform mismatch).

## Câu hỏi làm rõ

- Chiến lược mock cho default imports (proper-lockfile, fast-glob, async-lock)? → Dùng proxyquire + sinon.
- Có mock fs/promises không? → Có, dùng proxyquire.
- Mutex không có native binary trong CI? → Chỉ test error paths và logic wrapper (release), không test native create() thật.

## Các phương án

### Phương án 1: Manual monkey-patch (giống connector.test.ts)

Override module-level dependencies qua dynamic `import()` + `delete require.cache`.

- Ưu điểm: Không cần thêm dependency mới.
- Nhược điểm: Không mock được default imports (proper-lockfile dùng default export). Cache clearing dễ gây side effects. Không kiểm soát được tất cả nhánh code.

### Phương án 2: Proxyquire + Sinon (được chọn)

Dùng proxyquire để inject mock vào module scope, sinon.stub cho spy/stub/assert.

- Ưu điểm: Mock được default imports. Kiểm soát hoàn toàn dependency. Sinon cung cấp spy, stub, assertion API tiện lợi.
- Nhược điểm: Cần thêm 2 devDependencies (proxyquire + sinon).

### Phương án 3: Integration-style (file thật)

Tạo temp directory thật, dùng proper-lockfile và fs thật, không mock.

- Ưu điểm: Test sát với thực tế nhất.
- Nhược điểm: Không test được edge cases (ENOENT, lock compromised). Chậm hơn. Không cô lập được lỗi.

## Giải pháp được chọn

- Phương án AI đề xuất: Phương án 2 (Sinon-only) — dùng sinon.stub() trực tiếp trên CJS module exports object. Không dùng proxyquire vì không tương thích với tsx/esm (ESM import không đi qua require()).
- Phương án được chọn: Phương án 2 (Sinon-only).
- Lý do: Sinon stub trên module exports object hoạt động với cả CJS và ESM interop. Đơn giản hơn, không cần thêm proxyquire.
- Ràng buộc: Không cần thêm devDependencies — test dùng manual stub + global override (không cần sinon).
