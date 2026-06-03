# Overview: Bug #12 — PCAP server side effect ở module scope

## Tóm tắt

Đã chuyển `pcapServer.listen()` từ module scope (top-level code) sang lazy init trong `api()` —
dùng module-level promise `ensureInit()` để chỉ khởi động PCAP server một lần duy nhất ở lần gọi API đầu tiên.
Tất cả các bước trong plan hoàn thành đúng kế hoạch.

## Kết quả thực hiện

| Bước | Kế hoạch | Thực tế | Sai lệch |
|---|---|---|---|
| Bước 1: Thêm `initPromise` và `ensureInit()` | Viết biến và hàm lazy init | Giống kế hoạch | Không có |
| Bước 2: Xoá module-scope `pcapServer.listen()` cũ | Xoá đoạn ở lines 63-66 | Giống kế hoạch | Không có |
| Bước 3: Thêm `await ensureInit()` vào đầu `api()` | Gọi trước `lock.acquire()` | Giống kế hoạch | Không có |

## Sai lệch đáng chú ý

Không có.

## Tài liệu liên quan

- `docs/designs/bug-012-pcap-side-effect.design.md`
- `docs/specs/bug-012-pcap-side-effect.spec.md`
- `docs/plans/bug-012-pcap-side-effect.plan.md`
- `docs/KNOWN_ISSUES.md` — chuyển #12 từ OPEN sang FIXED
- `src/plugin/connector/index.ts` — sửa code

## Ghi chú

- `pcapServer.listen()` đã dùng `once()` nên gọi nhiều lần vẫn an toàn — `ensureInit()` chỉ giúp `api()` await đúng lúc.
- Lần gọi API đầu tiên sẽ chậm hơn một chút vì phải chờ PCAP server start (giống như trước đây khi module được import).
- Các lần gọi sau không bị ảnh hưởng.
