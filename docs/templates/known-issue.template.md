# Template: Known Issue (Issue Body)

Dùng cho body của GitHub issue — tập trung mô tả vấn đề, không đề xuất giải pháp hay cách khắc phục.

## Cấu trúc

```markdown
## Mô tả

[Mô tả chi tiết vấn đề — gồm file, dòng code, hành vi sai.]

### Flow hiện tại (nếu có)

```
[Flow diagram minh hoạ luồng xử lý hiện tại dẫn đến lỗi]
```

### Code hiện tại (nếu có)

```ts
// Đoạn code gây lỗi — kèm comment chỉ vị trí
```

## Nguyên nhân gốc rễ

[Giải thích **tại sao** bug xảy ra — không chỉ mô tả triệu chứng.]

- Nguyên nhân 1: ...
- Nguyên nhân 2: ...

## Tác động

| Tác động | Mức độ | Chi tiết |
|----------|--------|----------|
| [Tác động 1] | Cao/Trung bình/Thấp | [Mô tả] |

Nếu chỉ có 1 tác động, dùng bullet thay vì bảng.
```

## Ví dụ

```markdown
## Mô tả

Hàm `download()` trong `src/plugin/connector/engine.ts:129-145` mở file output NGAY tại dòng 131 (`createWriteStream(filePath)`) trước khi bất kỳ request HTTP nào được gửi đi. Nếu quá trình download thất bại ở bất kỳ bước nào, **không có cơ chế dọn dẹp** file partial/empty trên disk.

### Flow hiện tại

```
createWriteStream(filePath)        ← dòng 131: mở file NGAY, dù chưa có dữ liệu
  └── axios.get(httpsUrl, ...)     ← dòng 133: thử HTTPS
       └── pipeline(response, writer) ← dòng 134: ghi stream vào file
            └── nếu lỗi → catch   ← dòng 135
                 ├── nếu network error → fallback HTTP
                 │    └── nếu lỗi → KHÔNG CÓ cleanup ← partial file tồn đọng
                 └── nếu non-network error → throw ← KHÔNG cleanup ← partial file tồn đọng
```

### Code hiện tại

```ts
async function download(url: string, filePath: string): Promise<void> {
  const writer = createWriteStream(filePath);   // ← mở file NGAY
  try {
    const response = await axios.get(httpsUrl, { responseType: 'stream' });
    await pipeline(response.data, writer);
  } catch (err) {
    // Không có finally block — file rỗng/partial tồn đọng
  }
}
```

## Nguyên nhân gốc rễ

- `createWriteStream(filePath)` tạo file ngay khi gọi, dù chưa có dữ liệu.
- Không có `finally` block để dọn dẹp file khi lỗi.
- Fallback HTTP không có try/catch riêng.

## Tác động

| Tác động | Mức độ | Chi tiết |
|----------|--------|----------|
| File corrupt tích luỹ | Cao | Mỗi lần download thất bại, file `.zip` partial tồn đọng trong thư mục engine. |
| Checksum mismatch gây nhầm lẫn | Trung bình | Lần chạy sau phát hiện checksum sai, xoá toàn bộ engineDir và tải lại — dev không biết nguyên nhân gốc là file partial. |
```

## Quy tắc

| Phần | Yêu cầu |
|------|---------|
| `## Mô tả` | Mô tả **vấn đề cụ thể** — file, dòng, hành vi sai. Dùng flow diagram và code block nếu cần. |
| `## Nguyên nhân gốc rễ` | Giải thích **tại sao** xảy ra. Không đề xuất giải pháp. |
| `## Tác động` | Phân loại mức độ: **Cao** (crash, mất dữ liệu), **Trung bình** (sai kết quả), **Thấp** (khó chịu). |

## Lưu ý

- **Không chứa giải pháp:** Không có phần "Cách khắc phục", "Fix", "Giải pháp đề xuất" trong issue body.
- **Code block:** Dùng ```ts hoặc ```diff để highlight code.
- **File path:** Luôn dùng backtick `` `path/to/file.ts:dòng` `` và relative từ root dự án.
- **Flow diagram:** Dùng text-based flowchart (ASCII art) — không dùng hình ảnh.
- **Bảng:** Dùng khi có 2+ tác động. Nếu chỉ 1 tác động, dùng bullet.
