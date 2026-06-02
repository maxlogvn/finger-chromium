# Product: Native Mutex

## Tổng quan

Native Windows named mutex đảm bảo chỉ một instance browser dùng một profile tại một thời điểm.

## Cách dùng

```ts
import { create, close } from './mutex';

const mutex = create('Global\\profile-abc-123');
// Browser chạy...
close(mutex); // Giải phóng
```

## Tại sao cần?

- Chống corrupt profile khi nhiều browser cùng ghi
- Cross-process (khác với async-lock trong process)
- Chạy trên Windows, dùng native Win32 API
