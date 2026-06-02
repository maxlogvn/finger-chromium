# Spec: Debug Logging

## Package: `debug`

### Namespaces

| Namespace | Nơi import | File |
|---|---|---|
| `browser-with-fingerprints:connector` | `debugFactory('browser-with-fingerprints:connector')` | `connector/index.ts` |
| `browser-with-fingerprints:connector:engine` | `debugFactory('browser-with-fingerprints:connector:engine')` | `connector/engine.ts` |
| `browser-with-fingerprints:connector:pcapServer` | `debug('browser-with-fingerprints:connector:pcapServer')` | `connector/pcapServer/index.ts` |
| `browser-with-fingerprints:cleaner` | `createDebug('browser-with-fingerprints:cleaner')` | `plugin/cleaner.ts` |

### Usage

```ts
import debugFactory from 'debug';
const debug = debugFactory('browser-with-fingerprints:connector:engine');
debug('Dang tai browser...');
// Output: browser-with-fingerprints:connector:engine Dang tai browser... +0ms
```

### Environment

```bash
set DEBUG=browser-with-fingerprints:* & node dist/index.js
```

### Performance

`debug()` trả về function no-op nếu namespace không match `DEBUG` env. Zero overhead khi tắt.

### Format output

```
namespace message +elapsed-time
```

Trong đó `elapsed-time` là ms từ process start. Màu sắc tự động nếu terminal hỗ trợ.

### Log statements per file

| File | Số lượng log | Loại log |
|---|---|---|
| `connector/index.ts` | 1 | PCAP server listening |
| `connector/engine.ts` | 12 | IPC request/response, download, extract, spawn, metadata |
| `connector/pcapServer/index.ts` | 1 | Socket error handler |
| `plugin/cleaner.ts` | 1 | Lock compromised warning |

---

## Kiểm tra

- Set `DEBUG=browser-with-fingerprints:*` trước khi chạy.
- Debug output ghi ra stderr, không ảnh hưởng test assertion.

---
