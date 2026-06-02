# Product: API Connector

## Tổng quan

API Connector là lớp giao tiếp đồng bộ với engine binary, đảm bảo chỉ một request tại một thời điểm và chuẩn hoá lỗi.

## Cách dùng

```ts
import { api } from './connector';

// Gọi API setup
const result = await api('setup', {
  key: 'your-key',
  fingerprint: { value: '{...}', options: {} },
  proxy: { value: 'http://proxy:8080', options: {} },
});
```

## Tính năng

- **async-lock**: Chỉ một request tại một thời điểm, tránh race condition
- **Error normalization**: Lỗi engine được chuyển thành `PluginError` hoặc `MissingKeyError`
- **Notifications**: Khi không có key, tự động nhắc user nâng cấp
- **PCAP server**: Auto-start mock TCP server cho engine kết nối
