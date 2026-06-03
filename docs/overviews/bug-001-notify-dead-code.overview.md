# Overview: Bug #1 — `notify()` dead code

## Tom tắt

Đã fix `notify()` dead code bằng cách tích hợp đúng luồng: import `notify()` vào `connector/index.ts` và gọi khi engine trả về lỗi "key is missing". `notifyTimer` từ dead code trở thành timer thật sự quản lý vòng đời của thông báo upgrade.

## Kết quả thực hiện

| Bước | Kế hoạch | Thực tế | Sai lệch |
|---|---|---|---|
| Bước 1: Import `notify` | Thêm import `./utils` | Import thành công | Không có |
| Bước 2: Gọi `notify()` trong `api()` | Gọi `notify(params.key)` trước `throw MissingKeyError` | Gọi đúng luồng, gán timer vào `notifyTimer` | Không có |
| Bước 3: Kiểm tra biên dịch và lint | `lint` + `typecheck` pass | Lint pass (0 error, 16 pre-existing warnings), typecheck pass cho file sửa (pre-existing pcapServer errors) | Pre-existing pcapServer undefined error không liên quan |

## Sai lệch đáng chú ý

- Phát hiện type mismatch: `notify()` trả về `ClearableTimer` (`Parameters<typeof clearTimeout>[0]`) rộng hơn `ReturnType<typeof setTimeout>` của `notifyTimer`. Fix bằng cách đổi kiểu `notifyTimer` sang `Parameters<typeof clearTimeout>[0] | undefined`.

## Tài liệu liên quan

- `docs/designs/bug-001-notify-dead-code.design.md`
- `docs/specs/bug-001-notify-dead-code.spec.md`
- `docs/plans/bug-001-notify-dead-code.plan.md`
- `docs/overviews/bug-001-notify-dead-code.overview.md`
- `docs/Welcome.md` — sửa số issue (4 -> 5 -> 4 sau fix)
- `src/plugin/connector/index.ts` — sửa code

## Ghi chú

- `pcapServer/index.ts` có 2 lỗi type pre-existing (`server` possibly undefined) -- nên fix riêng.
