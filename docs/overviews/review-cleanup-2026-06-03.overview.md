# Overview: Dọn dẹp sau review — fix các vấn đề phát hiện trong code review

## Tóm tắt

Sau khi review toàn bộ 20 fix issues, phát hiện 5 vấn đề nhỏ cần xử lý: cập nhật trạng thái issue #15 trong KNOWN_ISSUES.md, sửa mapping GitHub issues, thêm script `typecheck` vào package.json, xoá interface unused `ValidateConfigOptions`, và đổi `reject(new Error(...))` thành `PluginError` trong launcher.

## Kết quả thực hiện

| Bước | Kế hoạch | Thực tế | Sai lệch |
|---|---|---|---|
| Fix 1: Cập nhật KNOWN_ISSUES.md #15 status + mapping | Đổi "(open — chờ verify sau)" thành "(closed)", mapping thêm #8 và #13 | Đã đổi mapping gọn lại thành `#1-#20` (tất cả đã đóng) và sửa status #15 | Không có |
| Fix 2: Thêm typecheck script | Thêm `"typecheck": "tsc --noEmit"` vào package.json | Đã thêm thành công | Không có |
| Fix 3: Xoá ValidateConfigOptions | Xoá interface unused | Đã xoá, lint giảm từ 16 xuống 15 warnings | Không có |
| Fix 4: Đổi reject(new Error) | Dùng PluginError thay vì Error | Đã đổi, pass lint + typecheck | Không có |
| Kiểm tra | Lint, typecheck, build, test đều pass | Lint 0 errors/15 warnings, typecheck pass, build pass, 20/20 tests pass | Không có |

## Sai lệch đáng chú ý

Không có.

## Tài liệu liên quan

- `docs/KNOWN_ISSUES.md` — cập nhật status #15 và mapping GitHub
- `package.json` — thêm script `typecheck`
- `src/plugin/utils.ts` — xoá interface `ValidateConfigOptions` không dùng
- `src/plugin/launcher/index.ts` — đổi `reject(new Error(...))` thành `PluginError`
- `docs/ROADMAP.md` — thêm entry cho task cleanup này

## Ghi chú

- Script `typecheck` đã được thêm vào `package.json`, nhất quán với hướng dẫn trong `AGENTS.md`.
- Tất cả 20 issues trong KNOWN_ISSUES.md hiện đã ở trạng thái FIXED với GitHub issues tương ứng đã đóng.
- 15 warnings `no-explicit-any` còn lại là pre-existing, không thuộc phạm vi task này.
