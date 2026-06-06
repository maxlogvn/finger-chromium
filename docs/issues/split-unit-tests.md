# Known Issue: Chia tách unit tests core thành nhiều file

> Template này dùng cho **body của GitHub issue**, chỉ mô tả vấn đề — không đề xuất giải pháp.

## Mô tả

Hiện tại toàn bộ unit test core nằm trong một file duy nhất `tests/unit/core.spec.ts` (323 dòng) với 3 section:

| Section | Dòng | Số test | Import riêng |
|---|---|---|---|
| **Error classes** | 25–103 (~79 dòng) | 12 | `../../src/plugin/errors` |
| **Public exports** | 107–135 (~29 dòng) | 6 | `../../src/plugin/errors`, `../../src/adapter/playwright/fluent` |
| **Config** | 139–322 (~184 dòng) | 13 | `../../src/plugin/config`, `../../src/plugin/launcher` (type), `fs`, `path`, `os` |

**Vấn đề phát hiện khi xác minh:** Section "Public exports" có 6 tests, nhưng 5 trong số đó kiểm tra error classes là subclass của `PluginError` — đã được test đầy đủ trong section "Error classes" (ví dụ dòng 47–63 đã test `MissingKeyError extends PluginError`). Chỉ có 1 test thực sự unique: kiểm tra `BrowserEngine` là class (function) tại dòng 132–134.

File quá dài gây khó khăn trong bảo trì, review, và phát triển song song. Cần chia tách thành các file nhỏ theo từng module.

### Environment

- **OS:** Windows 11
- **Node version:** 20.x
- **Test runner:** Mocha 11.x
- **Config:** `.mocharc.yml` — pattern `tests/**/*.ts`, dùng `tsx/esm`

### Cấu trúc hiện tại

```
tests/unit/core.spec.ts  ← 323 dòng, 31 tests
  imports:
    - assert (node:assert)
    - fs, path, os (node:*)
    - PluginError, MissingKeyError, ...
    - BrowserEngine
    - getValidPollInterval, ConfigManager
    - type Browser

  ├── Error classes          (5 describe, 12 tests)
  │   ├── PluginError        — 3 tests: empty msg, custom msg, toStringTag
  │   ├── MissingKeyError    — 3 tests: extends PluginError, msg có instructions, name
  │   ├── InvalidEngineError — 2 tests: extends PluginError, msg có instructions
  │   ├── EngineTimeoutError — 2 tests: extends PluginError, msg có instructions
  │   └── RequestTimeoutError— 2 tests: extends PluginError, msg có instructions
  │
  ├── Public exports         (1 describe, 6 tests, 5 redundant)
  │   ├── PluginError là function (redundant — errors section đã test)
  │   ├── 5× error là subclass của PluginError (redundant — errors section đã test)
  │   └── BrowserEngine là function (unique)
  │
  └── Config                 (3 describe, 13 tests)
      ├── getValidPollInterval   — 5 tests: undefined, NaN, âm, < 100, >= 100
      ├── ConfigManager.configure — 5 tests: cleanup handler, gán configure, gọi sync, không gọi sync (dùng mock Browser)
      └── ConfigManager.synchronize — 3 tests: availWidth/availHeight, BAS_NOT_SET, lỗi thiếu .ini
```

## Nguyên nhân gốc rễ

- Khi viết unit test ban đầu, ưu tiên hoàn thành nhanh nên gộp toàn bộ vào một file.
- Section "Public exports" được viết như một sanity check nhanh, nhưng phần lớn trùng lặp với section "Error classes".
- Chưa có quy ước về kích thước tối đa mỗi file test.

## Tác động

| Tác động | Mức độ | Ai bị ảnh hưởng | Chi tiết |
|---|---|---|---|
| Khó maintain | Trung bình | Developer | Mỗi lần thêm/sửa test phải cuộn trong file lớn. |
| Conflict khi merge | Thấp | Developer | Nhiều người cùng sửa một file dễ conflict. |
| Khó review | Thấp | Reviewer | File dài khó review từng phần riêng biệt. |
| Test redundant | Thấp | Developer | 5/6 tests trong "Public exports" không thêm giá trị mới. |

## Phạm vi ảnh hưởng

- File duy nhất bị ảnh hưởng: `tests/unit/core.spec.ts`
- Các module cần import sau khi tách:
  - `tests/unit/errors.spec.ts` → cần `assert`, error classes từ `../../src/plugin/errors`
  - `tests/unit/config.spec.ts` → cần `assert`, `fs`, `path`, `os`, config classes từ `../../src/plugin/config`, type `Browser` từ `../../src/plugin/launcher`
  - `tests/unit/exports.spec.ts` → cần `assert`, `BrowserEngine` từ `../../src/adapter/playwright/fluent`

## Ghi chớ

**Cân nhắc khi chia:** Section "Public exports" có thể:
- Giữ nguyên với 6 tests (dù 5 tests redundant) để tránh mất coverage nếu ai đó vô tình xoá error classes.
- Hoặc thu gọn chỉ còn 1 test `BrowserEngine` duy nhất.
- Hoặc merge test `BrowserEngine` vào `errors.spec.ts` và bỏ hẳn file `exports.spec.ts`.

Quyết định này nên được thống nhất trong design phase trước khi split.
