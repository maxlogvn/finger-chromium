# Spec: Bug #20 — Hardcoded `await setTimeout(2000)` bên trong async-lock

> Tuân thủ quy ước code tại [CONVENTIONS.md](../CONVENTIONS.md).

## Mô tả

Giảm thời gian chết (dead wait) trong hàm `synchronize()` từ 4 giây xuống ~1 giây bằng cách giảm `setTimeout` từ 2000ms xuống 500ms, đồng thời cho phép cấu hình polling interval qua tham số `pollInterval`.

## Yêu cầu

- `synchronize()` không được chờ quá 1.5 giây cho hai lần write (so với 4 giây hiện tại).
- User có thể cấu hình polling interval nếu engine cần thời gian lâu hơn để đọc file.
- Backward compatible: không thay đổi API public (là internal function, nhưng vẫn được export).
- Giá trị `pollInterval` mặc định là 500ms, tối thiểu 100ms.

## Thiết kế

Tham khảo design: `docs/designs/bug-020-setTimeout-async-lock.design.md`

Thay đổi trên file `src/plugin/config.ts`:
- Hàm `synchronize()` nhận thêm tham số `pollInterval?: number` (mặc định 500ms).
- `await setTimeout(2000)` được thay bằng `await setTimeout(pollInterval)`.
- Validation: `pollInterval` < 100ms thì clamp lên 100ms.

## API / Data flow

### Hiện tại

```
synchronize(id, pwd, bounds, action)
  → lock.acquire(id)
    → write BAS_NOT_SET → setTimeout(2000)
    → call action() → write real values → setTimeout(2000)
```

### Sau fix

```
synchronize(id, pwd, bounds, action, pollInterval?)
  → lock.acquire(id)
    → write BAS_NOT_SET → setTimeout(pollInterval ?? 500)
    → call action() → write real values → setTimeout(pollInterval ?? 500)
```

## Components

- `src/plugin/config.ts` (sửa) — thêm tham số `pollInterval`, giảm timeout.

## Xử lý lỗi

- `pollInterval` âm → clamp về mặc định 500ms.
- `pollInterval` < 100ms → clamp lên 100ms (tránh busy-wait gây CPU spike).
- `pollInterval` không phải number → dùng mặc định 500ms.

## Kiểm tra

- Happy path: synchronize với pollInterval mặc định (500ms), verify thời gian < 1.5s.
- Edge case: pollInterval = 0 → clamp lên 100ms.
- Edge case: pollInterval âm → dùng mặc định 500ms.
- Backward compatible: gọi synchronize không truyền pollInterval → dùng 500ms.
