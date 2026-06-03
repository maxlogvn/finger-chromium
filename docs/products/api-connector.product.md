# Product: API Connector

## Mô tả

API Connector (class `Connector`) là lớp trung gian giữa `FingerprintPlugin` và `RemoteEngine`. Mỗi `FingerprintPlugin` instance sở hữu `Connector` riêng với `RemoteEngine` riêng và `AsyncLock` riêng. Nó nhận lệnh từ `FingerprintPlugin._launch()` (ví dụ `api('setup', params)`), dùng `AsyncLock` để đồng bộ, gọi `RemoteEngine.runFunction()`, và chuẩn hoá lỗi đầu ra.

PCAP server là singleton dùng chung cho cả process, lazy init ở lần gọi API đầu tiên.

Nói ngắn gọn: Connector là "tổng đài" đảm bảo request đến engine không bị chồng chéo và lỗi được map đúng class.

## Cách sử dụng

Thông thường bạn không gọi connector trực tiếp. `FingerprintPlugin` tạo `Connector` riêng và gọi nội bộ:

```ts
// FingerprintPlugin._launch() gọi connector.api():
const result = await this.#connector.api('setup', {
  key: 'your-key',
  fingerprint: '...',
  proxy: 'http://user:pass@host:8080',
  profile: './profiles/user_01',
  version: '130',
});
```

Dùng trực tiếp khi cần custom flow:

```ts
import Connector from './plugin/connector';

const connector = new Connector();
const result = await connector.api('setup', { key: process.env.BABLOSOFT_KEY });

// Kết thúc session
connector.cleanup();
```

## Hành vi chi tiết

- `AsyncLock` với key `'client'` đảm bảo chỉ một request tại một thời điểm. Engine dùng file-based IPC — request chồng lên nhau làm lẫn request/response.
- PCAP server lazy init ở lần gọi `api()` đầu tiên, không listen khi import module.
- `api()` kiểm tra response có `error` không. Nếu error chứa `'key is missing'`, tự động throw `MissingKeyError`. Các lỗi khác throw `PluginError`.
- `perfectCanvasRequest` (trong `params.options`): set `requestTimeout = 0` (không timeout) vì perfect canvas request có thể mất nhiều thời gian hơn request thường.
- `cleanup()` chỉ kill engine process của instance hiện tại. Không đóng PCAP server vì các instance khác có thể đang dùng. Cleanup mutex, cleaner, và browser nằm ở `FingerprintPlugin.cleanup()`.

## Giới hạn và điều kiện

- `FINGERPRINT_CWD` và `FINGERPRINT_TIMEOUT` đọc từ env. Nếu không set, dùng giá trị mặc định của `RemoteEngine`.
- Chỉ một request được xử lý tại một thời điểm (do async-lock) trên cùng một Connector instance.
- Cần gọi `cleanup()` khi kết thúc session để kill engine process.

## Tài liệu kỹ thuật liên quan

- Spec: `docs/specs/api-connector.spec.md`
- Design: `docs/designs/api-connector.design.md`
- Source: `src/plugin/connector/index.ts`
