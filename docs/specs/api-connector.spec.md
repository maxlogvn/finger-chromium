# Spec: API Connector

## Mô tả

API Connector là wrapper cao cấp của `RemoteEngine.runFunction()`. Nó cung cấp cơ chế đồng bộ (async-lock), error normalization, và tự động khởi động PCAP server.

## API / Interfaces chính

### `api(name, params)`

```ts
export const api = async (name: string, params?: ApiParams): Promise<unknown>
```

- `name`: Tên hàm engine (`'setup'`, `'versions'`, `'get_bounds'`, `'get_defaults'`).
- `params`: Tham số truyền cho engine.
- Returns: `result.response` nếu có, nếu không thì toàn bộ result object.
- Throw: `MissingKeyError` nếu engine báo lỗi "key is missing", `PluginError` cho các lỗi khác.

### `engine` export

```ts
export { engine };  // Singleton RemoteEngine instance
```

## Luồng dữ liệu

```
api('setup', { fingerprint, key, pid, profile, proxy, version })
    │
    ├── lock.acquire('client', async () => {
    │       ├── engine.runFunction('setup', params, {
    │       │     requestTimeout: perfectCanvasRequest ? 0 : engine.requestTimeout
    │       │   })
    │       │
    │       ├── error? "key is missing" → throw MissingKeyError
    │       │   error? khác → throw PluginError
    │       │
    │       └── OK → return result.response ?? result
    │   })
    │
    └── clearTimeout(notifyTimer)
```

### Xử lý đặc biệt cho PerfectCanvas

Khi `params.options.perfectCanvasRequest` là `true`, `requestTimeout` được set thành `0` (không timeout). Lý do: PerfectCanvas request có thể mất nhiều thời gian hơn bình thường vì cần render canvas động.

## File liên quan

| File | Vai trò |
|---|---|
| `src/plugin/connector/index.ts` | API Connector (singleton + api wrapper) |
| `src/plugin/connector/engine.ts` | RemoteEngine class |
| `src/plugin/connector/utils.ts` | Notification helper |
| `src/plugin/connector/pcapServer/index.ts` | PCAP TCP server |

## Xử lý lỗi

| Lỗi | Điều kiện | Xử lý |
|---|---|---|
| `MissingKeyError` | `error.includes('key is missing')` | Ném ra để caller biết cần set key |
| `PluginError` | Các lỗi khác từ engine | Ném ra với message gốc |
| `EngineTimeoutError` | Engine không start kịp | Từ RemoteEngine, truyền lên |
| `RequestTimeoutError` | Engine không phản hồi | Từ RemoteEngine, truyền lên |

## Ghi chú kỹ thuật

- `async-lock` với key `'client'` hoạt động như mutex cho toàn bộ connector.
- `FINGERPRINT_TIMEOUT` env dùng chung cho cả engine timeout và request timeout.
- PCAP server port được set vào args trước khi engine spawn.
- Notification chỉ hiển thị khi `process.env.NODE_ENV !== 'test'`.

---
