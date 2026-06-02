# Product: Debug Logging

## Tổng quan

Structured logging với `debug` package, namespace theo module.

## Bật logging

```bash
set DEBUG=fingerprint:* & node app.js
```

## Namespaces

| Namespace | Log gì |
|---|---|
| `fingerprint:connector` | Download engine, extract, IPC request/response, setup |
| `fingerprint:plugin` | Lifecycle: launch, configure, cleanup |
| `fingerprint:adapter` | BrowserEngine methods, viewport resize, hook binding |

## Ví dụ output

```
fingerprint:connector Dang tai browser... +0ms
fingerprint:connector Dang cai dat browser... +5s
fingerprint:plugin _launch: setup response OK +10s
fingerprint:adapter setViewport: resize 1920x1080 +11s
```
