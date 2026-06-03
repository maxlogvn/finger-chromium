# Spec: Bug #15 — PCAP server retry EADDRINUSE promise không resolve

> Tuân thủ quy ước code tại [CONVENTIONS.md](../CONVENTIONS.md). Tham chiếu design: [Design](../designs/bug-015-pcap-promise-hang.design.md)

## Mô tả

Khi PCAP server khởi động và port đã được dùng, error handler gọi `svr.listen()` retry sau 1s nhưng không gắn `'listening'` callback. Promise gốc của `listen()` không bao giờ resolve — caller (`Connector.#ensurePcapPort`) treo vĩnh viễn. Engine không thể khởi động.

## Yêu cầu

- Khi EADDRINUSE, retry `listen()` sau 1s với đầy đủ callback resolve — promise gốc phải resolve với port thành công.
- Nếu error sau retry vẫn là EADDRINUSE (hoặc error khác), reject promise để caller biết lỗi.
- Giữ nguyên contract: `listen()` là async function trả về `Promise<number>`, gọi được một lần nhờ `once()`.

## Thiết kế

Xem `docs/designs/bug-015-pcap-promise-hang.design.md`.

Thay đổi duy nhất: trong `svr.on('error')`, thay vì `setTimeout(() => svr.listen(port, host), 1000)`, gọi với callback đầy đủ:

```ts
setTimeout(() => {
  svr.listen(port, host, listeningCallback);
}, 1000);
```

Đồng thời thêm `reject` cho các error không phải EADDRINUSE.

## API / Data flow

- Input: `pcapServer.listen(port, host)` — port 0 = random.
- Output: Promise<number> — port đang lắng nghe.
- Data flow không thay đổi so với hiện tại.

## Components

- `src/plugin/connector/pcapServer/index.ts` — sửa error handler + retry logic.

## Xử lý lỗi

| Tình huống | Xử lý hiện tại | Xử lý mới |
|---|---|---|
| EADDRINUSE lần đầu | Retry listen sau 1s, promise treo | Retry listen với callback resolve |
| EADDRINUSE lần 2 | Retry tiếp, promise vẫn treo | Reject promise |
| Error khác (EACCES, EADDRNOTAVAIL...) | Không xử lý, im lặng | Reject promise với error gốc |

## Kiểm tra

- Happy path: port khả dụng → resolve với port, không retry.
- Edge case: EADDRINUSE lần đầu, retry thành công → resolve với port mới.
- Error case: EADDRINUSE liên tục → reject với error.
- Error case: error không phải EADDRINUSE → reject ngay.
