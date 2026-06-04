# Overview: Docs: Fix spec/overview consistency và các lỗi nhỏ

## Tóm tắt

Đã rà soát toàn bộ spec files, plan files, và overview files để phát hiện và sửa các sai lệch giữa tài liệu và thực tế implementation. Tổng cộng 6 file được cập nhật: 4 spec files, 2 plan files, 1 overview file.

## Kết quả thực hiện

| File | Vấn đề | Sửa |
|---|---|---|
| `test-connector.spec.md` | EADDRINUSE retry test trong spec nhưng không implement; `require.cache` không dùng được trong ESM; test counts sai | Xoá EADDRINUSE test case, sửa mock strategy thành ESM-friendly, cập nhật test counts (5+15+7=27) |
| `test-cleanup.spec.md` | Ghi "Dùng sinon stubs" nhưng sinon chỉ dùng cho global spies; `#cleanup()` test không test được; proxyquire tham chiếu sai | Sửa sinon → manual stub, xoá `#cleanup` test, thêm note deviation |
| `test-browser.spec.md` | Thiếu TestPlugin pattern, isBrowser export, setViewport headless limitation; test count 38 → 40 | Thêm deviations vào yêu cầu, sửa test count |
| `test-profile.spec.md` | map() error path và unmap() permission error trong spec nhưng không test được | Xoá khỏi test cases, thêm note deviation |
| `test-connector.plan.md` | EADDRINUSE bước và require.cache note | Xoá EADDRINUSE bước, sửa ESM notes |
| `test-cleanup.plan.md` | Task cài sinon, `#cleanup()` task, sinon code examples | Xoá sinon installation task, xoá `#cleanup()`, thay sinon code bằng manual stub |
| `test-cleanup.overview.md` | Ghi "package.json — thêm sinon vào devDependencies" sai | Sửa: sinon không được cài, thêm note giải thích |

## Sai lệch đáng chú ý

- **Sinon vs manual stub:** Tài liệu cũ (spec, plan) yêu cầu sinon stubs cho mọi mock. Thực tế sinon chỉ dùng cho global spies (`setInterval`/`clearInterval`). Các dependency khác mock bằng manual property mutation trên CJS module exports object hoặc integration style với temp file thật. Lý do: sinon không tương thích với ESM live binding cho module imports.
- **JS native private fields:** `#cleanup()` và `#process`/`#meta` tiếp tục là rào cản testability. Tài liệu cũ giả định có thể test private methods.
- **Windows file permissions:** `chmod` trên Windows không ngăn được chủ sở hữu xoá thư mục — khác với Linux.

## Tài liệu liên quan

- `docs/specs/test-connector.spec.md` — đã sửa
- `docs/specs/test-cleanup.spec.md` — đã sửa
- `docs/specs/test-browser.spec.md` — đã sửa
- `docs/specs/test-profile.spec.md` — đã sửa
- `docs/plans/test-connector.plan.md` — đã sửa
- `docs/plans/test-cleanup.plan.md` — đã sửa
- `docs/overviews/test-cleanup.overview.md` — đã sửa
- `docs/ROADMAP.md` — đã sửa

## Ghi chú

- Task này là non-feature task (chỉ sửa tài liệu), không cần product doc.
- Các issue #28-#31 (test coverage gaps) vẫn OPEN — cần xử lý riêng.
- Sinon chưa bao giờ được cài trong dependencies — nếu cần dùng trong tương lai, cần đánh giá ESM compatibility.
