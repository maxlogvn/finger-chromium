# Product: API Connector

## Mô tả

API Connector là lớp trung gian singleton giữa `FingerprintPlugin` và `RemoteEngine`. Nó nhận lệnh từ `FingerprintPlugin._launch()` (ví dụ `api('setup', params)`), dùng `AsyncLock` để đồng bộ, gọi `RemoteEngine.runFunction()`, và chuẩn hoá lỗi đầu ra.

Connector không tự khởi tạo engine — `RemoteEngine` được tạo một lần ở module level. PCAP server cũng tự động listen khi connector được import.

Nói ngắn gọn: Connector là "tổng đài" đảm bảo request đến engine không bị chồng chéo và lỗi được map đúng class.

## Cách sử dụng

Thông thường bạn không gọi connector trực tiếp. Nó được `FingerprintPlugin` gọi nội bộ:

```ts
// FingerprintPlugin._launch() gọi:
const result = await api('setup', {
  key: 'your-key',
  fingerprint: '...',
  proxy: 'http://user:pass@host:8080',
  profile: './profiles/user_01',
  version: '130',
});
```

Dùng trực tiếp khi cần custom flow:

```ts
import { api, cleanup, engine } from './plugin/connector';

const result = await api('setup', { key: process.env.BABLOSOFT_KEY });

// Kết thúc session
await cleanup();
```

Connector cũng export `engine` (RemoteEngine instance) để truy cập trực tiếp nếu cần.

## Hành vi chi tiết

- `AsyncLock` với key `'client'` đảm bảo chỉ một request tại một thời điểm. Engine dùng file-based IPC — request chồng lên nhau làm lẫn request/response.
- PCAP server tự động listen khi connector được import. Engine cần PCAP server để giao tiếp ID request.
- `api()` kiểm tra response có `error` không. Nếu error chứa `'key is missing'`, tự động throw `MissingKeyError`. Các lỗi khác throw `PluginError`.
- `perfectCanvasRequest` (trong `params.options`): set `requestTimeout = 0` (không timeout) vì perfect canvas request có thể mất nhiều thời gian hơn request thường.
- `cleanup()` chỉ kill engine process và close PCAP server. Cleanup mutex, cleaner, và browser nằm ở `FingerprintPlugin.cleanup()`.
- Engine events (`beforeDownload`, `beforeExtract`) được log ra console để user biết tiến trình.

## Giới hạn và điều kiện

- `FINGERPRINT_CWD` và `FINGERPRINT_TIMEOUT` đọc từ env. Nếu không set, dùng giá trị mặc định của `RemoteEngine`.
- Chỉ một request được xử lý tại một thời điểm (do async-lock).
- Cần gọi `cleanup()` khi kết thúc session để kill engine process và close PCAP server.

## Tài liệu kỹ thuật liên quan

- Spec: `docs/specs/api-connector.spec.md`
- Design: `docs/designs/api-connector.design.md`
- Source: `src/plugin/connector/index.ts`
