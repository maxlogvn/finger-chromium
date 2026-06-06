# Overview: Unit Tests cho Core (`tests/unit/core.spec.ts`)

> **Version:** 1.0 | **Người thực hiện:** AI Agent | **Người kiểm tra:** (chờ duyệt) | **Ngày hoàn thành:** 2026-06-06

## Tóm tắt

Đã tạo file `tests/unit/core.spec.ts` với 30 unit test cho 3 module core không phụ thuộc `BABLOSOFT_KEY`: error classes (`src/plugin/errors.ts`), public exports (`src/index.ts`), và config logic (`src/plugin/config.ts`). Tất cả test chạy trong môi trường Mocha + tsx, không cần browser thật.

## Kết quả thực hiện

| Bước | Kế hoạch (phút) | Thực tế (phút) | Sai lệch | Nguyên nhân (nếu có) |
|------|----------------|----------------|----------|----------------------|
| Bước 1: Tạo thư mục + skeleton | 5 | 5 | 0% | Không |
| Bước 2: Test error classes | 20 | 15 | -25% | Ứơc lượng dư do code rõ ràng |
| Bước 3: Test public exports | 15 | 10 | -33% | Chỉ test runtime export thực tế |
| Bước 4: Test getValidPollInterval | 10 | 10 | 0% | Cần export function từ source |
| Bước 5: Test ConfigManager.configure | 20 | 25 | +25% | Mock process.once cần điều chỉnh |
| Bước 6: Test ConfigManager.synchronize | 25 | 20 | -20% | Temp dir pattern đơn giản hơn dự kiến |
| Bước 7: Điều chỉnh mocha config | 5 | 2 | -60% | Config mặc định đã phù hợp |

## Sai lệch đáng chú ý

- **Sai lệch 1:** `getValidPollInterval` không export từ `src/plugin/config.ts`.
  - **Nguyên nhân:** Hàm internal, không có export.
  - **Hướng xử lý đã áp dụng:** Thêm `export` vào function -- thay đổi tối thiểu, không ảnh hưởng behavior.
  - **Ảnh hưởng đến plan/spec:** Cần cập nhật plan ghi nhận source change.
- **Sai lệch 2:** 3 test case fail lần chạy đầu do mock sai.
  - **Nguyên nhân:** `ConfigManager.configure()` ghi đè `browser.configure`, flag cũ bị mất; sync wrapper gọi `fn()` chạm tới `setViewport` thật.
  - **Hướng xử lý:** Điều chỉnh test dùng `assert.notStrictEqual` và sync wrapper không gọi `fn()`.
  - **Ảnh hưởng:** Không.

## Metric thành công

| Metric | Mục tiêu | Kết quả đạt được |
|--------|----------|------------------|
| Số test pass | 25+ | 30 |
| Test không cần BABLOSOFT_KEY | Tất cả | 30/30 |
| Không thêm dependency | Đúng | Không thêm |
| Thời gian chạy test | < 5s | 460ms |

## Bài học kinh nghiệm

- Export pure function trước khi viết test, tránh phải sửa source sau.
- ConfigManager.configure ghi đè method của đối tượng -- mock cần kiểm tra kết quả sau khi ghi đè, không dùng flag trước.

## Tài liệu liên quan đã tạo/cập nhật

- `tests/unit/core.spec.ts` (tạo mới)
- `tests/unit/` (tạo mới)
- `src/plugin/config.ts` (cập nhật -- thêm `export` cho `getValidPollInterval`)
- `docs/issues/test-unit-core.md` (cập nhật)
- `docs/designs/test-unit-core.design.md` (tạo mới)
- `docs/specs/test-unit-core.spec.md` (tạo mới)
- `docs/plans/test-unit-core.plan.md` (tạo mới)

## Ghi chú cho các task tiếp theo

- Khi thêm error class mới, nhớ thêm test vào `Error classes` describe.
- Khi thêm export mới vào `src/index.ts`, nhớ thêm test vào `Public exports` describe.
- Khi thêm config logic, nhớ thêm test vào `Config` describe.
