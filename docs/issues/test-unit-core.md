# Known Issue: Unit Tests cho Core (`tests/unit/core.spec.ts`)

> **Chú ý:** Template này dùng cho **body của GitHub issue**, chỉ mô tả vấn đề -- không đề xuất giải pháp.

## Mô tả

Hiện tại dự án chưa có unit test cho các module core không phụ thuộc `BABLOSOFT_KEY` hay browser thật. Cụ thể:

- **`src/plugin/errors.ts`**: 5 error class (`PluginError`, `MissingKeyError`, `InvalidEngineError`, `EngineTimeoutError`, `RequestTimeoutError`) chưa có test nào.
- **`src/index.ts`**: Export check chưa được kiểm tra -- không đảm bảo các export tồn tại và đúng kiểu.
- **`src/plugin/config.ts`**: `ConfigManager` class và `getValidPollInterval()` helper có logic xử lý (validate, lock, read/write file) nhưng chưa có test.

Thiếu unit test dẫn đến:
- Refactor gặp phải test thủ công.
- Không phát hiện sớm các lỗi như `instanceof` chain sai, export bị thiếu, hoặc config logic sai.
- Tăng technical debt khi mở rộng codebase.

### Steps to reproduce (Các bước tái hiện)

1. Chạy `npm test` -- không có unit test core nào được chạy.
2. Mở `tests/unit/` -- thư mục chưa tồn tại.
3. Kiểm tra `src/plugin/errors.ts` -- 5 class Error không có test coverage.

### Environment

- **OS:** Windows 11
- **Node version:** 20.x
- **Plugin version:** commit hiện tại

### Flow hiện tại (nếu có)

```
src/plugin/errors.ts          ← 5 error classes, không test
src/index.ts                  ← export check, không test
src/plugin/config.ts          ← ConfigManager + helpers, không test
```

## Nguyên nhân gốc rễ

- Khi khởi tạo dự án, ưu tiên dành cho smoke test (cần engine thật) trước, unit test core bị trì hoãn lại.
- Chưa có convention bắt buộc unit test cho module không phụ thuộc browser.
- `ConfigManager` có logic đồng bộ file (read/write, lock, poll interval) cần được kiểm tra bằng unit test với mock filesystem, hiện tại chưa có cơ chế test này.

## Tác động

| Tác động | Mức độ | Ai bị ảnh hưởng | Chi tiết |
|----------|--------|-----------------|----------|
| Thiếu coverage core | Cao | Developer | Mỗi lần refactor error classes hay config, phải test thủ công hoặc bỏ sót bug. |
| Export không được kiểm tra | Trung bình | Developer | Thay đổi export trong `src/index.ts` có thể bị sót mà không ai biết. |
| Config logic không test | Trung bình | Developer | `getValidPollInterval()` và `ConfigManager` có edge cases (NaN, âm, giá trị biên) không được bao phủ. |
