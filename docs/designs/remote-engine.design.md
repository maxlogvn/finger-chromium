# Design: RemoteEngine -- Tải, giải nén và IPC

## Vấn đề

Engine là binary (FastExecuteScript.exe) từ bablosoft. Cần:
- Tải xuống, verify SHA1 checksum
- Giải nén, copy project.xml, tạo settings
- Giao tiếp qua file-based IPC

## Giải pháp

Class `RemoteEngine` extends `EventEmitter`:
- File-based IPC: ghi JSON request, chokidar watch response
- Cache metadata theo phiên bản
- Tự động dọn dẹp request file cũ (orphaned)

---

Xem thêm: [Spec](../specs/remote-engine.spec.md) | [Plan](../plans/remote-engine.plan.md)
