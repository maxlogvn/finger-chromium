# Overview: Dọn dẹp file engine corrupt khi download thất bại

## Tóm tắt

Đã fix bug #24: hàm `download()` trong `src/plugin/connector/engine.ts` thiếu cơ chế dọn dẹp file `.zip` partial khi download thất bại. Chuyển sang cơ chế temp file + rename để đảm bảo không có file corrupt tồn đọng.

## Kết quả thực hiện

| Bước | Kế hoạch | Thực tế | Sai lệch |
|---|---|---|---|
| Bước 1: Đổi `createWriteStream(filePath)` → `createWriteStream(tmpPath)` | Ghi vào file `.tmp` | Đã thực hiện đúng | Không có |
| Bước 2: Wrap toàn bộ trong `try/catch`, cleanup `unlink(tmpPath)` trong catch | Xoá file `.tmp` khi lỗi, throw lại lỗi gốc | Đã thực hiện đúng | Không có |
| Bước 3: Thêm `fs.rename(tmpPath, filePath)` sau pipeline thành công | Rename với fallback cross-device | Đã thực hiện đúng | Không có |

## Sai lệch đáng chú ý

Không có.

## Tài liệu liên quan

- `docs/designs/bug-024-download-cleanup.design.md`
- `docs/specs/bug-024-download-cleanup.spec.md`
- `docs/plans/bug-024-download-cleanup.plan.md`
- Các file đã cập nhật ở bước rà soát:
  - `docs/KNOWN_ISSUES.md` — chuyển issue #24 từ OPEN sang FIXED, cập nhật số lượng issues

## Ghi chú

Cơ chế temp file + rename an toàn hơn `finally` cleanup vì loại trừ hoàn toàn khả năng file corrupt ngay cả khi process bị kill giữa pipeline. Fallback `copyFile` + `unlink` xử lý trường hợp cross-device rename trên Windows.
