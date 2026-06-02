# Overview: API Connector

## Tóm tắt

Đã triển khai singleton connector với async-lock đồng bộ, auto-start PCAP server, error normalization. `ConnectorAPI` là lớp giao tiếp duy nhất giữa `FingerprintPlugin` và `RemoteEngine`.

## Kiến trúc

```
ConnectorAPI
  |-- RemoteEngine (singleton)   -- download, spawn, IPC
  |-- PcapServer (singleton)     -- mock TCP server
  |-- async-lock                 -- đồng bộ truy cập engine
  |
  |-- api(name, params)          -- wrapper chính
  |     -> lock.acquire()
  |     -> engine.startProcess() (nếu chưa start)
  |     -> engine.runFunction()  (file IPC)
  |     -> error normalization
  |
  |-- cleanup()                  -- dọn dẹp
  |     -> pcapServer.close()
  |     -> RemoteEngine.kill()
```

## Tham chiếu code

| Component | File | Dòng |
|---|---|---|
| `RemoteEngine` instance | `src/plugin/connector/index.ts` | 24-28 |
| PcapServer auto-start | `src/plugin/connector/index.ts` | 30-36 |
| `api()` function | `src/plugin/connector/index.ts` | 38-80 |
| Error normalization | `src/plugin/connector/index.ts` | 55-70 |
| Event handlers (`beforeDownload`, `beforeExtract`) | `src/plugin/connector/index.ts` | 74-78 |
| `perfectCanvasRequest` handling | `src/plugin/connector/index.ts` | 72-73 |
| `cleanup()` | `src/plugin/connector/index.ts` | 82-88 |
| `engine` export | `src/plugin/connector/index.ts` | 90 |
| Log namespace | `src/plugin/connector/index.ts` | 18-22 |

## Flow `api()` chi tiết

```
api(name, params)
  -> log('-> api(%s)', name)
  -> lock.acquire(id, async () => {
       await engine.startProcess()     // spawn nếu chưa chạy
       if (name === 'setup' && params?.perfectCanvas)
         engine.perfectCanvasRequest() // set requestTimeout = 0
       const result = await engine.runFunction(name, params)
       return result
     })
  -> catch (error) normalizeError(error)
     |-- 'key missing'  -> MissingKeyError
     |-- 'timeout'      -> RequestTimeoutError / EngineTimeoutError
     |-- khác           -> PluginError
```

## Quyết định thiết kế

- **async-lock**: Đồng bộ truy cập `RemoteEngine` -- tránh hai `api()` call cùng lúc gây race condition trên file IPC.
- **`perfectCanvasRequest`**: Khi setup PerfectCanvas, set requestTimeout = 0 (không timeout) -- vì PerfectCanvas request có thể mất nhiều thời gian.
- **Error normalization**: Tất cả lỗi từ engine đều được chuẩn hoá thành `PluginError` hierarchy -- user catch một interface thống nhất.
- **Module-level engine + pcapServer variables**: Singleton pattern, không cần class -- đủ cho use case một engine một lúc.

## Lưu ý

- `engine` instance (`RemoteEngine`) được export công khai -- dùng cho tác vụ nâng cao.
- `cleanup()` export công khai -- gọi khi kết thúc session.
- PCAP server auto-start ngay khi module load -- port có thể bị change nếu EADDRINUSE.
- Event handlers `beforeDownload` và `beforeExtract` cho phép UI hiển thị tiến trình.

## Tài liệu liên quan

- `docs/designs/api-connector.design.md`
- `docs/specs/api-connector.spec.md`
- `docs/plans/api-connector.plan.md`
- `docs/products/api-connector.product.md`
- `src/plugin/connector/index.ts`
