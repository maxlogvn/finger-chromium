# Plan: Process không tự động thoát sau khi quit() (Issue #21)

## Các bước thực hiện

- [x] Bước 0: Tài liệu thiết kế (design, spec)
    - File liên quan: `docs/designs/bug-021-pcap-unref.design.md`, `docs/specs/bug-021-pcap-unref.spec.md`

- [ ] Bước 1: Thêm `svr.unref()` trong callback `onListening`
    - Làm gì: Trong `pcapServer/index.ts`, thêm `svr.unref()` sau dòng `resolve(address.port)` trong callback `onListening`.
    - File liên quan: `src/plugin/connector/pcapServer/index.ts:48`
    - Ghi chú: `unref()` là synchronous, không throw, không cần try/catch. Server vẫn nhận connection nhưng không giữ event loop.

- [ ] Bước 2: Xoá unused import `path` nếu có
    - Làm gì: (nếu có) Kiểm tra nếu có import `path` thừa sau khi sửa — không cần thiết cho fix này.

- [ ] Bước 3: Chạy kiểm tra
    - Làm gì: Chạy `npm run lint`, `npm run typecheck`, `npm test`.
    - Phụ thuộc: Yêu cầu bước 1 hoàn thành.

## Kiểm tra

- `npm run lint` — ESLint không báo lỗi mới.
- `npm run typecheck` — TypeScript compile không lỗi.
- `npm test` — Mocha tests pass.

## Ghi chú

- Fix rất nhỏ (1 dòng), không ảnh hưởng đến module khác.
- `once()` wrapper của `listen()` đảm bảo chỉ một server được tạo — `unref()` chỉ gọi một lần duy nhất.
