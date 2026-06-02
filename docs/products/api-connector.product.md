# Product: API Connector

## Tổng quan

API Connector là wrapper đồng bộ cho RemoteEngine, đảm bảo an toàn khi nhiều instance gọi cùng lúc.

## Cách dùng

```ts
import { api, engine } from './connector';

const result = await api('fetch', { key: '...', options: { tags: ['Chrome'] } });
```

## Tính năng

- Đồng bộ hoá request bằng `async-lock`
- Tự động phân loại lỗi (MissingKeyError, PluginError)
- PCAP server tự động khởi động khi import
