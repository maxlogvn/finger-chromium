# Spec: Native Mutex

## Module: src/plugin/mutex/index.ts (48 dòng)

### Implementation

```ts
import { createRequire } from 'node:module';

const require = createRequire(__filename);

const nativePath = path.join(__dirname, 'mutex', `win32-${process.arch}`, 'mutex.node');
const mutex = require(nativePath) as MutexModule;

export default mutex;
export const create = mutex.create;
```

### Architecture detection

| process.arch | Path |
|---|---|
| `x64` | `mutex/win32-x64/mutex.node` |
| `ia32` | `mutex/win32-ia32/mutex.node` |

### Mutex naming

```
BASProcess${pid}
```

Ví dụ: `BASProcess12345`

### Interface

```ts
interface MutexModule {
  create: (name: string) => void;
}
```

Không có `close()` -- mutex tự động release khi process kết thúc (Windows kernel-managed).
