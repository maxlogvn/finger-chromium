# Product: RemoteEngine

## Mô tả

`RemoteEngine` quản lý toàn bộ vòng đời của engine binary (`FastExecuteScript.exe`). Đây là lớp thấp nhất trong stack fingerprint — nó tải engine từ bablosoft.com, verify checksum SHA1, giải nén, spawn process, và giao tiếp qua file-based IPC.

Không có `RemoteEngine`, các lớp trên (`API Connector`, `FingerprintPlugin`) không thể gửi lệnh setup fingerprint hay nhận kết quả.

## Cách sử dụng

Thông thường bạn không tạo `RemoteEngine` trực tiếp. `Connector` tạo `RemoteEngine` riêng trong constructor:

```ts
import RemoteEngine from './plugin/connector/engine';

const engine = new RemoteEngine({
  cwd: './data',
  engineTimeout: 300_000,   // timeout khởi động
  requestTimeout: 300_000,  // timeout chờ phản hồi
});

engine.on('beforeDownload', () => console.log('Đang tải engine...'));
engine.on('beforeExtract', () => console.log('Đang giải nén engine...'));

const result = await engine.runFunction('setup', {
  key: 'your-key',
  fingerprint: '...',
});
```

## Hành vi chi tiết

### File-based IPC

Engine giao tiếp qua file JSON — không dùng pipe hay socket:

1. `runFunction()` tạo thư mục `r/` trong thư mục script engine.
2. Ghi file `<pid>_<uuid>.json` chứa `{ name, params }`.
3. `chokidar` watch file đó cho đến khi engine ghi response vào.
4. Đọc response, parse JSON, trả kết quả.
5. Dọn file request cũ (process không còn tồn tại) trước mỗi request mới.

Cơ chế file-based được chọn vì engine binary (C/C++) không support stdin/stdout JSON protocol — file là cách đơn giản nhất để hai process giao tiếp.

### Download và checksum

- Đọc `EngineVersion` từ `project.xml` trong package root.
- Fetch metadata từ `bablosoft.com/distr/FastExecuteScript<arch>/<version>/...meta.json`.
- Cache metadata dưới dạng `<version>_<arch>.json` để tránh request lại.
- Download zip, verify SHA1 checksum, nếu sai thì xoá và tải lại.
- Extract zip vào thư mục `script/<version>/`.

### Timeout

| Hằng | Giá trị | Mục đích |
|---|---|---|
| `DEFAULT_TIMEOUT` | 300,000 ms (5 phút) | Timeout mặc định cho khởi động + request |
| `CLOSE_TIMEOUT` | 60,000 ms (1 phút) | Chờ engine process đóng sau khi spawn |

### Package root resolution

`resolvePackageRoot()` walk ngược thư mục từ `__dirname` cho đến khi tìm thấy `package.json` có `name === 'fingerprint-chromium-engine'`. Cần thiết vì sau tsup bundle, đường dẫn `__dirname` có thể khác với cấu trúc source.

## API methods

| Method | Mô tả |
|---|---|
| `runFunction(name, params, opts?)` | Gọi hàm trên engine, trả `FunctionResult` |
| `kill()` | Kill engine process, an toàn khi gọi nhiều lần |
| `setCwd(value?)` | Set thư mục làm việc |
| `setArgs(value?)` | Set tham số dòng lệnh cho engine |
| `setEngineTimeout(value?)` | Timeout khởi động (ms) |
| `setRequestTimeout(value?)` | Timeout chờ response (ms) |

## Giới hạn và điều kiện

- Yêu cầu kết nối internet cho lần chạy đầu (tải engine).
- `project.xml` phải tồn tại trong package root.
- Chỉ hỗ trợ Windows (`FastExecuteScript.exe`).
- `ARCH` tự động phát hiện: `'32'` nếu process arch chứa `'32'`, `'64'` nếu không.

## Tài liệu kỹ thuật liên quan

- Spec: `docs/specs/remote-engine.spec.md`
- Design: `docs/designs/remote-engine.design.md`
- Source: `src/plugin/connector/engine.ts`
