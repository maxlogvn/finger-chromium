---
created: 2026-06-03
---

# Docs review & consistency fix

## 1. Mục tiêu

Rà soát toàn bộ hệ thống tài liệu sau khi fix 20 issue gần đây, đảm bảo consistency giữa `KNOWN_ISSUES.md`, `ROADMAP.md` và code thực tế. Xoá hệ thống local numbering để tránh nhầm lẫn với GitHub issue numbers.

## 2. Những gì đã phát hiện và fix

### KNOWN_ISSUES.md

| Vấn đề | Mô tả | Fix |
|--------|-------|-----|
| **Xoá local numbering** | Hệ thống local #1-#20 gây nhầm lẫn với GitHub issue numbers (mapping không 1:1) | Xoá `#[LOCAL_NUM] — ` khỏi header 20 entries. GitHub number là định danh duy nhất. |
| **Header mapping** | Cập nhật sau khi xoá local numbering | Đổi thành `FIXED: 20 issues đã đóng trên GitHub` |
| **#6 — Link hỏng** | Plan và Overview link trỏ đến file không tồn tại | Xoá 2 link Plan và Overview, chỉ giữ Design và Spec |
| **#9, #10, #12, #13, #16, #17, #19, #20 — Thiếu Overview link** | 8 entries có file overview tồn tại nhưng không được link | Thêm Overview link |

### ROADMAP.md

#### Xoá standalone bug entries

Xoá 11 entries không cần thiết trong roadmap (bug và non-feature tasks) vì:
- CONVENTIONS.md yêu cầu bug fix không đứng riêng trong roadmap
- Tất cả bug detail đã có trong KNOWN_ISSUES.md
- Feature entries đã được thêm ghi chú link đến KNOWN_ISSUES.md

Các entries đã xoá:
- Bug #13 (cleaner singleton)
- Bug #1 (notify dead code)
- Bug #2 (export error classes)
- Bug #4 (JSDoc privatekey)
- Bug #3 (quit unmap root)
- Bug #7 (multi-profile singleton)
- Bug #11 (defaultLauncher)
- Bug #20 (setTimeout async-lock)
- Bug #19 (isBrowser typeguard)
- Dọn dẹp sau review
- Tăng test coverage (giữ lại vì là task sắp làm)

#### Chuyển local # sang GitHub Issue #

Tất cả tham chiếu trong ROADMAP.md chuyển từ local # (#1, #2, ... #20) sang GitHub Issue (#1, #2, ... #20 tương ứng theo mapping). Ví dụ:
- `KNOWN_ISSUES.md #9` → `KNOWN_ISSUES.md (Issue #1)`
- `KNOWN_ISSUES.md #3, #7, #11` → `KNOWN_ISSUES.md (Issue #15, #19, #3)`

#### Fix nội dung outdated

| Entry | Trước | Sau |
|-------|-------|-----|
| **BrowserEngine** | "Singleton Chromium instance" | "Multi-instance — mỗi instance độc lập" + ghi chú Issue #15, #19, #3 |
| **API Connector** | "Singleton RemoteEngine với async-lock đồng bộ" | "Class Connector — mỗi FingerprintPlugin sở hữu Connector riêng" + ghi chú Issue #20, #7, #11 |

#### Thêm bug fix ghi chú vào feature entries

| Entry | Bug references thêm (GitHub Issue) |
|-------|-----------------------------------|
| **PCAP Server** | #5 (lazy init), #8 (promise hang retry) |
| **FingerprintPlugin** | #6 (cleaner singleton), #7 (Connector factory) |
| **File Cleanup Daemon** | #9 (posix path -> Windows native) |
| **Viewport Management** | #10 (synchronize key), #12 (isBrowser), #13 (pollInterval) |
| **Playwright Bridge** | #3 (defaultLauncher mutable state) |
| **Browser Launcher** | #1 (PluginError thay Error thô) |
| **Error Hierarchy** | #14 (export ra public API), #16 (JSDoc method không tồn tại) |

#### Fix format

- Double separator `---\n\n---` — đã xoá
- `**` thừa ở cuối link Overview — đã xoá
- Thiếu `---` separator giữa Debug Logging và Tăng test coverage — đã thêm

## 3. Files đã thay đổi

| File | Thay đổi |
|------|----------|
| `docs/KNOWN_ISSUES.md` | Header mapping, #6 links, #9/#10/#19 Overview links |
| `docs/ROADMAP.md` | Xoá bug entries, cập nhật 2 feature descriptions, thêm ghi chú 7 features, fix format, thêm task entry |

## 4. Kiểm tra

- `npm run typecheck` — pass (0 errors)
- `npm run lint` — pass (0 errors, 15 warnings pre-existing về `any` type)

## 5. Kết luận

Hệ thống docs đã đồng bộ và nhất quán. Tất cả bug fix ghi chú đều link đúng đến KNOWN_ISSUES.md. Roadmap chỉ còn feature entries và 1 task sắp làm (tăng test coverage).
