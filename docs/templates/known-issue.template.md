# Known Issue: <tóm tắt ngắn>

> **Chú ý:** Template này dùng cho **body của GitHub issue**, chỉ mô tả vấn đề – không đề xuất giải pháp.

## Mô tả
Mô tả chi tiết vấn đề: file, dòng code, hành vi sai.

### Steps to reproduce (Các bước tái hiện)
1. Chạy lệnh `npm run download-asset` với URL trả về lỗi 500.
2. Quan sát thư mục `./engines/` sau khi lệnh thất bại.

### Environment
- **OS:** Windows 11 / Ubuntu 22.04
- **Node version:** 20.x
- **Engine version:** 2.0.5
- **Plugin version:** commit abc123

### Flow hiện tại (nếu có)
```
createWriteStream(filePath)        ← mở file NGAY
  └── axios.get(...)               ← gửi request
       └── pipeline(response, writer)
            └── lỗi → catch (không cleanup)
```
### Code hiện tại (nếu có)
```ts
async function download(url: string, filePath: string): Promise<void> {
  const writer = createWriteStream(filePath);   // ← mở file sớm
  try {
    const response = await axios.get(url, { responseType: 'stream' });
    await pipeline(response.data, writer);
  } catch (err) {
    // Không cleanup file rỗng/partial
  }
}
```

## Nguyên nhân gốc rễ
Giải thích **tại sao** bug xảy ra, không chỉ triệu chứng.

- `createWriteStream` tạo file ngay khi gọi, dù chưa có dữ liệu.
- Không có `finally` hoặc `catch` riêng để xóa file khi lỗi.
- Fallback HTTP cũng không có cleanup.

## Tác động

| Tác động | Mức độ | Ai bị ảnh hưởng | Chi tiết |
|----------|--------|----------------|----------|
| File rác tích lũy | Cao | Dev, CI | Mỗi lần fail, file `.zip` rỗng tồn tại trong `engineDir`. |
| Checksum mismatch gây nhầm lẫn | Trung bình | Dev | Lần chạy sau checksum sai → xóa toàn bộ và tải lại, lãng phí thời gian. |

*(Nếu chỉ 1 tác động, dùng bullet thay vì bảng)*
