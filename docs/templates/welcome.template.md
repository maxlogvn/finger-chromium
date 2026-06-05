# <Tên dự án>

> <Một câu mô tả dự án là gì, làm được gì.>
Ví dụ: "Thư viện Node.js giúp điều khiển trình duyệt Chromium với fingerprint thật, bypass bot detection hiệu quả."

---

## Ngữ cảnh dự án

| Thuộc tính | Mô tả |
|---|---|
| **Loại dự án** | <Ví dụ: Thư viện Node.js / CLI tool / Ứng dụng web> |
| **Người dùng cuối** | <Ai sẽ dùng sản phẩm này?> |
| **Platform** | <Hệ điều hành / môi trường hỗ trợ> |
| **Cơ chế cốt lõi** | <Mô tả một câu về cách hoạt động chính> |

> **Điểm nổi bật:** <Một đoạn ngắn về công nghệ/key differentiator. Xem chi tiết tại [STACK.md](STACK.md).>

---

## Bắt đầu nhanh

Đọc theo thứ tự này để onboard nhanh nhất:

**Bắt buộc đọc trước:**
1. [README tổng quan](../README.md) — mô tả dự án, cách cài đặt, ví dụ sử dụng.
2. [Hướng dẫn cho OpenCode agent](../AGENTS.md) — quy tắc làm việc với codebase (nếu có).
3. [Quy ước code](CONVENTIONS.md) — naming, formatting, patterns bắt buộc tuân theo.

**Đọc khi cần:**
4. [Công nghệ sử dụng](STACK.md) — dependencies, lý do chọn từng công nghệ.
5. [Quy trình phát triển tính năng](WORKFLOW.md) — flow từ design → spec → plan → implement.

---

## Cấu trúc thư mục tài liệu

```
docs/
├── designs/       # <tên>.design.md      -- tài liệu thiết kế, brainstorm
├── specs/         # <tên>.spec.md        -- đặc tả chi tiết tính năng
├── plans/         # <tên>.plan.md        -- kế hoạch thực hiện
├── overviews/     # <tên>.overview.md    -- báo cáo tổng quan kết quả thực hiện plan
├── products/      # <tên>.product.md     -- tài liệu tính năng (đọc để hiểu tính năng)
├── issues/        # <tên>.md             -- chi tiết từng issue
├── templates/     # template cho từng loại tài liệu
├── TRACKING.md    -- theo dõi feature và issue fix
├── NOTES.md       -- ghi chú kiến trúc và lưu ý phát triển
├── CONVENTIONS.md -- quy ước code
├── STACK.md       -- công nghệ sử dụng
├── WORKFLOW.md    -- quy trình phát triển tính năng
└── Welcome.md     -- giới thiệu tài liệu (file này)
```

---

## Cấu trúc thư mục source

```
src/
├── <module>/       # <Mô tả ngắn>
├── <module>/       # <Mô tả ngắn>
├── <module>/       # <Mô tả ngắn>
└── index.ts        # Export công khai
```

---

## Tracking

Feature và issue fix được theo dõi tại [`TRACKING.md`](TRACKING.md).

---
