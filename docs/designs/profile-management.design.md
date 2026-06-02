# Design: Quản lý Profile

## Vấn đề

Browser cần lưu cookie, localStorage... Profile phải được copy sang thư mục tạm để tránh corrupt dữ liệu gốc khi browser đang chạy.

## Giải pháp

`AdapterDataManager`:
- `map(source)` → copy profile vào temp dir
- `map(temp, destination)` → copy từ temp về destination (khi quit)
- `unmap(temp)` → xoá temp dir
- `dispose()` → dọn toàn bộ

Profile bảo vệ bằng cơ chế temp dir, chỉ ghi vào thư mục gốc khi quit.

---

Xem thêm: [Spec](../specs/profile-management.spec.md) | [Plan](../plans/profile-management.plan.md)
