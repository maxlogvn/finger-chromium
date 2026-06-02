# Spec: Debug Logging

## Module: debug package

### Namespaces

| Namespace | Nơi dùng |
|---|---|
| `fingerprint:connector` | `connector/engine.ts`, `connector/index.ts` |
| `fingerprint:plugin` | `plugin/index.ts` |
| `fingerprint:adapter` | `adapter/playwright/chromium.ts`, `engine.ts`, `utils.ts` |

### Usage

```ts
import debug from 'debug';
const log = debug('fingerprint:adapter');
log('[BrowserEngine] Launching...');
// Output: fingerprint:adapter [BrowserEngine] Launching...
```

### Environment

```bash
set DEBUG=fingerprint:* && node dist/index.js
```

### Performance

`debug()` trả về function no-op nếu namespace không match `DEBUG` env. Zero overhead khi tắt.
