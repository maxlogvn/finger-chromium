> Tài liệu này định nghĩa quy trình chuẩn để xây dựng một tính năng mới trong dự án. Cả developer (người) và AI agent đều phải tuân theo.

---

## Sơ đồ quy trình

```
  1. [Cập nhật Roadmap] ── đánh dấu "Đang làm"
        │
        ▼
  2. [Viết design] ── brainstorm, đề xuất giải pháp
        │
        ▼ ← NGƯỜI DUYỆT trước khi tiếp tục
  3. [Viết spec] ── đặc tả chi tiết
        │
        ▼ ← NGƯỜI DUYỆT trước khi tiếp tục
  4. [Viết plan] ── kế hoạch từng bước
        │
        ▼ ← NGƯỜI DUYỆT trước khi tiếp tục
  5. [Review tổng thể] ── kiểm tra consistency spec + plan
        │
        ▼ ← NGƯỜI DUYỆT trước khi tiếp tục
  6. [Code] ── thực hiện theo plan
        │
        ▼
  7. [Kiểm tra] ── lint, type-check, test
        │
        ├── Lỗi code ──────────────────────── sửa tại chỗ → lặp lại bước 7
        │
        └── Lỗi thiết kế / scope ──────────── quay lại bước 3 hoặc 4
        │
        ▼ (pass)
  8. [Rà soát tài liệu liên quan] ── tìm và cập nhật docs bị ảnh hưởng
        │
        ▼ ← NGƯỜI DUYỆT trước khi tiếp tục
  9. [Viết tài liệu] ── product doc + overview
        │
        ▼
 10. [Cập nhật Roadmap] ── đánh dấu "Hoàn thành"
```

---

## Chi tiết từng bước

### 1. Cập nhật Roadmap

Khi bắt đầu một tính năng mới, cập nhật trạng thái trong `docs/ROADMAP.md`.

- **Input:** Ý tưởng hoặc quyết định phát triển tính năng.
- **Output:** Roadmap đã cập nhật, tính năng được đánh dấu "Đang làm".
- **Người:** Duyệt và quyết định tính năng nào được phát triển.
- **AI:** Ghi vào Roadmap với trạng thái "Đang làm".

---

### 2. Viết design

Brainstorm và đề xuất giải pháp. Khám phá bối cảnh, đặt câu hỏi làm rõ yêu cầu, đề xuất các phương án, chọn một giải pháp.

- **Input:** Yêu cầu tính năng.
- **Output:** File design tại `docs/designs/<tên-tính-năng>.design.md`.
- **Người:** Chọn giải pháp cuối cùng.
- **AI:** Đề xuất 2–3 phương án kèm phân tích ưu/nhược điểm. Dùng [design.template.md](templates/design.template.md).

> **Gate:** Kết quả bước này **phải được người duyệt** trước khi sang bước 3.

---

### 3. Viết spec

Đặc tả chi tiết dựa trên design đã duyệt. Bao gồm: mô tả, yêu cầu, thiết kế, luồng dữ liệu, components, xử lý lỗi, kiểm thử.

- **Input:** Design doc đã duyệt.
- **Output:** File spec tại `docs/specs/<tên-tính-năng>.spec.md`.
- **Người:** Duyệt spec.
- **AI:** Viết spec draft. Dùng [spec.template.md](templates/spec.template.md).

> **Gate:** Kết quả bước này **phải được người duyệt** trước khi sang bước 4.

---

### 4. Viết plan

Kế hoạch thực hiện từng bước cụ thể. Mỗi bước là một hành động có thể thực thi được (code, kiểm tra, cấu hình...).

- **Input:** Spec đã duyệt.
- **Output:** File plan tại `docs/plans/<tên-tính-năng>.plan.md`.
- **Người:** Duyệt plan.
- **AI:** Viết plan draft. Dùng [plan.template.md](templates/plan.template.md).

> **Gate:** Kết quả bước này **phải được người duyệt** trước khi sang bước 5.

---

### 5. Review tổng thể

Kiểm tra spec và plan trước khi bắt đầu code. Phát hiện sớm các vấn đề để tránh làm lại.

- **Input:** Spec + Plan đã duyệt riêng lẻ.
- **Output:** Xác nhận spec và plan nhất quán với nhau, sẵn sàng để code.
- **Người:** Quyết định duyệt hoặc yêu cầu sửa.
- **AI:** Trước khi trình người duyệt, tự chạy checklist sau:
  - [ ] Mọi yêu cầu trong spec đều có bước tương ứng trong plan?
  - [ ] Không có bước nào trong plan mâu thuẫn với spec?
  - [ ] Xử lý lỗi trong spec đã được phản ánh vào plan?
  - [ ] Các bước trong plan đủ nhỏ để thực hiện độc lập?
  - [ ] Có dependency nào giữa các bước chưa được ghi rõ?

> **Gate:** Kết quả bước này **phải được người duyệt** trước khi sang bước 6.

---

### 6. Code

Thực hiện code theo đúng plan đã duyệt. Tuân thủ các quy ước trong `docs/CONVENTIONS.md`.

- **Input:** Plan đã duyệt.
- **Output:** Code hoàn chỉnh.
- **Người:** Không cần can thiệp trừ khi có vấn đề phát sinh.
- **AI:** Implement từng bước trong plan, đánh dấu `[x]` từng bước khi hoàn thành.

> **Chính sách sai lệch:** Nếu trong quá trình code phát hiện plan không khả thi hoặc cần thay đổi scope, AI **dừng ngay và báo cáo người** — không tự ý điều chỉnh plan hay mở rộng scope.

---

### 7. Kiểm tra

Chạy các kiểm tra chất lượng trước khi xem xét hoàn thành.

```bash
npm run lint   # kiểm tra ESLint + Prettier
npm test       # chạy Mocha tests
```

Kiểm tra thủ công nếu tính năng phức tạp hoặc có UI.

- **Input:** Code hoàn chỉnh.
- **Output:** Code pass tất cả kiểm tra.
- **Người:** Báo cáo lỗi nếu phát hiện trong quá trình dùng thử.
- **AI:** Chạy các lệnh kiểm tra, sửa lỗi nếu có.

**Phân loại lỗi và hướng xử lý:**

| Loại lỗi | Ví dụ | Hướng xử lý |
|---|---|---|
| Lỗi code đơn thuần | Typo, off-by-one, missing null check | Sửa tại chỗ, chạy lại kiểm tra |
| Lỗi logic / thiết kế | Luồng dữ liệu sai, component sai trách nhiệm | Quay lại **bước 3** (spec) |
| Lỗi kế hoạch | Bước thiếu, thứ tự sai, scope creep | Quay lại **bước 4** (plan) |

---

### 8. Rà soát tài liệu liên quan

Sau khi code pass kiểm tra, AI đọc toàn bộ `docs/` và đối chiếu với tính năng vừa hoàn thành để xác định các file cần cập nhật.

- **Input:** Code đã pass kiểm tra + spec + design của tính năng hiện tại.
- **Output:** Danh sách file cần cập nhật kèm lý do, và các file đó đã được cập nhật.
- **Người:** Duyệt các thay đổi trước khi sang bước 9.
- **AI:** Tự thực hiện toàn bộ quy trình rà soát sau:

**Quy trình rà soát của AI:**

Bước 1 — Quét toàn bộ `docs/` và lập danh sách tất cả file hiện có.

Bước 2 — Với từng file, đối chiếu nội dung với tính năng vừa làm theo tiêu chí:

| Loại file | Cần cập nhật khi... |
|---|---|
| `CONVENTIONS.md` | Tính năng giới thiệu pattern, quy ước, hoặc cấu trúc code mới |
| `STACK.md` | Tính năng thêm hoặc thay thế thư viện, công nghệ |
| `Welcome.md` | Tính năng thay đổi cách onboard hoặc tổng quan dự án |
| `specs/*.spec.md` | Spec tính năng khác có mô tả hành vi nay đã thay đổi |
| `products/*.product.md` | Product doc tính năng khác bị ảnh hưởng về luồng hoặc API |

Bước 3 — Với mỗi file cần cập nhật: thực hiện chỉnh sửa, ghi rõ lý do thay đổi.

Bước 4 — Tổng hợp báo cáo trình người duyệt:
- Danh sách file đã cập nhật và nội dung thay đổi.
- Danh sách file đã xem xét nhưng không cần cập nhật và lý do.

> **Gate:** Kết quả bước này **phải được người duyệt** trước khi sang bước 9.

---

### 9. Viết tài liệu

Viết tài liệu dựa trên loại task:

- **Feature task (tính năng mới):** cần product doc + overview.
- **Non-feature task (bảo trì, nâng cấp, fix bug, tài liệu):** chỉ cần overview.

- **Input:** Code đã pass kiểm tra và tài liệu liên quan đã được cập nhật ở bước 8.
- **Output:**
  - `docs/products/<tên>.product.md` — tài liệu tính năng (chỉ cho feature task).
  - `docs/overviews/<tên>.overview.md` — báo cáo kết quả thực hiện plan (mọi task).
- **Người:** Kiểm tra nội dung tài liệu.
- **AI:**
  - Feature task: viết product doc dựa trên design, spec và code. Dùng [product.template.md](templates/product.template.md). Viết overview báo cáo quá trình. Dùng [overview.template.md](templates/overview.template.md).
  - Non-feature task: chỉ viết overview, so sánh kế hoạch với thực tế, ghi lại sai lệch nếu có. Dùng [overview.template.md](templates/overview.template.md).

---

### 10. Cập nhật Roadmap

Khi tính năng hoàn thành, cập nhật Roadmap.

- **Input:** Tính năng đã pass kiểm tra, tài liệu liên quan đã cập nhật, và tài liệu tính năng đã hoàn chỉnh.
- **Output:** `docs/ROADMAP.md` được cập nhật: trạng thái chuyển thành "Hoàn thành", ghi lại bước đã làm và tài liệu liên quan.
- **Người:** Duyệt kết quả cuối cùng.
- **AI:** Cập nhật Roadmap.

---

## Cấu trúc thư mục tài liệu

```
docs/
├── designs/       # <tên>.design.md      — tài liệu thiết kế, brainstorm
├── specs/         # <tên>.spec.md        — đặc tả chi tiết tính năng
├── plans/         # <tên>.plan.md        — kế hoạch thực hiện
├── overviews/     # <tên>.overview.md    — tổng quan kết quả thực hiện plan
├── products/      # <tên>.product.md     — tài liệu tính năng
├── templates/     # template cho từng loại tài liệu
│   ├── design.template.md
│   ├── spec.template.md
│   ├── plan.template.md
│   ├── overview.template.md
│   └── product.template.md
├── KNOWN_ISSUES.md — danh sách bug và vấn đề đã biết
├── ROADMAP.md     — theo dõi tiến độ tất cả tính năng
├── CONVENTIONS.md — quy ước code
├── STACK.md       — công nghệ sử dụng
├── Welcome.md     — giới thiệu tài liệu
└── WORKFLOW.md    — quy trình phát triển tính năng
```

---

## Templates

Mỗi loại tài liệu có file template riêng tại `docs/templates/`. AI dùng template tương ứng khi bắt đầu mỗi bước.

- [design.template.md](templates/design.template.md) — dùng ở bước 2
- [spec.template.md](templates/spec.template.md) — dùng ở bước 3
- [plan.template.md](templates/plan.template.md) — dùng ở bước 4
- [product.template.md](templates/product.template.md) — dùng ở bước 9 (feature task)
- [overview.template.md](templates/overview.template.md) — dùng ở bước 9

---

## Tham chiếu

- [Quy ước code](CONVENTIONS.md)
- [Roadmap](ROADMAP.md)
- Xem [Welcome.md](Welcome.md) để biết tổng quan tài liệu.