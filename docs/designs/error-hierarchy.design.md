# Design: Hệ thống lỗi (Error Hierarchy)

## Vấn đề

Khi engine hoặc API gặp lỗi, cần phân loại rõ ràng để:
- Người dùng biết chính xác lỗi gì và cách xử lý
- Code có thể bắt từng loại lỗi riêng biệt
- Tránh dùng Error thô, khó debug

## Giải pháp

Tạo class hierarchy với `PluginError` làm base:

```
PluginError (base)
├── MissingKeyError      -- thiếu key bảo mật
├── InvalidEngineError   -- engine chưa tải/giải nén
├── EngineTimeoutError   -- timeout khởi động engine
└── RequestTimeoutError  -- timeout request
```

Nguyên tắc:
- Luôn throw `PluginError`, không dùng `Error` thô
- Mỗi lỗi kèm message hướng dẫn khắc phục
- Dùng `dedent` để giữ message đẹp

---

Xem thêm: [Spec](../specs/error-hierarchy.spec.md) | [Plan](../plans/error-hierarchy.plan.md)
