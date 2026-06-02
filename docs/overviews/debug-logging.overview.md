# Overview: Debug Logging

## Tóm tắt

Đã thêm structured logging với `debug` package, 4 namespace theo module. Mỗi module có logger riêng, dễ bật/tắt qua biến môi trường `DEBUG`.

## Kiến trúc

```
Connector module:
  namespace: browser-with-fingerprints:connector
  file: src/plugin/connector/index.ts
  usage: log('-> api(%s)', name)

RemoteEngine module:
  namespace: browser-with-fingerprints:connector:engine
  file: src/plugin/connector/engine.ts
  usage: log('startProcess: download from %s', url)

PcapServer module:
  namespace: browser-with-fingerprints:connector:pcapServer
  file: src/plugin/connector/pcapServer/index.ts
  usage: log('listen port %d', port)

Cleaner module:
  namespace: browser-with-fingerprints:cleaner
  file: src/plugin/cleaner.ts
  usage: logError('cleaner: lỗi xoá file %s', filePath)
```

## Tham chiếu code

| Component | File | Dòng |
|---|---|---|
| `debug` import + log | `src/plugin/connector/index.ts` | 18-22 |
| `debug` import | `src/plugin/connector/engine.ts` | 20 |
| `debug` import | `src/plugin/connector/pcapServer/index.ts` | 12 |
| `debug` import | `src/plugin/cleaner.ts` | 12 |

## 4 namespaces

| Namespace | File | Số log statements |
|---|---|---|
| `browser-with-fingerprints:connector` | connector/index.ts | 1 |
| `browser-with-fingerprints:connector:engine` | connector/engine.ts | 12 |
| `browser-with-fingerprints:connector:pcapServer` | pcapServer/index.ts | 1 |
| `browser-with-fingerprints:cleaner` | cleaner.ts | 1 |

## Bật log

```powershell
$env:DEBUG = 'browser-with-fingerprints:connector:*'   # connector sub-modules
$env:DEBUG = 'browser-with-fingerprints:*'             # tất cả module
$env:DEBUG = '*'                                        # tất cả (kể cả third-party)
```

## Quyết định thiết kế

- **Namespace theo module hierarchy**: `connector:engine`, `connector:pcapServer` -- bật `connector:*` log tất cả connector sub-modules. Dễ debug connector mà không bị spam từ cleaner.
- **`debug` thay `console.log`**: Zero overhead khi `DEBUG` không set (function là no-op). User kiểm soát log level qua env, không log production.
- **`logError` tái sử dụng namespace**: `debug()` tự thêm prefix `ERROR` khi gọi `.error()`. Không cần namespace riêng cho error.
- **Output ra `process.stderr`**: Không ảnh hưởng stdout (có thể redirect riêng).

## Lưu ý

- `debug` output ra `process.stderr`. Redirect: `node script.js 2> debug.log`.
- Mỗi namespace được tô màu khác nhau trong terminal.
- Zero overhead khi `DEBUG` không set -- function là no-op.
- Wildcard `DEBUG=browser-with-fingerprints:*` match mọi namespace trong dự án.
- Không log secrets (key, IP proxy).

## Tài liệu liên quan

- `docs/designs/debug-logging.design.md`
- `docs/specs/debug-logging.spec.md`
- `docs/plans/debug-logging.plan.md`
- `docs/products/debug-logging.product.md`
- `src/plugin/connector/index.ts`
- `src/plugin/connector/engine.ts`
- `src/plugin/connector/pcapServer/index.ts`
- `src/plugin/cleaner.ts`
