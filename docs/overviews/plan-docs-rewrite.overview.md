# Overview: Plan Docs Rewrite

## Tóm tắt

Đã viết lại toàn bộ 20 feature plan docs (`docs/plans/*.plan.md`) ở mức siêu chi tiết, bám sát code thực tế. Mỗi plan được mở rộng từ template cũ (Bước + Làm gì + File + Giải thích) sang template mới thêm function signatures (TypeScript), logic chi tiết (numbered sub-steps), xử lý lỗi, edge cases (3-5 case mỗi bước), và giải thích "tại sao".

Tổng dung lượng tăng từ ~650 dòng lên ~3.150 dòng (tỉ lệ ~4.8x).

## Kết quả thực hiện

| Bước | Kế hoạch | Thực tế | Sai lệch |
|---|---|---|---|
| Step 1.1-1.3: Core plans (3) | Viết browser-engine, playwright-bridge, fingerprint-plugin | Dòng tăng 36→210, 32→195, 32→230 | Không có |
| Step 2.1-2.3: Connector & Engine (3) | Viết api-connector, remote-engine, pcap-server | Dòng tăng 28→130, 38→260, 23→130 | Không có |
| Step 3.1-3.4: Plugin & Utilities (4) | Viết browser-launcher, native-mutex, file-cleanup-daemon, hook-binding | Dòng tăng 24→115, 24→100, 32→160, 39→175 | Không có |
| Step 4.1-4.4: Feature Configs (4) | Viết fingerprint-config, proxy-config, profile-management, viewport-management | Dòng tăng 24→110, 40→180, 34→150, 37→165 | Không có |
| Step 5.1-5.6: Scripts & Infrastructure (6) | Viết common-scripts, debug-logging, error-hierarchy, project-infrastructure, playwright-module-loader, type-system | Dòng tăng 23→80, 34→95, 36→120, 43→160, 32→130, 33→140 | Không có |
| Step 6.1: Cross-reference | Kiểm tra consistency, usePrivateKey | Pass — 1 tồn tại trong type-system.plan.md (signature sai) | Đã fix — xoá `usePrivateKey` khỏi signature, thay bằng signature thật (9 methods) |
| Step 6.2: Placeholder check | Select-String TBD/TODO | Pass — 0 matches trong 20 feature plans (chỉ có meta-plans) | Không có |

## Sai lệch đáng chú ý

- **Sai lệch 1:** `type-system.plan.md` signature của `PWChromium` interface có `usePrivateKey` — nhưng code thực tế (`src/types/PWChromium.ts` dòng 38-164) không còn method này (chỉ còn trong JSDoc example).
    - Nguyên nhân: Sao chép signature từ plan cũ không đối chiếu code.
    - Hướng xử lý: Đã thay bằng signature thật gồm 9 methods (`engine`, `repackChromium`, `useFingerprint`, `useProxy`, `useProfile`, `newFingerprint`, `launch`, `newContext`, `quit`).
    - Ảnh hưởng: Không — plan đã được sửa.

- **Sai lệch 2:** `type-system.plan.md` ghi file lines `dòng 1-44` — nhưng interface thực tế ở `dòng 38-164`.
    - Nguyên nhân: Không kiểm tra lại line numbers sau lần format/comment codebase.
    - Hướng xử lý: Đã sửa thành `dòng 38-164`.
    - Ảnh hưởng: Không — plan đã được sửa.

## Tài liệu liên quan

- `docs/plans/*.plan.md`: 20 file plan docs đã viết siêu chi tiết (xem chi tiết ở roadmap)
- `docs/plans/plan-docs-rewrite.plan.md`: meta-plan cho pass này (đã cập nhật phần tiến độ)

## Ghi chú

- Template cũ: `Bước N: tên` + `Làm gì` + `File` + `Giải thích`.
- Template mới: `Bước N (file, dòng)` + `Signature (TypeScript)` + `Logic chi tiết (numbered)` + `Xử lý lỗi` + `Edge cases` + `Tại sao`.
- Non-feature plans (build-config-install-docs, format-comment-codebase, known-issues-separate, quit-handle-cleanup, mutex-path-resolution, core-documentation-correction) và meta-plans (plan-docs-rewrite, spec-docs-rewrite, product-docs-rewrite, documentation-rewrite, documentation-detail-fix) không nằm trong phạm vi.
- Ở lần rewrite plan tiếp theo, cần kiểm tra line numbers ngay sau khi format codebase.
