# Design: Bug #19 — `isBrowser` type guard dùng string check fragile

## Bối cảnh

`isBrowser()` ở `src/adapter/playwright/utils.ts:19-23` dùng duck-typing với một property duy nhất (`'version'`) để phân biệt `Browser` vs `BrowserContext`. Nếu Playwright thay đổi API, type guard sẽ sai và `bindHooks()`/`onClose()` sẽ xử lý sai đối tượng.

## Câu hỏi làm rõ

- `instanceof` có dùng được không? → Không. `Browser` là interface, không phải class runtime. `instanceof` chỉ hoạt động với class/constructor.
- Playwright có property nào chỉ có trên `Browser` không? → Có: `isConnected`, `contexts`, `version` đều là method riêng của `Browser`.

## Các phương án

### Phương án 1: Duck-typing đa property

Kiểm tra đồng thời 3 method chỉ có trên `Browser`: `version`, `isConnected`, `contexts`.

```typescript
const isBrowser = (target: unknown): target is Browser =>
  typeof target === 'object' &&
  target !== null &&
  'isConnected' in target &&
  'contexts' in target &&
  'version' in target &&
  typeof (target as Browser).version === 'function';
```

- **Ưu điểm:** Giảm gần như về 0 khả năng false positive. Nếu Playwright đổi API, cả 3 method cùng biến mất là rất khó.
- **Nhược điểm:** Hơi dài hơn bản hiện tại, nhưng vẫn rất gọn.

### Phương án 2: Dùng property khác biệt nhất (`isConnected`)

Chỉ check `'isConnected' in target` thay vì `'version'`.

- **Ưu điểm:** Đơn giản, chỉ đổi 1 dòng.
- **Nhược điểm:** Vẫn là single-property duck-typing, mức độ rủi ro tương đương hiện tại.

## Giải pháp được chọn

- **Phương án AI đề xuất:** Phương án 1 (đa property).
- **Phương án được chọn:** (chờ người duyệt)
- **Lý do:** Dù bug này xác suất thấp, fix một lần với độ an toàn cao hơn giúp tránh debug khó chịu sau này. Code thêm 2 dòng là chấp nhận được.

## Kế hoạch hậu design

1. Viết spec từ design này.
2. Viết plan — single-step: sửa hàm `isBrowser()` trong `utils.ts`.
3. Code — thay inline.
4. Kiểm tra: lint, typecheck, build, test.
5. Cập nhật KNOWN_ISSUES.md — chuyển #19 sang FIXED.
