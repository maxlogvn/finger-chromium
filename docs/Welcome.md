# fingerprint-chromium-engine

Thư viện Node.js giúp điều khiển trình duyệt Chromium với fingerprint thật, bypass bot detection hiệu quả.

---

## Ngữ cảnh dự án

| Thuộc tính | Mô tả |
|---|---|
| **Loại dự án** | Thư viện Node.js điều khiển Chromium chống bot detection |
| **Người dùng cuối** | Developer dùng Playwright cần fingerprint thật, proxy đồng bộ, profile bền vững |
| **Platform** | Windows 32-bit & 64-bit |
| **Cơ chế cốt lõi** | Fingerprint thu thập từ thiết bị thực tế, inject ở tầng C/C++ trước khi trình duyệt khởi động — không có dấu hiệu bị override ở JS layer |

> **Kỹ thuật inject:** Engine nhị phân (C/C++) được load trước khi Chromium chạy, ghi đè các browser API ở tầng native. Xem chi tiết tại [STACK.md](STACK.md) và các file `*.design.md` trong `docs/designs/`.

---

## Bắt đầu nhanh

Đọc theo thứ tự này để onboard nhanh nhất:

**Bắt buộc đọc trước:**
1. [README tổng quan](../README.md) — mô tả dự án, cách cài đặt, ví dụ sử dụng
2. [Hướng dẫn cho OpenCode agent](../AGENTS.md) — quy tắc làm việc với codebase
3. [Quy ước code](CONVENTIONS.md) — naming, formatting, patterns bắt buộc tuân theo

**Đọc khi cần:**
4. [Công nghệ sử dụng](STACK.md) — dependencies, lý do chọn từng công nghệ
5. [Quy trình phát triển tính năng](WORKFLOW.md) — flow từ design → spec → plan → implement

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
├── adapter/        # Playwright adapter (chromium.ts, engine.ts, loader.ts, ...)
├── common/         # Tiện ích dùng chung
├── loader/         # Tải xuống engine, quản lý file nhị phân
├── plugin/         # Plugin hệ thống (launcher, connector, mutex, browser, ...)
├── types/          # TypeScript type definitions
└── index.ts        # Export công khai
```

---

## Tracking

Feature và issue fix được theo dõi tại [`TRACKING.md`](TRACKING.md).

---


