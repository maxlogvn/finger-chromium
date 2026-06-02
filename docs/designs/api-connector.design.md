# Design: API Connector

## Vấn đề

RemoteEngine cần được wrap với cơ chế đồng bộ (async-lock), chuẩn hoá lỗi (error normalization) và auto-start PCAP server.

## Giải pháp

### Singleton pattern

Tạo một instance `RemoteEngine` duy nhất trong `connector/index.ts`, cấu hình từ biến môi trường:
```ts
const engine = new RemoteEngine({
  cwd: process.env.FINGERPRINT_CWD,
  engineTimeout: process.env.FINGERPRINT_TIMEOUT,
  requestTimeout: process.env.FINGERPRINT_TIMEOUT,
});
```

### async-lock

Dùng `async-lock` với key `'client'` để đảm bảo chỉ một request duy nhất được gửi tới engine tại một thời điểm. Lý do: engine binary là single-threaded, gửi request đồng thời có thể gây race condition.

### Error normalization

Khi engine trả về response có error field:
- Nếu error chứa `'key is missing'`: throw `MissingKeyError` (cho user biết cần key)
- Nếu khác: throw `PluginError` (generic error)

### Auto-start PCAP server

Khi module được load, PCAP server tự động start:
```ts
pcapServer.listen().then((port) => {
  engine.setArgs([`--mock-pcap-port=${port}`]);
});
```
PCAP server cần start trước engine để biết port truyền vào args.

---

Xem thêm: [Spec](../specs/api-connector.spec.md) | [Plan](../plans/api-connector.plan.md)
