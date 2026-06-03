# Template: Known Issue Entry

Dùng cho mỗi entry trong `docs/KNOWN_ISSUES.md`.

## Cú pháp

Mỗi entry là một block gồm 2 phần: **header** (dòng đầu) và **fields** (danh sách bullet).

### OPEN entry (bug đã ghi nhận, chưa fix)

```markdown
**#[LOCAL_NUM] — [TIÊU ĐỀ NGẮN]**
- **File:** `[ĐƯỜNG DẪN FILE]:[DÒNG]`
- **Vấn đề:** [Mô tả ngắn gọn vấn đề, 1-2 câu]
- **Fix:** [Mô tả cách fix đề xuất, 1-2 câu]
- **GitHub:** [#[GH_NUM]](https://github.com/maxlogvn/finger-chromium/issues/[GH_NUM])
```

Ví dụ:

```markdown
**#8 — Engine download URL dùng HTTP không an toàn**
- **File:** `src/plugin/connector/engine.ts:367`
- **Vấn đề:** URL metadata fetch dùng `http://bablosoft.com/...` — không có HTTPS, dễ bị MITM khi tải engine binary.
- **Fix:** Đổi scheme thành `https://`; nếu HTTPS fail thì fallback sang HTTP.
- **GitHub:** [#4](https://github.com/maxlogvn/finger-chromium/issues/4)
```

### FIXED entry (bug đã sửa, có tài liệu)

```markdown
**[#[LOCAL_NUM] — [TIÊU ĐỀ NGẮN]]**
- **File:** `[ĐƯỜNG DẪN FILE]:[DÒNG]`
- **Vấn đề:** [Mô tả ngắn gọn vấn đề, 1-2 câu]
- **Fix:** [Mô tả cách fix, 1-2 câu]
- **Tài liệu:** [Design](designs/[TÊN].design.md) | [Spec](specs/[TÊN].spec.md) | [Plan](plans/[TÊN].plan.md) | [Overview](overviews/[TÊN].overview.md)
- **GitHub:** [#[GH_NUM]](https://github.com/maxlogvn/finger-chromium/issues/[GH_NUM]) (closed)
```

Ví dụ:

```markdown
**#2 — Error classes không export trong public API**
- **File:** `src/index.ts`
- **Vấn đề:** `PluginError`, `MissingKeyError`, `InvalidEngineError`, `EngineTimeoutError`, `RequestTimeoutError` không được re-export ra public API.
- **Fix:** Thêm export block 5 error class từ `./plugin/errors` vào `src/index.ts`.
- **Tài liệu:** [Design](designs/bug-002-export-error-classes.design.md) | [Spec](specs/bug-002-export-error-classes.spec.md) | [Plan](plans/bug-002-export-error-classes.plan.md) | [Overview](overviews/bug-002-export-error-classes.overview.md)
- **GitHub:** [#14](https://github.com/maxlogvn/finger-chromium/issues/14) (closed)
```

## Quy tắc

| Trường | OPEN | FIXED |
|--------|------|-------|
| `#[LOCAL_NUM]` | Số thứ tự trong KNOWN_ISSUES.md, không trùng | Giống OPEN |
| `TIÊU ĐỀ` | Ngắn gọn, rõ vấn đề, viết hoa đầu câu, không dấu câu cuối |
| `File` | Đường dẫn từ root dự án, có thể kèm dòng. Nếu nhiều file, ngăn bằng dấu phẩy |
| `Vấn đề` | 1-2 câu, mô tả **nguyên nhân gốc** chứ không chỉ triệu chứng |
| `Fix` | Nếu nhiều bước, dùng danh sách số thứ tự (1. 2. 3.) |
| `Tài liệu` | **Chỉ có ở FIXED** — 4 link: Design, Spec, Plan, Overview. Nếu thiếu loại nào thì bỏ link đó |
| `GitHub` | Số GitHub issue thật (khác local number). FIXED thêm `(closed)` |

## Lưu ý

- **LOCAL_NUM vs GH_NUM:** Local number (#1, #2, ...) là số thứ tự trong KNOWN_ISSUES.md, **không trùng** với GitHub issue number. Xem mapping ở đầu file.
- **File path:** Luôn dùng backtick `` `path/to/file` `` và relative từ root dự án.
- **Ngăn cách:** Giữa các FIXED entries có `---` (horizontal rule). OPEN entries thì không cần.
- **Entry không có tài liệu:** Một số fix đơn giản (vd: đổi 1 dòng trong package.json) không cần design/spec/plan/overview. Khi đó bỏ hẳn trường `Tài liệu`.
- **Nhiều file:** Khi fix ảnh hưởng nhiều file, liệt kê tất cả trong trường `File`, ngăn bằng dấu phẩy.
