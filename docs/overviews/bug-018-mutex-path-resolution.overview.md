# Overview: Mutex path resolution sai sau khi tsup bundle (Issue #18)

## Tóm tắt

Đã fix path resolution trong `src/plugin/mutex/index.ts` — thay hardcoded `'../../../'` bằng `resolvePackageRoot()` dynamic function. Hàm này tìm package root dựa trên `package.json` name, hoạt động chính xác cả khi dev (source) và sau tsup bundle (dist).

## Kết quả thực hiện

| Bước | Kế hoạch | Thực tế | Sai lệch |
|---|---|---|---|
| Bước 1: Thêm resolvePackageRoot() | Viết hàm tìm package root từ __dirname | Đã thêm — tương tự pattern trong engine.ts | Không có |
| Bước 2: Xoá hardcoded path | Xoá `'../../../'` | Đã xoá và thay bằng `resolvePackageRoot()` | Không có |
| Bước 3: Kiểm tra | lint, build, test trên Windows | Pass | Không có |

## Sai lệch đáng chú ý

Không có.

## Tài liệu liên quan

- `docs/designs/mutex-path-resolution.design.md`
- `docs/specs/mutex-path-resolution.spec.md`
- `src/plugin/mutex/index.ts` — sửa code
- `docs/KNOWN_ISSUES.md` — chuyển #18 từ OPEN sang FIXED

## Ghi chú

- `resolvePackageRoot()` cũng được dùng trong `connector/engine.ts` — đảm bảo consistency.
- Mutex native module (`mutex.node`) vẫn nằm trong `plugin/mutex/` relative to package root.
