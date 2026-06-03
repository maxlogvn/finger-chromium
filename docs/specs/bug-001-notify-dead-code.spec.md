# Spec: Bug #1 — `notify()` dead code

> Tuân thủ quy ước code tại [CONVENTIONS.md](../CONVENTIONS.md).

## Mô tả

`notify()` trong `src/plugin/connector/utils.ts` được định nghĩa để hiển thị thông báo nâng cấp khi thiếu private key, nhưng không được import bởi bất kỳ file nào. `notifyTimer` trong `src/plugin/connector/index.ts` được khai báo và dùng trong `clearTimeout(notifyTimer)` nhưng không bao giờ được gán giá trị. Cần import và tích hợp `notify()` đúng luồng vào hàm `api()`.

## Yêu cầu

- Import `notify()` từ `./utils` vào `src/plugin/connector/index.ts`.
- Gọi `notify(key)` trong `api()` khi phát hiện thiếu key (trước khi throw `MissingKeyError`).
- `notify()` trả về timer handle -- gán vào `notifyTimer` để `clearTimeout` trong `finally` vẫn có tác dụng.
- `notify()` giữ nguyên logic: chỉ hiển thị khi `!key && process.env.NODE_ENV !== 'test'`.

## Thiết kế

Tham chiếu design: `docs/designs/bug-001-notify-dead-code.design.md` (Phương án 2).

## API / Data flow

```
api(name, params) được gọi
  -> lock.acquire('client')
    -> engine.runFunction(name, params)
    -> nếu error chứa 'key is missing':
       -> gọi notify(key)  -- upsell message + delay 20s warning
       -> gán kết quả vào notifyTimer
       -> throw MissingKeyError
    -> finally: clearTimeout(notifyTimer)  -- xoá timer nếu request thành công hoặc lỗi xong
```

**Input hiện tại của `api()`:**
- `params.key?: string` -- private key từ client

**Output:** Không đổi -- `notify()` chỉ in console.log, không ảnh hưởng đến kết quả trả về.

## Components

- `src/plugin/connector/utils.ts` -- **Không sửa** (giữ nguyên `notify()`).
- `src/plugin/connector/index.ts` -- **Sửa:**
  - Thêm import `{ notify } from './utils'`.
  - Trong `api()`, gọi `notify(params.key)` ở nhánh `throw new MissingKeyError(...)`.
  - Gán kết quả vào `notifyTimer`.

## Xử lý lỗi

| Tình huống | Xử lý |
|---|---|
| `notify()` throw lỗi (unlikely) | Không bắt -- crash rõ ràng hơn silent fail. `notify()` chỉ dùng `console.log` nên không throw. |
| `key` hợp lệ | `notify()` trả về `undefined`, timer không được set. |

## Kiểm tra

### Happy path
- Gọi `api()` với key hợp lệ → không in thông báo upgrade, request thành công.
- Gọi `api()` với key null/undefined → `notify()` in thông báo upgrade, throw `MissingKeyError`.

### Edge case
- `NODE_ENV === 'test'` → `notify()` skip dù key null.
- Gọi nhiều lần với key null → `notifyOnce` + `once(console.log)` đảm bảo chỉ in một lần.

### Error case
- `notify()` không throw trong mọi trường hợp (chỉ dùng console.log).
