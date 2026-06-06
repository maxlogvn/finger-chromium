# Plan: Test Utilities (`tests/helpers.ts`)

> **Version:** 1.0 | **Ngày bắt đầu dự kiến:** 2026-06-06 | **Ngày kết thúc dự kiến:** 2026-06-06

## Các bước thực hiện

- [ ] **Bước 1: Tạo file `tests/helpers.ts` với toàn bộ export**
  - **Làm gì:** Tạo file `tests/helpers.ts` chứa tất cả các export named.
  - **File liên quan:** `tests/helpers.ts` (mới).
  - **Định nghĩa hoàn thành (DoD):** File tồn tại, có đủ 6 export, type check pass.
  - **Thời gian ước lượng:** 15 phút.
  - **Rủi ro:** `tsconfig.json` exclude `tests/**/*` -- cần kiểm tra Mocha vẫn chạy được.
  - **Phụ thuộc:** Không.

- [ ] **Bước 2: Kiểm tra chất lượng**
  - **Làm gì:** Chạy `npm run typecheck` và `npm run lint` để đảm bảo helpers không gây lỗi.
  - **File liên quan:** `tests/helpers.ts`.
  - **DoD:** `typecheck` pass (biết trước `tsconfig` exclude tests, nhưng dùng `tsx` khi chạy Mocha).
  - **Thời gian ước lượng:** 2 phút.
  - **Phụ thuộc:** Bước 1.

- [ ] **Bước 3: Chạy thử smoke test với Mocha**
  - **Làm gì:** Tạo file `tests/smoke/helpers-check.ts` tạm thời để test all exports hoạt động.
  - **File liên quan:** `tests/smoke/helpers-check.ts` (tạo mới, sẽ xoá sau).
  - **DoD:** `npm test` output show test chạy thành công.
  - **Thời gian ước lượng:** 2 phút.
  - **Phụ thuộc:** Bước 2.

- [ ] **Bước 4: Xoá smoke test tạm, kiểm tra CI-ready**
  - **Làm gì:** Xoá `tests/smoke/helpers-check.ts`, chạy lại `npm test` để confirm không test nào fail.
  - **DoD:** `npm test` pass 0 tests (chưa có test nào khác), không lỗi import.
  - **Thời gian ước lượng:** 1 phút.
  - **Phụ thuộc:** Bước 3.

## Kiểm tra tổng thể

- `npm run lint` -- ESLint pass
- `npm run typecheck` -- type check pass (dù exclude tests, file chỉ dùng để Mocha + tsx runtime)
- `npm test` -- Mocha chạy không lỗi import

## Rủi ro & phương án dự phòng

- **Rủi ro:** `tsconfig.json` exclude `tests/**/*` khiến IDE báo lỗi khi import từ `src/`.
  - **Dự phòng:** Bỏ qua, vì `tsx` khi chạy Mocha không dùng `tsconfig`, type check vẫn pass.
- **Rủi ro:** `BrowserEngine` constructor thay đổi API sau này.
  - **Dự phòng:** Helpers là single point of change -- chỉ sửa một chỗ khi API thay đổi.

## Ghi chú bổ sung

- Không cần cập nhật `CONVENTIONS.md`, `STACK.md` hay `Welcome.md` vì không thay đổi quy tắc hay công nghệ.
- Sau plan này, bước 6 (Tài liệu + Commit) sẽ viết overview và commit.
