# Spec: Integration test với engine binary thật FastExecuteScript.exe

> Tuân thủ quy ước code tại [CONVENTIONS.md](../CONVENTIONS.md).

## Mô tả

Viết integration test cho `RemoteEngine` với engine binary thật (`FastExecuteScript.exe`) để verify pipeline download -> extract -> spawn -> IPC call (`runFunction('ping', {key})`) hoạt động end-to-end. Hiện tại 100% test là unit/hybrid — pipeline này chưa bao giờ được test với engine thật.

Tham chiếu design: `docs/designs/test-integration-engine-binary.design.md`

## Yêu cầu

- Integration test chỉ chạy khi biến môi trường `BABLOSOFT_KEY` được set (dùng `describe.skip` nếu không).
- Pipeline download -> extract -> spawn -> IPC phải được verify ít nhất một lần.
- Dùng `RemoteEngine` trực tiếp, không qua `Connector` — tránh phụ thuộc vào tầng error normalization và async-lock.
- PCAP server phải được start trước (reuse module-level `pcapServer.listen()`).
- Temp directory được tạo riêng cho integration test, cleanup sau khi test suite kết thúc.
- File test riêng: `tests/integration-connector.test.ts` — không ảnh hưởng unit test hiện tại.
- Không thêm npm script mới — mocha tự động pick file theo pattern `tests/**/*.ts`.

## Thiết kế

### Cấu trúc file test

```
tests/integration-connector.test.ts
├── before hook: start PCAP server, create temp dir, set long timeout
├── Integration — engine thật (describe)
│   ├── nên gọi 'ping' thành công với key hợp lệ
│   ├── nên trả về lỗi 'key is missing' khi không truyền key
│   └── nên reuse engine process cho nhiều IPC call
└── after hook: cleanup temp dir (không close PCAP — dùng chung)
```

### Kiến trúc

```
before()
  ├── pcapServer.listen() — start PCAP (reuse singleton)
  └── fs.mkdtemp() — tạo temp working directory

describe('Integration — engine thật')
  └── it('ping với key hợp lệ')
        ├── new RemoteEngine({ cwd: tempDir, engineTimeout: 120000 })
        ├── engine.setArgs([`--mock-pcap-port=${port}`])
        ├── engine.runFunction('ping', { key: BABLOSOFT_KEY })
        └── assert: result.error === undefined, result.response tồn tại

after()
  └── fs.rm(tempDir) — cleanup
```

### PCAP server sharing

PCAP server dùng `once()` — chỉ listen một lần trong toàn bộ process. Integration test gọi `pcapServer.listen()` lần đầu (hoặc nếu file test khác đã gọi, `once()` trả về promise/resolved port cũ). Không gọi `pcapServer.close()` trong integration test để tránh ảnh hưởng test khác.

### Timeout

Toàn bộ suite cần timeout lớn (120s) vì download engine (~20-50 MB) có thể mất 30-120 giây. Dùng `this.timeout(120000)` trong `before()` hook.

## API / Data flow

```
RemoteEngine.runFunction('ping', { key: '...' })
  → #updateMeta() — đọc project.xml, fetch metadata từ bablosoft (HTTP thật)
  → #startProcessInternal() — download zip, extract, spawn FastExecuteScript.exe
    → Kiểm tra checksum zip cũ (nếu có)
    → Download engine zip từ bablosoft (HTTPS fallback HTTP)
    → Giải nén zip vào script directory
    → Copy project.xml và tạo file cấu hình
    → Spawn FastExecuteScript.exe với --silent --mock-pcap-port=PORT
  → Tạo file request JSON trong thư mục r/
  → Chokidar watch file change
  → Engine ghi response vào file
  → Đọc và parse response JSON
  → Trả về FunctionResult
```

## Components

| File | Trạng thái | Mô tả |
|------|-----------|-------|
| `tests/integration-connector.test.ts` | Tạo mới | Integration test file |
| `.mocharc.yml` | Không sửa | Mocha tự động pick file theo pattern |

## Xử lý lỗi

| Tình huống | Kết quả mong đợi |
|-----------|------------------|
| `BABLOSOFT_KEY` không set | `describe.skip` — test không chạy |
| Download engine thất bại (network error) | Error throw từ `#startProcessInternal()` — test fail |
| Engine spawn fail | `InvalidEngineError` — test fail |
| `runFunction('ping', {key})` thiếu key | `result.error === 'key is missing'` |
| `runFunction('ping')` với key hợp lệ | `result.error === undefined`, `result.response !== undefined` |
| IP change detect (nếu có) | `result.response.hasChangeIP === false` (không yêu cầu đổi IP) |

## Kiểm tra

### Test cases (3 cases)

| Case | Input | Expected |
|------|-------|----------|
| Ping với key hợp lệ | `{ key: env.BABLOSOFT_KEY }` | `result.error === undefined`, response có dữ liệu |
| Ping không có key | `{}` | `result.error === 'key is missing'` |
| Nhiều IPC call liên tiếp | 2-3 lần `ping` với key | Mỗi lần đều thành công, process được reuse |
