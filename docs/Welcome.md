
Chào mừng bạn đến với tài liệu dự án **fingerprint-chromium-engine**.

## Ngữ cảnh dự án

- **Loại dự án:** Thư viện Node.js điều khiển trình duyệt Chromium chống bot detection
- **Người dùng cuối:** Developer sử dụng Playwright cần fingerprint thật, proxy đồng bộ và profile bền vững
- **Platform:** Windows (32 bit + 64 bit)
- **Ghi chú đặc biệt:** Sử dụng fingerprint thu thập từ thiết bị thực tế, inject ở cấp độ C/C++ trước khi trình duyệt chạy -- không có dấu hiệu bị override

## Cấu trúc thư mục tài liệu

```
docs/
├── designs/       # <tên>.design.md -- tài liệu thiết kế, brainstorm
├── specs/         # <tên>.spec.md   -- đặc tả chi tiết tính năng
├── plans/         # <tên>.plan.md   -- kế hoạch thực hiện
├── overviews/     # <tên>.overview.md   -- báo cáo tổng quan kết quả thực hiện plan
├── products/      # <tên>.product.md    -- tài liệu tính năng (đọc để hiểu tính năng)
├── ROADMAP.md     -- theo dõi tiến độ tất cả tính năng
├── CONVENTIONS.md -- quy ước code
├── STACK.md       -- công nghệ sử dụng
└── Welcome.md     -- giới thiệu tài liệu
```

## Cấu trúc thư mục source

```
src/
├── adapter/        # Playwright adapter (chromium.ts, engine.ts, loader.ts, ...)
├── common/         # Tiện ích dùng chung
├── loader/         # Tải xuống engine, quản lý file nhị phân
├── plugin/         # Plugin hệ thống (launcher, connector, mutex, browser, ...)
├── types/          # TypeScript type definitions
├── index.ts        # Export công khai
```

## Bắt đầu

Đọc các file sau để hiểu dự án:
- [README tổng quan](../README.md)
- [Hướng dẫn cho OpenCode agent](../AGENTS.md)
- [Quy ước code](CONVENTIONS.md)
- [Công nghệ sử dụng](STACK.md)
- [Quy trình phát triển tính năng](WORKFLOW.md)
- [Roadmap dự án](ROADMAP.md)

## Cấu trúc docs

- `designs/*.design.md` -- tài liệu thiết kế
- `specs/*.spec.md` -- đặc tả chi tiết
- `plans/*.plan.md` -- kế hoạch thực hiện
- `overviews/*.overview.md` -- báo cáo tổng quan kết quả thực hiện plan
- `products/*.product.md` -- tài liệu tính năng
