> Quy trình chuẩn để phát triển tính năng mới hoặc fix issue. Cả developer và AI agent phải tuân theo.

---

## Sơ đồ quy trình

```
  1. [Chuẩn bị] ── tạo issue, nhánh git mới, cập nhật TRACKING.md (Đang làm)
        │
        ▼
  2. [Thiết kế] ── design → spec → plan (gate review từng bước)
        │
        ▼ ← NGƯỜI DUYỆT trước khi sang bước 3
  3. [Code] ── implement trên nhánh đã tạo
        │
        ▼
  4. [Code review] ── người duyệt code
        │
        ▼ (pass)
  5. [Kiểm tra] ── lint, typecheck, test
        │
        ├── Lỗi code ─────────── sửa tại chỗ → quay lại bước 5
        │
        └── Lỗi thiết kế ─────── quay lại bước 2
        │
        ▼ (pass)
  6. [Tài liệu + Commit] ── overview, product, git commit (trên nhánh)
        │
        ▼ ← NGƯỜI DUYỆT trước khi kết thúc
  7. [Kết thúc] ── gộp nhánh vào main, cập nhật TRACKING.md (Hoàn thành)
```

---

## Chi tiết từng bước

### 1. Chuẩn bị

Tạo nhánh git mới,issue, và đánh dấu đang làm trong TRACKING.md.

- **Input:** Ý tưởng hoặc quyết định phát triển tính năng / fix issue.
- **Output:** File issue tại `docs/issues/<tên>.md`, nhánh git mới từ `main`, entry trong TRACKING.md ở mục Đang làm.
- **Người:** Duyệt và quyết định tính năng nào được phát triển.
- **AI:** Tạo file `docs/issues/<tên>.md` theo template `known-issue.template.md`, tạo nhánh git mới, thêm entry vào TRACKING.md mục Đang làm.

---

### 2. Thiết kế

Viết 3 tài liệu theo thứ tự, mỗi tài liệu phải được duyệt trước khi sang tài liệu tiếp theo.

| Bước con | Nội dung | Template |
|---|---|---|
| Design | Brainstorm, đề xuất giải pháp, chọn phương án | [design.template.md](templates/design.template.md) |
| Spec | Đặc tả chi tiết — mô tả, yêu cầu, thiết kế, luồng dữ liệu, components, xử lý lỗi, kiểm thử | [spec.template.md](templates/spec.template.md) |
| Plan | Kế hoạch từng bước cụ thể — mỗi bước là hành động có thể thực thi | [plan.template.md](templates/plan.template.md) |

- **Input:** Yêu cầu tính năng / issue.
- **Output:** File design (`docs/designs/<tên>.design.md`), spec (`docs/specs/<tên>.spec.md`), plan (`docs/plans/<tên>.plan.md`).
- **Người:** Duyệt từng tài liệu.
- **AI:** Viết draft theo template, trình duyệt từng bước.

> **Gate:** Thiết kế phải được duyệt trước khi sang bước 3.

---

### 3. Code

Implement trên nhánh git đã tạo, theo plan đã duyệt. Tuân thủ `docs/CONVENTIONS.md`.

- **Input:** Plan đã duyệt.
- **Output:** Code hoàn chỉnh.
- **Người:** Không cần can thiệp trừ khi có vấn đề phát sinh.
- **AI:** Implement từng bước trong plan, đánh dấu `[x]` từng bước khi hoàn thành.

> **Chính sách sai lệch:** Nếu phát hiện plan không khả thi hoặc cần thay đổi scope, AI dừng ngay và báo cáo người — không tự ý điều chỉnh.

---

### 4. Code review

Người duyệt kiểm tra code trước khi merge.

- **Input:** Code hoàn chỉnh.
- **Output:** Code đã được review, sẵn sàng cho kiểm tra.
- **Người:** Review code — đảm bảo đúng convention, clean, không có logic sai.
- **AI:** Sửa code theo feedback nếu có.

Có thể gộp bước này với 5 (Kiểm tra) tuỳ mức độ phức tạp.

---

### 5. Kiểm tra

Chạy các kiểm tra chất lượng.

```bash
npm run lint       # ESLint + Prettier
npm run typecheck  # TypeScript types (tsc --noEmit)
npm run build      # tsup bundle (ESM + CJS)
npm test           # Mocha tests
```

- **Input:** Code đã review.
- **Output:** Code pass tất cả kiểm tra.
- **Người:** Báo cáo lỗi nếu phát hiện trong quá trình dùng thử.
- **AI:** Chạy lệnh kiểm tra, sửa lỗi nếu có.

**Phân loại lỗi:**

| Loại lỗi | Ví dụ | Xử lý |
|---|---|---|
| Lỗi code đơn thuần | Typo, off-by-one, missing null check | Sửa tại chỗ, chạy lại kiểm tra |
| Lỗi logic / thiết kế | Luồng dữ liệu sai, component sai trách nhiệm | Quay lại bước 2 (Thiết kế) |
| Lỗi kế hoạch | Bước thiếu, thứ tự sai | Quay lại bước 2, sửa plan |

---

### 6. Tài liệu + Commit

Viết tài liệu, rà soát các file bị ảnh hưởng, và commit code.

**Tài liệu:**

- **Feature task:** product doc (`docs/products/<tên>.product.md`) + overview (`docs/overviews/<tên>.overview.md`).
- **Issue task:** chỉ overview (`docs/overviews/<tên>.overview.md`).

**Rà soát file liên quan:** Kiểm tra các file sau có cần cập nhật theo thay đổi không:

| File | Cập nhật khi |
|---|---|---|
| `CONVENTIONS.md` | Giới thiệu pattern, quy ước, cấu trúc code mới |
| `STACK.md` | Thêm hoặc thay thế thư viện / công nghệ |
| `Welcome.md` | Thay đổi cách onboard hoặc tổng quan dự án |
| `TRACKING.md` | Bug/feature được thay đổi |
| `specs/*.spec.md` | Spec tính năng khác bị ảnh hưởng |
| `products/*.product.md` | Product doc tính năng khác bị ảnh hưởng về luồng hoặc API |

**Commit:** Git commit (nhiều lần nếu cần) trên nhánh hiện tại. Message tiếng Việt, có dấu đầy đủ.

- **Input:** Code pass kiểm tra + design/spec/plan.
- **Output:** Tài liệu đã viết, code đã commit trên nhánh.
- **Người:** Duyệt tài liệu và thay đổi.
- **AI:** Viết tài liệu, kiểm tra các file ảnh hưởng, commit code.

---

### 7. Kết thúc

Gộp nhánh vào `main` và chuyển trạng thái trong TRACKING.md.

- **Input:** Tính năng / issue đã hoàn thành, tài liệu đã viết, code đã commit trên nhánh.
- **Output:** Nhánh đã gộp vào `main`, entry trong TRACKING.md ở mục Đã hoàn thành, có link overview (và product nếu là feature).
- **Người:** Duyệt kết quả cuối cùng.
- **AI:** chuyển entry sang Đã hoàn thành, thêm link overview và product ,Gộp nhánh vào `main`.

---

## Xử lý khi bị từ chối ở gate

Khi người duyệt từ chối ở bất kỳ gate nào:

1. **Ghi nhận phản hồi:** AI ghi lại lý do từ chối và yêu cầu cụ thể.
2. **Xác định phạm vi sửa:**
   - **Thiết kế:** Sửa design/spec/plan tương ứng. Kiểm tra các tài liệu trước đó có cần cập nhật theo không.
   - **Code review:** Sửa code theo feedback.
   - **Tài liệu:** Sửa các file tài liệu theo yêu cầu.
3. **Trình lại:** Sau khi sửa, trình người duyệt kiểm tra lại — chỉ cần review phần đã thay đổi.

## Hủy tính năng giữa chừng

1. **Cập nhật TRACKING.md:** Chuyển trạng thái thành "Hủy" hoặc xóa mục.
2. **Dọn file tạm:** Design/spec/plan giữ lại kèm ghi chú "Đã hủy". Code revert commit hoặc commit riêng.
3. **Không tạo** product doc hay overview.

---

## Templates

| Template | Dùng ở bước |
|---|---|
| [known-issue.template.md](templates/known-issue.template.md) | 1 — tạo file issue trong `docs/issues/` |
| [design.template.md](templates/design.template.md) | 2 — design |
| [spec.template.md](templates/spec.template.md) | 2 — spec |
| [plan.template.md](templates/plan.template.md) | 2 — plan |
| [product.template.md](templates/product.template.md) | 6 — product doc (feature task) |
| [overview.template.md](templates/overview.template.md) | 6 — overview |

---

## Tham chiếu

- [Quy ước code](CONVENTIONS.md)
- [Theo dõi tiến độ](TRACKING.md)
- [Tổng quan dự án](Welcome.md)
