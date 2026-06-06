# Known Issue: Chia tách smoke tests browser-engine thành nhiều file

> **Chú ý:** Template này dùng cho **body của GitHub issue**, chỉ mô tả vấn đề -- không đề xuất giải pháp.

## Mô tả

Hiện tại toàn bộ smoke test E2E nằm trong một file duy nhất `tests/smoke/browser-engine.spec.ts` (129 dòng) với 4 nhóm test trong `describe` riêng, tất cả đều import từ `tests/helpers.ts`.

### Cấu trúc hiện tại

```
tests/smoke/browser-engine.spec.ts
  ├── Import: assert, fs, path, os, PluginError, helpers (7 items)
  │
  ├── describe('Minimal Flow')        [dòng 25-42, 18 dòng, 2 tests]
  │   ├── it('launch -> newContext -> quit')
  │   └── it('withEngine wrapper cleanup')
  │
  ├── describe('Fluent API')          [dòng 46-65, 20 dòng, 1 test]
  │   └── it('useFingerprint -> useProxy -> useProfile -> launch -> newContext -> quit')
  │
  ├── describe('Error Handling')      [dòng 69-115, 47 dòng, 4 tests]
  │   ├── it('newContext trước launch throw PluginError')
  │   ├── it('launch hai lần throw PluginError')
  │   ├── it('newContext khi context đã tồn tại throw PluginError')
  │   └── it('quit khi chưa launch không throw')
  │
  └── describe('newFingerprint')      [dòng 119-128, 10 dòng, 1 test]
      └── it('gọi API trả về JSON string hợp lệ')
```

### Dependencies chung

Tất cả các file sau khi tách đều dùng chung:
- `skipTestIfNoKey()` -- guard check BABLOSOFT_KEY
- `createEngine()` -- factory tạo BrowserEngine instance
- `withEngine()` -- lifecycle wrapper tự động quit()
- `MOCK_FINGERPRINT_DATA`, `MOCK_FINGERPRINT_OPTIONS`, `MOCK_PROXY_OPTIONS`, `MOCK_PROFILE_OPTIONS` -- mock constants

Import từ `tests/helpers.ts`, không có phụ thuộc chéo giữa các nhóm test.

### Environment

- **OS:** Windows 11
- **Node version:** 20.x
- **Test runner:** Mocha 11.x
- **Dependencies:** playwright-core, BABLOSOFT_KEY, tests/helpers.ts

## Nguyên nhân gốc rễ

- Khi viết smoke test ban đầu, ưu tiên hoàn thành nhanh nên gộp toàn bộ vào một file.
- Các nhóm test không chia sẻ trạng thái hay biến với nhau, nên việc gộp chung là không cần thiết.
- Mỗi nhóm test dùng `createEngine()` hoặc `withEngine()` riêng biệt, không có shared fixture.
- `Error Handling` chiếm gần 40% nội dung file (47/129 dòng), vốn là nhóm có thể đứng riêng.

## Tác động

| Tác động | Mức độ | Ai bị ảnh hưởng | Chi tiết |
|----------|--------|-----------------|----------|
| Khó chạy test riêng lẻ | Thấp | Developer | Muốn chạy chỉ error handling hoặc newFingerprint phải dùng `--grep` hoặc comment code. |
| Dễ conflict | Thấp | Developer | Khi thêm smoke test mới dễ chạm vào cùng file với người khác. |
| Phải biên dịch lại toàn bộ | Thấp | Developer | Với dự án lớn hơn, mỗi lần sửa 1 test nhỏ đều phải recompile cả file. |
