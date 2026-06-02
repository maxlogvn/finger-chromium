# Spec: Hệ thống lỗi

## Class hierarchy

```
PluginError extends Error
├── this.name = constructor.name
├── Error.captureStackTrace(this, this.constructor)
├── Symbol.toStringTag -> constructor.name

MissingKeyError extends PluginError  -- "Key bi thieu hoac khong hop le!"
InvalidEngineError extends PluginError -- "Engine chua duoc tai hoac giai nen"
EngineTimeoutError extends PluginError -- "Engine khoi dong qua thoi gian"
RequestTimeoutError extends PluginError -- "Request qua thoi gian"
```

## Code pattern

```ts
class PluginError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor as abstract new (...args: unknown[]) => unknown);
  }

  get [Symbol.toStringTag](): string {
    return this.constructor.name;
  }
}
```

## Cách dùng

```ts
// Trong connector/index.ts
if (error?.includes?.('key is missing')) {
  throw new MissingKeyError('[MissingKeyError] Key bi thieu hoac khong hop le!');
}

// Trong engine.ts timeout
reject(new RequestTimeoutError(`[RequestTimeoutError] Request "${name}" qua thoi gian ${timeout}ms`));
```

## Xử lý ngoại lệ

Không để lỗi raw bubble lên. Trong connector, luôn có try/catch:
- `api()` dùng `async-lock` + try/catch trong `runFunction`
- Timeout race (`Promise.race`) ném `EngineTimeoutError`
