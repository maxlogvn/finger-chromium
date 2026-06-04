# Spec: Sửa lỗi biến `serviceKey` ở module scope gây dùng chung key giữa các instance

> Tuân thủ quy ước code tại [CONVENTIONS.md](../CONVENTIONS.md).

## Mô tả

Biến `let serviceKey` ở `src/plugin/index.ts:61` là module-level state — tất cả `FingerprintPlugin` instance chia sẻ một key. Instance A gọi `setServiceKey(keyA)`, instance B gọi `setServiceKey(keyB)` dẫn đến A dùng sai key. Cần đưa `serviceKey` vào instance private field `#serviceKey`.

## Yêu cầu

- `setServiceKey(key)` chỉ ảnh hưởng đến instance gọi nó, không ảnh hưởng instance khác.
- `fetch()` và `_launch()` dùng `#serviceKey` của instance hiện tại.
- `_launch()` vẫn dùng `options.key` làm ưu tiên cao nhất (fallback xuống `#serviceKey` nếu không có).
- Public API `setServiceKey()` không thay đổi chữ ký (signature).
- Module-level `let serviceKey` bị xoá.
- Section divider "Constants" bị xoá vì không còn constants nào ở module scope.

## Thiết kế

Tham chiếu design doc: `docs/designs/bug-032-servicekey-module-scope.design.md`

Chuyển module-level `let serviceKey` thành instance private field `this.#serviceKey`. Đây là thay đổi nhỏ, không ảnh hưởng kiến trúc tổng thể.

## API / Data flow

- **Trước:**
  ```
  let serviceKey: string | undefined;

  class FingerprintPlugin {
    setServiceKey(key) { serviceKey = key; }
    fetch() { ... key: serviceKey ... }
    _launch() { ... key: typeof options.key === 'string' ? options.key : serviceKey ... }
  }
  ```

- **Sau:**
  ```
  class FingerprintPlugin {
    #serviceKey: string | undefined;

    setServiceKey(key) { this.#serviceKey = key; }
    fetch() { ... key: this.#serviceKey ... }
    _launch() { ... key: typeof options.key === 'string' ? options.key : this.#serviceKey ... }
  }
  ```

## Components

| File | Thay đổi |
|---|---|
| `src/plugin/index.ts` | Xoá `let serviceKey` (dòng 61). Thêm `#serviceKey` field. Sửa `setServiceKey()`, `fetch()`, `_launch()`. Xoá section divider "Constants" nếu còn trống. |

## Xử lý lỗi

Không có xử lý lỗi đặc biệt — `#serviceKey` mặc định là `undefined`, behavior giống module-level: khi chưa set key và không truyền `options.key`, API call sẽ fail ở tầng connector với lỗi tương ứng.

## Kiểm tra

- **Happy path:** Instance A set key, fetch() dùng key A. Instance B set key khác, fetch() dùng key B. Không chồng chéo.
- **Edge case:** Không gọi `setServiceKey()`, `#serviceKey` là `undefined` — fetch() fail như cũ.
- **Edge case:** `_launch()` truyền `options.key` — dùng `options.key` thay vì `#serviceKey`.
- **Test hiện tại:** Các test gọi `plugin.setServiceKey()` trên cùng instance vẫn pass.
- **Test mới:** Cần thêm test với 2 instance song song để verify không shared state.
