# Công nghệ sử dụng

> Giải thích vai trò và lý do chọn từng package trong dự án, giúp hiểu kiến trúc và quyết định thiết kế.

---

## Core

### `<tên-package>` <phiên bản>

**Vai trò:** <Mô tả cụ thể package này làm gì trong dự án, ở file nào, dùng API gì.>
Ví dụ: "Cung cấp type định nghĩa (`BrowserContext`, `BrowserType`, `Page`) cho Playwright adapter. Runtime load động qua `Loader` class -- không import tĩnh ở top-level."

**Lý do chọn:**
- <Lý do 1: tại sao không dùng built-in hoặc giải pháp khác.>
- <Lý do 2: đặc điểm kỹ thuật quan trọng.>
- <Lý do 3: edge case / platform support.>

*(Thêm các package Core khác nếu cần)*

---

## <Nhóm chức năng 1>

### `<tên-package>` <phiên bản>

**Vai trò:** <Mô tả.>

**Lý do chọn:**
- ...

### `<tên-package>` <phiên bản>

**Vai trò:** <Mô tả.>

**Lý do chọn:**
- ...

> **Tại sao cần cả 2?** <Giải thích nếu có 2 package cùng nhóm nhưng khác mục đích.>
> | Package A | Package B |
> |---|---|
> | <Đặc điểm 1> | <Đặc điểm 1> |
> | <Đặc điểm 2> | <Đặc điểm 2> |

*(Thêm các nhóm khác nếu cần)*

---

## Architectural Notes (tuỳ chọn)

### <Tên quy trình hoặc khái niệm kiến trúc>

```
<sơ đồ ASCII hoặc Mermaid>
```

### <Hai đường X độc lập>

```
Đường 1 (low-level, không qua <framework>):
  <file> → <bước> → <bước> → <kết quả>

Đường 2 (high-level, qua <framework>):
  <file> → <bước> → <bước> → <kết quả>
```

### Tầng kiến trúc

```
┌─────────────────────────────────────┐
│           <Tên tầng>                │
│  <Mô tả ngắn>                      │
├─────────────────────────────────────┤
│           <Tên tầng>                │
│  <Mô tả ngắn>                      │
└─────────────────────────────────────┘
```
