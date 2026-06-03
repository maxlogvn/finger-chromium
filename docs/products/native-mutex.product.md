# Product: Native Mutex

## Mô tả

Native Mutex cung cấp Windows named mutex thông qua C++ addon (`mutex.node`). Mutex này cần cho `worker.exe` (BAS process) để đồng bộ truy cập tài nguyên dùng chung giữa các process.

## Cách sử dụng

```ts
import { create, release } from './plugin/mutex';

// Tạo mutex với tên unique
create('BASProcess12345');

// worker.exe dùng mutex này để đồng bộ
// ...

// Giải phóng mutex
release('BASProcess12345');
```

## Hành vi chi tiết

- `create(name)` tạo kernel-level named mutex trên Windows. Mutex có tên duy nhất để tránh xung đột giữa các instance.
- `release(name)` gọi native close handle. Nếu native chưa hỗ trợ close, `release()` là no-op.
- Windows kernel tự động cleanup handle mutex khi process thoát — không lo memory leak nếu quên release.
- Nếu architecture (32-bit/64-bit) không có file `mutex.node` tương ứng, throw error rõ ràng.

## Giới hạn và điều kiện

- Chỉ chạy trên Windows (win32).
- Cần file `mutex.node` phù hợp với architecture (32-bit hoặc 64-bit).
- File `mutex.node` được resolve từ package root — cần đúng path sau khi tsup bundle (xem KNOWN_ISSUES.md GitHub #18).

## Tài liệu kỹ thuật liên quan

- Spec: `docs/specs/native-mutex.spec.md`
- Design: `docs/designs/native-mutex.design.md`
- Source: `src/plugin/mutex/index.ts`
