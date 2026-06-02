# Design: Hệ thống lỗi

## Vấn đề

Các lỗi từ nhiều tầng (engine binary, network, config) cần được chuẩn hoá thành dạng có tổ chức, tránh `Error` raw.

## Giải pháp

Dùng class hierarchy với `PluginError` làm base, kế thừa `Error`:

```
Error
└── PluginError
    ├── MissingKeyError   -- thiếu key bảo mật
    ├── InvalidEngineError -- engine chưa tải/giải nén
    ├── EngineTimeoutError -- timeout engine startup
    └── RequestTimeoutError -- timeout request
```

### Cơ chế

- `PluginError` tự set `this.name = constructor.name` -- giúp `instanceof` hoạt động ngay cả khi class bị minified.
- Dùng `Error.captureStackTrace` để clean stack trace -- tránh noise từ chính error constructor.
- `Symbol.toStringTag` getter trả về `constructor.name` -- cho phép `Object.prototype.toString.call(err)` trả đúng tên class.

### Message pattern

Dùng `dedent` template literal để viết message nhiều dòng -- kết hợp tiếng Việt với thuật ngữ tiếng Anh.

Ví dụ `MissingKeyError`:
```
Key bi thieu hoac khong hop le!
Key can de apply fingerprint, khong chi de fetch.
Nang cap len BASIC/PRO de co service key."
```

### Xử lý lỗi ở tầng connector

Trong `connector/index.ts`, khi nhận response từ engine binary có field `error`, code kiểm tra nội dung:
- Nếu error chứa `'key is missing'` -> throw `MissingKeyError`
- Nếu khác -> throw `PluginError`

Đây là điểm chuẩn hoá lỗi duy nhất từ raw engine response.

---

Xem thêm: [Spec](../specs/error-hierarchy.spec.md) | [Plan](../plans/error-hierarchy.plan.md)
