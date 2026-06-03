# Template: GitHub Issue Closing Comment

Dùng cho comment cuối cùng trên GitHub Issue khi một bug được fix và đóng issue.

## Cấu trúc

```markdown
## TRẠNG THÁI: ĐÃ HOÀN THÀNH

Issue này đã được xử lý và đóng. Chi tiết bên dưới.

## 1. Vấn đề

[Mô tả vấn đề chính xác là gì — gồm code sai nếu có]

```ts
// Code trước khi fix (nếu cần)
```

## 2. Nguyên nhân gốc rễ

[Giải thích **tại sao** bug xảy ra — không chỉ mô tả triệu chứng]

- Nguyên nhân 1: ...
- Nguyên nhân 2: ...

## 3. Tác động

| Tác động | Mức độ | Chi tiết |
|----------|--------|----------|
| [Tác động 1] | Cao/Trung bình/Thấp | [Mô tả] |
| [Tác động 2] | Cao/Trung bình/Thấp | [Mô tả] |

Nếu chỉ có 1 tác động, dùng bullet thay vì bảng.

## 4. Cách khắc phục

[Mô tả fix — gồm code diff nếu có. Dùng ```diff để hiển thị thay đổi]

```diff
- // Code sai
+ // Code đúng
```

## 5. File đã thay đổi

| File | Thay đổi |
|------|----------|
| `path/to/file.ts:dòng` | Mô tả ngắn gọn thay đổi |

## 6. Commit

```
[Full commit hash — 40 ký tự hex]
```

## 7. Tài liệu đầy đủ

- [Design](https://github.com/maxlogvn/finger-chromium/blob/main/docs/designs/[TÊN].design.md)
- [Spec](https://github.com/maxlogvn/finger-chromium/blob/main/docs/specs/[TÊN].spec.md)
- [Plan](https://github.com/maxlogvn/finger-chromium/blob/main/docs/plans/[TÊN].plan.md)
- [Overview](https://github.com/maxlogvn/finger-chromium/blob/main/docs/overviews/[TÊN].overview.md)
```

## Quy tắc từng phần

### Phần 1: Vấn đề

- Mô tả chính xác **code sai**, không cần giải thích dài dòng.
- Nếu có code, dùng block code ```ts hoặc ```diff.
- Nếu bug đơn giản (vd: đổi tên biến), chỉ cần text, không cần code block.

### Phần 2: Nguyên nhân gốc rễ

- **Quan trọng nhất** của comment. Giải thích tại sao bug xảy ra.
- Dùng danh sách bullet nếu có nhiều nguyên nhân.
- Không viết lại những gì đã nói ở phần 1.

### Phần 3: Tác động

- Liệt kê hậu quả của bug với người dùng hoặc hệ thống.
- Nếu có 2+ tác động, dùng **bảng** (| Tác động | Mức độ | Chi tiết |).
- Phân loại mức độ: **Cao** (crash, mất dữ liệu), **Trung bình** (sai kết quả), **Thấp** (khó chịu, khó dùng).
- Nếu chỉ 1 tác động, dùng bullet: `- **Tên:** Mô tả.`

### Phần 4: Cách khắc phục

- Code diff: dùng ```diff với dấu `-` (xoá) và `+` (thêm).
- Nếu fix phức tạp, mô tả từng bước.
- Nếu fix 1 dòng, chỉ cần code diff, không cần giải thích thêm.

### Phần 5: File đã thay đổi

- Bảng 2 cột: `File` và `Thay đổi`.
- Nếu chỉ 1 file, có thể dùng bullet thay vì bảng.

### Phần 6: Commit

- **Full hash** (40 ký tự hex), không dùng short hash (7 ký tự).
- Nếu fix gồm nhiều commit, liệt kê tất cả.

### Phần 7: Tài liệu

- Link đầy đủ: `https://github.com/maxlogvn/finger-chromium/blob/main/docs/...`
- Dùng nhánh **main** (không dùng `development` hay nhánh khác).
- Nếu một loại tài liệu không tồn tại (vd: bug không có design), bỏ link đó.

## Lưu ý chung

1. **Ngôn ngữ:** Viết bằng tiếng Việt, dùng từ ngữ thân thiện, dễ hiểu.
2. **Đầy đủ dấu:** Phải có dấu tiếng Việt đầy đủ. Không viết kiểu "khong dau".
3. **Không thêm nội dung ngoài template:** Mỗi comment chỉ gồm 7 phần trên. Không thêm intro/outro.
4. **Một comment duy nhất:** Issue đã đóng chỉ có ĐÚNG MỘT comment này. Nếu đã có comment cũ (vd: "đã fix"), ghi đè lên nó.
5. **Không link nhánh `development/`:** Luôn dùng `blob/main/` trong URL. Nếu link cũ dùng sai nhánh, sửa lại.
