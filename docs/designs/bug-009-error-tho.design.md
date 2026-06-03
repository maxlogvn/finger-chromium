# Design: Bug #9 — `BrowserEngine.launch()` dùng `Error` thô

## Bối cảnh

`BrowserEngine.launch()` tại `src/adapter/playwright/chromium.ts:136` throw `Error` thô khi phát hiện `launch()` đã được gọi trước đó:

```ts
throw new Error('[BrowserEngine] Phuong thuc launch() chi duoc goi mot lan.');
```

Điều này vi phạm CONVENTIONS.md, yêu cầu mọi lỗi engine phải dùng `PluginError` hoặc subclass tương ứng.

## Câu hỏi làm rõ

- `PluginError` đã được import trong chromium.ts chưa? → Chưa.
- Có trường hợp nào khác trong chromium.ts dùng `Error` thô không? → Chỉ một dòng duy nhất (line 136). Hai dòng `throw new Error(...)` khác ở `newContext()` (line 164 và 167).
- Có nên fix luôn cả 2 dòng trong `newContext()` không? → Có, cùng vấn đề, cùng file.

## Các phương án

### Phương án 1: Chỉ fix line 136
Thêm import `PluginError` và đổi line 136.

- **Ưu điểm:** Can thiệp tối thiểu.
- **Nhược điểm:** Vẫn còn `Error` thô ở `newContext()` — fix chưa triệt để.

### Phương án 2: Fix toàn bộ `Error` thô trong `chromium.ts`
Fix cả 3 dòng (line 136, 164, 167).

- **Ưu điểm:** Giải quyết triệt để vấn đề trong file.
- **Nhược điểm:** Không có.

## Giải pháp được chọn

### Phương án AI đề xuất: Phương án 2
Cùng vấn đề, cùng file — fix một lần cho cả 3 `Error` thô trong `chromium.ts`.

### Phương án được chọn:
- **Lý do:** Triệt để, không để sót.
