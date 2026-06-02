# Design: Hệ thống kiểu

## Vấn đề

Fingerprint, proxy, profile đều có cấu trúc phức tạp với nhiều option enum và boolean. Cần TypeScript type để kiểm tra compile-time.

## Các kiểu chính

### `PWChromium` interface (164 dòng)

Interface fluent API với 9 methods, mỗi method có JSDoc giải thích lifecycle. Dùng generic `object` cho option params -- linh hoạt nhưng vẫn type-safe.

### `FetchOptions` (137 dòng)

Có các string literal union type:
- `Time = '*' | '15 days' | '30 days' | '60 days'` -- lọc fingerprint theo thời gian thu thập
- `Tag = '*' | 'Desktop' | 'Mobile' | 'Microsoft Windows' | ...` -- lọc theo thiết bị

Dùng `'current'` làm magic value cho `minBrowserVersion`/`maxBrowserVersion` -- engine sẽ tự match với version trình duyệt đang cài.

### `ProxyOptions` (210 dòng)

Option phức tạp nhất với 19 field. Nhiều field chấp nhận cả scalar lẫn object `{ v4: ..., v6: ... }` -- ví dụ `ipExtractionMethod`, `ipExtractionParam`.

Dùng kỹ thuật branded type `IPString = string & {}` để phân biệt IP string với string thường -- giúp type-checking tốt hơn mà không ảnh hưởng runtime.

### IPString brand trick

```ts
type IPString = string & {};
```

Đây là kỹ thuật nominal typing trong TypeScript structural type system. Brand prop `{}` không tồn tại ở runtime, chỉ dùng để TypeScript phân biệt kiểu. Thực tế `IPString` vẫn là `string`, chỉ có ý nghĩa lúc compile.

---

Xem thêm: [Spec](../specs/type-system.spec.md) | [Plan](../plans/type-system.plan.md)
