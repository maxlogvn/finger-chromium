# Spec: Bug #14 — RemoteEngine singleton dùng chung giữa các instance

> Tuân thủ quy ước code tại [CONVENTIONS.md](../CONVENTIONS.md).

## Mô tả

Refactor `RemoteEngine` từ singleton global thành factory pattern — mỗi `FingerprintPlugin`
instance tạo `Connector` riêng với `RemoteEngine` độc lập. Giải quyết vấn đề: `kill()` trên
một instance giết process engine của tất cả instance khác, và `setCwd()` thay đổi cấu hình
toàn cục.

## Yêu cầu

### Functional
- Mỗi `FingerprintPlugin` instance phải có `RemoteEngine` riêng (process `FastExecuteScript.exe`
  riêng).
- `kill()` trên một instance chỉ dừng engine của instance đó.
- `setCwd()` chỉ ảnh hưởng instance gọi nó.
- API public (`BrowserEngine`, `FingerprintPlugin`) không thay đổi.
- PCAP server vẫn là singleton dùng chung (một TCP server cho cả process).

### Non-functional
- Không thay đổi hành vi của `api()` — cùng input phải cho cùng output.
- Backward compatible — code dùng `new BrowserEngine()` không cần sửa.
- `AsyncLock` mỗi connector riêng, không block chéo giữa các instance.

## Thiết kế

Tham chiếu: `docs/designs/bug-014-remote-engine-factory.design.md`

Kiến trúc:

```
FingerprintPlugin A  -->  Connector A  -->  RemoteEngine A (process A)
FingerprintPlugin B  -->  Connector B  -->  RemoteEngine B (process B)

PCAP Server (module-level singleton, shared)
  ^-- Connector A gọi ensureInit() để khởi động
  ^-- Connector B gọi ensureInit() (no-op nếu đã chạy)
```

## API / Data flow

### Connector class

```ts
class Connector {
  #engine: RemoteEngine;
  #lock: AsyncLock;

  constructor(options?: EngineOptions);
  api(name: string, params?: ApiParams): Promise<unknown>;
  setCwd(value: string): void;
  setRequestTimeout(value: number): void;
  setEngineTimeout(value: number): void;
  cleanup(): void;  // chỉ kill #engine, không đóng PCAP
}
```

### Luồng

1. `new Connector()` — tạo `RemoteEngine` mới, gọi `ensureInit()` (khởi động PCAP server
   nếu chưa chạy).
2. `connector.api('setup', {...})` — dùng `#engine.runFunction()` của riêng nó.
3. `connector.cleanup()` — chỉ kill `#engine` riêng.

## Components

### `src/plugin/connector/index.ts` (sửa)
- Xoá `const engine = new RemoteEngine(...)` singleton.
- Xoá `export { engine }`.
- Thêm class `Connector` export default.
- `api()` và `cleanup()` trở thành method của `Connector`.
- PCAP server lazy init (`ensureInit()`) vẫn ở module-level, không đổi.

### `src/plugin/index.ts` (sửa)
- Import `Connector` thay vì `{ api, engine, cleanup }`.
- `FingerprintPlugin` có `#connector = new Connector()` ở constructor.
- `setWorkingFolder()` → `this.#connector.setCwd()`.
- `setRequestTimeout()` → `this.#connector.setRequestTimeout()`.
- `setEngineTimeout()` → `this.#connector.setEngineTimeout()`.
- `fetch()`, `versions()`, `_launch()` → `this.#connector.api()`.
- `cleanup()` → `this.#connector.cleanup()`.

### `src/plugin/errors.ts` (không đổi)
### `src/plugin/connector/engine.ts` (không đổi)

## Xử lý lỗi

| Tình huống | Hành vi |
|-----------|---------|
| Instance A gọi `cleanup()` | Chỉ kill engine A, engine B vẫn chạy |
| Instance B gọi `api()` sau khi A cleanup | Bình thường — engine B riêng |
| PCAP server chưa chạy | `ensureInit()` tự động khởi động |
| `Connector` tạo mà không gọi `api()`/`cleanup()` | Không leak — engine chưa spawn, không process |

## Kiểm tra

- Happy path: hai `BrowserEngine` instance launch riêng, quit riêng, không ảnh hưởng lẫn nhau.
- Edge case: instance A quit trước khi B launch — B vẫn launch bình thường.
- Edge case: call `api()` sau `cleanup()` — throw lỗi process đã chết (hành vi hiện tại).
- Error case: PCAP server fail — lỗi từ `ensureInit()`.
