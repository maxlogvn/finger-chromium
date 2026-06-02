# Design: File Cleanup Daemon

## Vấn đề

Thư mục tạm (temp profiles, engine cache) tích tụ sau nhiều lần chạy. Cần dọn dẹp tự động.

## Giải pháp

Daemon chạy nền với timer 15s:
- `proper-lockfile` để kiểm tra file đang dùng
- ignore/include pattern để lock/unlock theo PID
- Chỉ xoá file/thư mục không bị lock

## Safety

Không xoá file của process đang chạy — kiểm tra lockfile trước khi delete.

---

Xem thêm: [Spec](../specs/file-cleanup-daemon.spec.md) | [Plan](../plans/file-cleanup-daemon.plan.md)
