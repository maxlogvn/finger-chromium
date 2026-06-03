# Overview: Bug #14 — RemoteEngine singleton dùng chung giữa các instance

## Tóm tắt

Đã refactor `RemoteEngine` từ singleton global thành factory pattern. Mỗi `FingerprintPlugin` instance tạo `Connector` riêng với `RemoteEngine` độc lập, giải quyết vấn đề `kill()` trên một instance ảnh hưởng đến instance khác và `setCwd()` thay đổi cấu hình toàn cục.

## Kết quả thực hiện

| Bước | Kế hoạch | Thực tế | Sai lệch |
|---|---|---|---|
| Task 1: Refactor Connector module | Xoá singleton engine, thêm class `Connector` | Hoàn thành | Không có |
| Task 2: Update FingerprintPlugin | Mỗi instance dùng `#connector` riêng | Hoàn thành | Không có |
| Task 3: Kiểm tra | typecheck, lint, build, test pass | 20/20 tests pass, lint 0 errors, build thành công | typecheck script không có trong package.json, chạy `tsc --noEmit` thấy 2 lỗi pre-existing ở pcapServer (không liên quan) |

## Sai lệch đáng chú ý

- **typecheck script:** AGENTS.md có đề cập `npm run typecheck` nhưng script này không tồn tại trong `package.json`. Khi chạy `tsc --noEmit` trực tiếp, thấy 2 lỗi pre-existing ở `src/plugin/connector/pcapServer/index.ts:44,48` (`'server' is possibly 'undefined'`) — không liên quan đến bug #14.
- **PCAP server cleanup:** Trong design ban đầu, `Connector.cleanup()` không đóng PCAP server vì là singleton dùng chung. Điều này khác với hành vi cũ (`cleanup()` gọi `pcapServer.close()`). PCAP server bây giờ chỉ đóng khi process kết thúc.

## Tài liệu liên quan

- `docs/designs/bug-014-remote-engine-factory.design.md`
- `docs/specs/bug-014-remote-engine-factory.spec.md`
- `docs/plans/bug-014-remote-engine-factory.plan.md`
- `docs/KNOWN_ISSUES.md` — chuyển #14 từ OPEN sang FIXED

## Ghi chú

- Cần thêm `typecheck` script vào `package.json` để nhất quán với AGENTS.md (không thuộc scope bug này).
- 2 lỗi TypeScript ở pcapServer nên được fix riêng (thuộc issue #15).
