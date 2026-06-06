# Product: Unit Tests cho Core (`tests/unit/core.spec.ts`)

> **Version:** 1.0 | **Cập nhật lần cuối:** 2026-06-06

## Mô tả (cho người dùng)

Bộ unit test cho các module core của thư viện `fingerprint-chromium-engine`. Cho phép developer chạy test nhanh mà không cần `BABLOSOFT_KEY`, browser thật, hay engine worker. Các test này đảm bảo error classes, public exports, và config logic hoạt động đúng sau mỗi lần refactor.

## Yêu cầu hệ thống

- **Node.js** >= 18
- **Hệ điều hành:** Windows 10/11
- Không cần `BABLOSOFT_KEY` hay browser.

## Cách sử dụng (từng bước)

1. Chạy toàn bộ test suite: `npm test`
2. Chạy riêng unit test core: `npx mocha tests/unit/core.spec.ts`
3. Kết quả: 30 test pass, không cần biến môi trường nào.

## Ví dụ code hoàn chỉnh

```ts
// Test error class
const err = new PluginError('test');
console.log(err instanceof PluginError); // true
console.log(err.name); // 'PluginError'

// Test getValidPollInterval
console.log(getValidPollInterval(NaN)); // 500
console.log(getValidPollInterval(50));  // 100
console.log(getValidPollInterval(200)); // 200

// Test ConfigManager với temp directory
const manager = new ConfigManager();
await manager.synchronize('id', tmpDir, { width: 1920, height: 1080 });
```

## Hành vi chi tiết

- Error classes: tất cả đều kế thừa `PluginError`, có `name` tự động gán bằng `constructor.name`, message chứa hướng dẫn khắc phục chi tiết cho các error cụ thể.
- Public exports: `BrowserEngine` là class, 5 error class là function và kế thừa `PluginError`. Các type-only export (TypeScript) không tồn tại ở runtime nên không test.
- Config: `getValidPollInterval` validate và clamp interval về giá trị hợp lệ (100-500ms). `ConfigManager` quản lý lock per-instance và đồng bộ file .ini.

## Giới hạn và điều kiện

- Chỉ kiểm tra 3 module: errors, exports, config. Các module khác (loader, adapter, common) chưa có unit test.
- Config test dùng temp directory thật (I/O), cleanup sau mỗi test.
- Không test `setViewport` (cần CDP và browser thật).

## Xử lý lỗi thường gặp (FAQ / Troubleshooting)

| Vấn đề | Nguyên nhân thường gặp | Giải pháp |
|--------|------------------------|-----------|
| Test fail vì `ECONNREFUSED 127.0.0.1:9222` | Test ConfigManager.configure với width/height gọi setViewport thật | Dùng sync wrapper không gọi fn() hoặc truyền bounds rỗng |
| `Cannot find module` khi chạy test | Import sai đường dẫn | Dùng import không extension (tsx tự resolve) |
| Config test chậm (>1s) | `synchronize()` dùng `sleep(100)` mặc định | Truyền `pollInterval` nhỏ hơn (tối thiểu 100ms) |

## Tài liệu kỹ thuật liên quan (cho developer nâng cao)

- Spec: `docs/specs/test-unit-core.spec.md`
- Design: `docs/designs/test-unit-core.design.md`
- Plan: `docs/plans/test-unit-core.plan.md`
- Theo dõi tiến độ: [`TRACKING.md`](../TRACKING.md)
