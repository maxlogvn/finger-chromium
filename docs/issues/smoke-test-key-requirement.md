# Known Issue: Smoke tests bắt buộc BABLOSOFT_KEY không cần thiết

## Mô tả

Smoke tests hiện tại bỏ qua toàn bộ nếu thiếu `BABLOSOFT_KEY` (dòng 6 `skipTestIfNoKey()` trong mỗi file `.spec.ts`). Tuy nhiên, phân tích BAS script (`project.xml`) cho thấy engine binary (`FastExecuteScript.exe`) **chấp nhận key rỗng** cho fingerprint miễn phí (ví dụ Windows), vẫn launch browser và build response đầy đủ.

Nói cách khác, smoke tests có thể chạy browser thật với fingerprint miễn phí mà không cần key — chỉ có các tính năng premium (fingerprint trả phí, PerfectCanvas nâng cao) mới thực sự cần key.

### Vấn đề cụ thể

1. **`tests/helpers.ts` dòng 79-83:** `createEngine()` throw `MissingKeyError` ngay khi khởi tạo, không hề gọi engine binary để kiểm tra thực tế:

```ts
export function createEngine(key?: string, launcher?: Launcher): BrowserEngine {
  const resolvedKey = key !== undefined ? key : PRIVATE_KEY;
  if (!resolvedKey) {
    throw new MissingKeyError(
      'Cần set BABLOSOFT_KEY để tạo BrowserEngine instance.'
    );
  }
  // ...
}
```

2. **`tests/helpers.ts` dòng 26:** `PRIVATE_KEY` fallback về chuỗi rỗng nếu env không set. `createEngine()` throw trước khi engine kịp xử lý.

3. **`src/plugin/connector/index.ts` dòng 162-166:** Connector chỉ throw `MissingKeyError` khi binary trả về error. Nếu binary trả về `{ error: null, ... }` (fingerprint free), connector không throw.

### Flow mong muốn (khi không có key)

```
createEngine() → tạo instance thành công
  → engine.launch() → setServiceKey("")
    → engine.newContext()
      → connector.api('setup', { key: "" })
        → FastExecuteScript.exe nhận key rỗng
        → Áp dụng fingerprint free (Windows mặc định)
        → Trả về { error: null, pid, path, bounds, ... }
      ← JS nhận response, không throw
    ← BrowserContext sẵn sàng để test
```

## Nguyên nhân gốc rễ

- `createEngine()` được viết với giả định "có key mới chạy được engine" — giả định này không đúng với fingerprint free.
- `skipTestIfNoKey()` gộp chung "không cần key" (unit test) với "cần key" (smoke test), trong khi thực tế smoke test CHỈ cần key cho tính năng premium.

## Tác động

| Tác động | Mức độ | Ai bị ảnh hưởng | Chi tiết |
|----------|--------|----------------|----------|
| Smoke tests bị skip khi không có key | Cao | Mọi developer | Không ai chạy được browser thật nếu chưa mua key |
| Không thể verify PR với browser thật | Cao | CI, reviewer | Không biết code mới có làm hỏng launch/context không |
| Lãng phí tài nguyên test helper | Thấp | Developer | `createEngine()` phức tạp hơn cần thiết |
