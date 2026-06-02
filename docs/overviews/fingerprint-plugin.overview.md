# Overview: FingerprintPlugin

## Mục tiêu

Tạo lớp điều phối trung tâm (`FingerprintPlugin`) quản lý cấu hình, spawn worker.exe, và dọn dẹp tài nguyên.

## Kết quả

- `src/plugin/index.ts`: 282 dòng, class `FingerprintPlugin`.
- Module-level: `serviceKey` (global), `plugin` (singleton).
- 6 fluent config methods, 5 config helpers, 3 runtime methods.
- Core `_launch()` lifecycle: setup → cleaner/mutex → spawn → configure.
- Export `plugin = new FingerprintPlugin()` cho standalone use.

## Kiểm tra

- `npm run lint` -- 0 errors (các warning `no-explicit-any` pre-existing tại dòng 201, 213, 228, 229, 242, 247, 267).

## Sai lệch so với kế hoạch

Không có sai lệch đáng kể. Plan dự kiến property `options` và `args` nhưng code chỉ có `launcher`, `version`, và 3 PluginConfig. Các giá trị args/options được truyền trực tiếp vào `_launch()`.

## Ghi chú kỹ thuật

### serviceKey là module-level, không phải class property

```ts
let serviceKey: string | undefined;
// setServiceKey() ghi đè global key
// Tất cả instance dùng chung key
```

Đây là thiết kế có chủ đích -- key là global setting.

### setProxyFromArguments() dùng first-call-wins

Chỉ set proxy nếu `this.proxy == null`. Nếu `useProxy()` đã gọi trước đó, args `--proxy-server` bị ignore.

### Profile fallback tự động

Nếu không gọi `useProfile()`, `_launch()` tự tạo profile config từ `getProfilePath(options)` với `{ loadProxy: true, loadFingerprint: true }`.

### Configure pass-through

```ts
protected async configure(..._args: any[]): Promise<void> {
  if (typeof configure === 'function') return (configure as any)(..._args);
}
```

Playwright bridge override method này. Dùng `any[]` vì tham số khác nhau giữa 2 chế độ.

### SetupResponse có [key: string]: unknown

Engine binary có thể thêm field mới theo version. Code destructure các field biết trước (`id`, `pid`, `pwd`, `path`, `bounds`), phần còn lại là `...config` được merge vào launch options.

### Mutex name = `BASProcess${pid}`

`pid` là `crypto.randomUUID()`, không phải OS PID. Mỗi lần launch một mutex riêng, cho phép nhiều instance chạy đồng thời.

---
