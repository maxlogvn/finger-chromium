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
6. [Roadmap dự án](ROADMAP.md) — tiến độ các tính năng

---

## Cấu trúc thư mục tài liệu

```
docs/
├── designs/       # <tên>.design.md      -- tài liệu thiết kế, brainstorm
├── specs/         # <tên>.spec.md        -- đặc tả chi tiết tính năng
├── plans/         # <tên>.plan.md        -- kế hoạch thực hiện
├── overviews/     # <tên>.overview.md    -- báo cáo tổng quan kết quả thực hiện plan
├── products/      # <tên>.product.md     -- tài liệu tính năng (đọc để hiểu tính năng)
├── templates/     # template cho từng loại tài liệu
│   ├── design.template.md
│   ├── spec.template.md
│   ├── plan.template.md
│   ├── overview.template.md
│   └── product.template.md
├── KNOWN_ISSUES.md -- danh sách bug và vấn đề đã biết
├── ROADMAP.md     -- theo dõi tiến độ tất cả tính năng
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

## Known Issues

Hiện có **1 issue OPEN** đang cần xử lý. (Xem [KNOWN_ISSUES.md](KNOWN_ISSUES.md) #2) Xem chi tiết tại [KNOWN_ISSUES.md](KNOWN_ISSUES.md).