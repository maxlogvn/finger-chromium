
> Tài liệu này định nghĩa quy trình chuẩn để xây dựng một tính năng mới trong dự án. Cả developer (người) và AI agent đều phải tuân theo.

---

## Sơ đồ quy trình

```
  1. [Cập nhật Roadmap] ---đánh dấu "Đang làm"---
        |
        v
  2. [Viết design] ---brainstorm, đề xuất giải pháp---
        |
        v
  3. [Viết spec] ---đặc tả chi tiết---
        |
        v
  4. [Viết plan] ---kế hoạch từng bước---
        |
        v
  5. [Review] ---duyệt spec + plan trước khi code---
        |
        v
  6. [Code] ---thực hiện theo plan---
        |
        v
  7. [Kiểm tra] ---lint, type-check, test---
        |
        v
  8. [Viết product + overview] ---tài liệu tính năng + báo cáo kết quả---
        |
        v
  9. [Cập nhật Roadmap] ---đánh dấu "Hoàn thành"---
```

---

## Chi tiết từng bước

### 1. Cập nhật Roadmap

Khi bắt đầu một tính năng mới, cập nhật trạng thái trong `docs/ROADMAP.md`.

- **Input:** Ý tưởng hoặc quyết định phát triển tính năng.
- **Output:** Roadmap đã cập nhật, tính năng được đánh dấu "Đang làm".
- **Người:** Duyệt và quyết định tính năng nào được phát triển.
- **AI:** Ghi vào Roadmap với trạng thái "Đang làm".

### 2. Viết design

Brainstorm và đề xuất giải pháp. Khám phá bối cảnh, đặt câu hỏi làm rõ yêu cầu, đề xuất các phương án, chọn một giải pháp.

- **Input:** Yêu cầu tính năng.
- **Output:** File design tại `docs/designs/<tên-tính-năng>.design.md`.
- **Người:** Chọn giải pháp cuối cùng.
- **AI:** Đề xuất 2-3 phương án kèm phân tích ưu/nhược điểm.
- **Kết quả của bước này phải được người dùng duyệt trước khi sang bước 3.**

### 3. Viết spec

Đặc tả chi tiết dựa trên design đã duyệt. Bao gồm: mô tả, yêu cầu, thiết kế, luồng dữ liệu, components, xử lý lỗi, kiểm thử.

- **Input:** Design doc đã duyệt.
- **Output:** File spec tại `docs/specs/<tên-tính-năng>.spec.md`.
- **Người:** Duyệt spec.
- **AI:** Viết spec draft.

### 4. Viết plan

Kế hoạch thực hiện từng bước cụ thể. Mỗi bước là một hành động có thể thực thi được (code, kiểm tra, cấu hình...).

- **Input:** Spec đã duyệt.
- **Output:** File plan tại `docs/plans/<tên-tính-năng>.plan.md`.
- **Người:** Duyệt plan.
- **AI:** Viết plan draft.

### 5. Review

Kiểm tra spec và plan trước khi bắt đầu code. Phát hiện sớm các vấn đề để tránh làm lại.

- **Input:** Spec + Plan.
- **Output:** Spec/Plan đã được duyệt, sẵn sàng để code.
- **Người:** Review chính, quyết định duyệt hoặc yêu cầu sửa.
- **AI:** Hỗ trợ giải thích các phần trong spec/plan nếu cần.

### 6. Code

Thực hiện code theo đúng plan đã duyệt. Tuân thủ các quy ước trong `docs/CONVENTIONS.md`.

- **Input:** Plan đã duyệt.
- **Output:** Code hoàn chỉnh.
- **Người:** Không cần can thiệp trừ khi có vấn đề phát sinh.
- **AI:** Implement từng bước trong plan.

### 7. Kiểm tra

Chạy các kiểm tra chất lượng trước khi xem xét hoàn thành:

- `npm run lint` -- kiểm tra ESLint + Prettier.
- `npm test` -- chạy Mocha tests.
- Kiểm tra thủ công nếu cần (tính năng phức tạp).

- **Input:** Code.
- **Output:** Code pass tất cả kiểm tra.
- **Người:** Báo cáo lỗi nếu phát hiện trong quá trình code.
- **AI:** Chạy các lệnh kiểm tra, sửa lỗi nếu có.

### 8. Viết tài liệu

Viết tài liệu dựa trên loại task:

- **Feature task (tính năng mới):** cần product doc + overview
- **Non-feature task (bảo trì, nâng cấp, fix bug, tài liệu):** chỉ cần overview

- **Input:** Task đã pass kiểm tra.
- **Output:**
  - File product tại `docs/products/<tên>.product.md` -- tài liệu tính năng (chỉ cho feature task)
  - File overview tại `docs/overviews/<tên>.overview.md` -- báo cáo kết quả thực hiện plan (mọi task)
- **Người:** Kiểm tra nội dung tài liệu.
- **AI:**
  - Feature task: viết product dựa trên design, spec và code; viết overview báo cáo quá trình.
  - Non-feature task: chỉ viết overview, so sánh kế hoạch với thực tế, ghi lại sai lệch.

### 9. Cập nhật Roadmap

Khi tính năng hoàn thành, cập nhật Roadmap.

- **Input:** Tính năng đã pass kiểm tra.
- **Output:** `docs/ROADMAP.md` được cập nhật: trạng thái chuyển thành "Hoàn thành", ghi lại bước đã làm và tài liệu liên quan.
- **Người:** Duyệt kết quả cuối cùng.
- **AI:** Cập nhật Roadmap.

---

## Cấu trúc thư mục tài liệu

```
docs/
├── designs/       # <tên>.design.md -- tài liệu thiết kế, brainstorm
├── specs/         # <tên>.spec.md   -- đặc tả chi tiết tính năng
├── plans/         # <tên>.plan.md   -- kế hoạch thực hiện
├── overviews/     # <tên>.overview.md   -- tổng quan kết quả thực hiện plan
├── products/      # <tên>.product.md    -- tài liệu tính năng
├── ROADMAP.md     -- theo dõi tiến độ tất cả tính năng
├── CONVENTIONS.md -- quy ước code
├── STACK.md       -- công nghệ sử dụng
├── Welcome.md     -- giới thiệu tài liệu
└── WORKFLOW.md    -- quy trình phát triển tính năng
```

---

## Template spec

```markdown
# Spec: <tên tính năng>

## Mô tả

## Yêu cầu

## Thiết kế

## API / Data flow

## Components

## Xử lý lỗi

## Kiểm tra
```

## Template plan

```markdown
# Plan: <tên tính năng>

## Các bước thực hiện

- [ ] Bước 1: ...
- [ ] Bước 2: ...
- [ ] ...

## Kiểm tra

## Ghi chú
```

---

## Tham chiếu

- [Quy ước code](CONVENTIONS.md)
- [Roadmap](ROADMAP.md)
- Xem [Welcome.md](Welcome.md) để biết tổng quan tài liệu.
