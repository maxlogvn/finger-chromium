# Design: Native Mutex

## Vấn đề

Cần đồng bộ truy cập tài nguyên ở cấp độ OS -- ngăn nhiều instance browser dùng chung profile cùng lúc. `async-lock` chỉ hoạt động trong process, không cross-process.

## Giải pháp: Native C++ addon

Tạo Windows named mutex qua native addon `mutex.node`.

### Module loading

```ts
const nativePath = path.join(__dirname, `mutex/win32-${process.arch}/mutex.node`);
const mutex = require(nativePath);
```

Hỗ trợ 2 architecture: `win32-x64`, `win32-ia32`.

### API

```ts
interface MutexModule {
  create: (name: string) => void;
}
```

`create(name)` tạo mutex với tên. Tên mutex theo pattern: `BASProcess${pid}`.

### Error handling

Nếu native addon không load được (sai arch, thiếu file .node), throw error với message chi tiết:
```
Cannot find module for platform: win32-${arch}
You can install the missing dependency manually.
```

### Vị trí dùng

Trong `FingerprintPlugin._launch()`:
```ts
mutex.create(`BASProcess${pid}`);
```

`pid` từ engine response (setupResponse.pid).

---

Xem thêm: [Spec](../specs/native-mutex.spec.md) | [Plan](../plans/native-mutex.plan.md)
