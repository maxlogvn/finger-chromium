# Design: Bug #15 — PCAP server retry EADDRINUSE nhưng promise gốc không bao giờ resolve

## Bối cảnh

PCAP server dùng `once()` + Promise để khởi động TCP server. Khi port đã được dùng (EADDRINUSE), error handler hiện tại chỉ gọi `svr.listen()` lại sau 1s mà không gắn `'listening'` callback — promise gốc không bao giờ resolve, caller treo vĩnh viễn.

## Câu hỏi làm rõ

- Có nên reject promise và throw lỗi cho caller xử lý? → Không, vì caller (connector) cần PCAP port để chạy, không có fallback. Retry tự động là hợp lý.
- Retry bao nhiêu lần? → Chỉ retry 1 lần là đủ (EADDRINUSE hiếm khi kéo dài). Nếu vẫn fail, để error bubble lên caller.
- Có cần timeout cho retry? → Không cần — nếu port vẫn bận sau retry, listen() sẽ emit error khác (EADDRINUSE lần nữa), lúc đó reject.

## Các phương án

### Phương án 1: Gắn lại resolve callback trong retry (chọn)

Khi EADDRINUSE, gọi `svr.listen()` trong setTimeout với đầy đủ callback resolve.
Nếu error không phải EADDRINUSE, reject promise.

```ts
svr.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    setTimeout(() => {
      svr.listen(port, host, listeningCallback);
    }, 1000).unref();
  } else {
    reject(error);
  }
});
```

- Ưu điểm: Giữ nguyên cấu trúc `once()` + Promise, thay đổi tối thiểu.
- Nhược điểm: `resolve` và `reject` phải được capture trong closure — cần lưu ý TypeScript narrowing.

### Phương án 2: Rewrite thành async function + while loop

```ts
while (true) {
  try { await net.createServer().listen(); break; }
  catch (e) { if (e.code !== 'EADDRINUSE') throw e; await setTimeout(1000); }
}
```

- Ưu điểm: Dễ đọc, rõ luồng retry.
- Nhược điểm: Phá vỡ cấu trúc `once()` hiện tại. Không tương thích với `svr.on('error')` pattern đã dùng.

## Giải pháp được chọn

- **Phương án AI đề xuất:** Phương án 1 (gắn resolve callback trong retry).
- **Phương án được chọn:** Phương án 1.
- **Lý do:** Thay đổi tối thiểu, dễ review. Giữ nguyên contract `listen()` return Promise<number>.
- **Ràng buộc:** `retryCount` tối đa 1 lần — nếu vẫn EADDRINUSE thì reject.
