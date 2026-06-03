# Spec: Dọn dẹp file engine corrupt khi download thất bại

> Tuân thủ quy ước code tại [CONVENTIONS.md](../CONVENTIONS.md).

## Mô tả

Hàm `download()` hiện tại mở file đích ngay từ đầu (`createWriteStream(filePath)`) và không dọn dẹp khi download thất bại. Cần chuyển sang cơ chế temp file + rename: ghi vào file `.tmp`, chỉ đổi tên thành file chính thức khi pipeline thành công, và xoá file `.tmp` nếu có lỗi.

## Yêu cầu

- File `.zip` partial không được tồn đọng trong thư mục engine sau khi download thất bại.
- File đích (`FastExecuteScript.x<ARCH>.zip`) không được xuất hiện ở trạng thái corrupt — hoặc là file hoàn chỉnh, hoặc không tồn tại.
- Xử lý cross-device rename (khi thư mục tạm và thư mục engine khác partition): fallback `copyFile` + `unlink`.
- Lỗi cleanup không được che giấu lỗi gốc — nếu cleanup fail, ưu tiên throw lỗi gốc.
- Tương thích Windows (dùng `fs/promises` API).

## Thiết kế

Tham chiếu design doc: `docs/designs/bug-024-download-cleanup.design.md` (Phương án 1: Temp file + rename).

## API / Data flow

```ts
async function download(url: string, filePath: string): Promise<void>
```

Luồng mới:

```
createWriteStream(tmpPath)        ← mở file .tmp
  └── axios.get(httpsUrl, ...)    ← thử HTTPS
       └── pipeline(response, writer) ← ghi vào .tmp
            └── nếu lỗi → catch
                 ├── network error → fallback HTTP
                 │    └── axios.get(url, ...)
                 │         └── pipeline(response, writer)
                 │              └── nếu lỗi → catch → unlink(tmpPath) + throw
                 └── non-network error → catch → unlink(tmpPath) + throw
  rename(tmpPath, filePath)       ← chỉ khi pipeline thành công
```

## Components

- `src/plugin/connector/engine.ts` (sửa) — hàm `download()`:

  | Thay đổi | Mô tả |
  |----------|-------|
  | `createWriteStream(filePath)` → `createWriteStream(tmpPath)` | Ghi vào file `.tmp` |
  | Thêm `try/catch` bao toàn bộ | Bắt lỗi từ cả HTTPS và fallback HTTP |
  | `catch` → `fs.unlink(tmpPath)` | Xoá file `.tmp` nếu lỗi |
  | Sau pipeline → `fs.rename(tmpPath, filePath)` | Đổi tên thành file chính thức |
  | Fallback `copyFile` + `unlink` nếu `rename` fail cross-device | Xử lý cross-device |

## Xử lý lỗi

| Kịch bản | Xử lý |
|----------|-------|
| HTTPS network error + HTTP cũng network error | unlink(tmpPath), throw lỗi từ HTTP request |
| HTTPS fallback HTTP, pipeline() fail mid-stream | unlink(tmpPath), throw lỗi pipeline |
| HTTPS 4xx/5xx (non-network error) | unlink(tmpPath), throw lỗi HTTPS |
| HTTPS pipeline fail (timeout, reset, disk full) | unlink(tmpPath), throw lỗi pipeline |
| `fs.rename()` cross-device | fallback `fs.copyFile()` + `fs.unlink()` |
| `fs.unlink()` thất bại | catch silent — không che lỗi gốc |

## Kiểm tra

- **Happy path:** download thành công qua HTTPS, file `.tmp` được rename thành file đích, không còn file `.tmp`.
- **Fallback path:** HTTPS fail network, HTTP thành công, file `.tmp` được rename.
- **Error path HTTPS 4xx:** file `.tmp` bị xoá, throw lỗi.
- **Error path cả HTTPS và HTTP đều fail:** file `.tmp` bị xoá, throw lỗi.
- **Cross-device rename:** tạo thư mục tạm ở drive khác, đảm bảo `copyFile` + `unlink` fallback hoạt động.

> **Lưu ý:** Test cross-device khó tự động hoá trên CI — có thể test manual hoặc mock `fs.rename` để simulate cross-device error.
