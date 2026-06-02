# Spec: API Connector

## Module: src/plugin/connector/index.ts

### Exports

```ts
export const api: (name: string, params?: ApiParams) => Promise<unknown>;
export { engine };
```

### Engine singleton

```ts
const engine = new RemoteEngine({
  cwd: process.env.FINGERPRINT_CWD,
  engineTimeout: process.env.FINGERPRINT_TIMEOUT || DEFAULT_TIMEOUT,
  requestTimeout: process.env.FINGERPRINT_TIMEOUT || DEFAULT_TIMEOUT,
});
```

Events:
- `'beforeDownload'`: log "Dang tai browser..."
- `'beforeExtract'`: log "Dang cai dat browser..."

### api() flow

1. Acquire async-lock `'client'`
2. Call `engine.runFunction(name, params)`:
   - Nếu `params.perfectCanvasRequest` set: dùng `requestTimeout: 0` (không timeout)
   - Nếu không: dùng `engine.requestTimeout`
3. Kiểm tra lỗi:
   - `error.includes('key is missing')` -> `throw new MissingKeyError()`
   - Có error khác -> `throw new PluginError()`
4. Trả về `result.response ?? result`
5. Finally: clear notification timer

### Notification

Khi không có key (`NODE_ENV !== 'test'`):
- In upgrade message ngay lập tức
- Set 20s timer in warning timeout
- Chỉ in một lần (dùng `once()`)

## PCAP Server integration

```ts
pcapServer.listen()
  .then(port => engine.setArgs([`--mock-pcap-port=${port}`]))
```

Server dùng `once()` wrapper để đảm bảo singleton.
