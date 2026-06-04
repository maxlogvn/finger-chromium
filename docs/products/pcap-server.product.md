# Product: PCAP Server

## Mô tả

PCAP Server là một TCP server tối giản mô phỏng PCAP interface. Engine binary (`FastExecuteScript.exe`) cần server này để gửi và nhận ID request — đây là một phần của cơ chế đồng bộ giữa Node.js process và engine process.

PCAP ở đây không phải packet capture. Tên này giữ từ code gốc của BAS (Browser Automation Studio).

## Cách sử dụng

PCAP server được lazy init ở lần gọi API đầu tiên. Bạn cũng có thể khởi động thủ công nếu cần:

```ts
import * as pcapServer from './plugin/connector/pcapServer';

// Khởi động trên port cụ thể
const port = await pcapServer.listen(0, '127.0.0.1');

// Dừng khi cleanup
await pcapServer.close();
```

## Hành vi chi tiết

- Server chỉ hiểu 2 lệnh binary:
  - `0x01` (Request ID): engine yêu cầu một ID mới — server phản hồi với ID dạng số.
  - `0x07` (Heartbeat): engine kiểm tra server còn sống — server phản hồi xác nhận.
- `listen()` dùng `startPromise` module-level caching: lần đầu tạo server, các lần sau trả về cùng promise (cùng port). Sau `close()`, có thể gọi `listen()` lại để tạo server mới.
- Nếu port đã được dùng (EADDRINUSE), retry sau 1 giây. **Lưu ý:** Trên Windows, `SO_REUSEADDR` mặc định khiến EADDRINUSE không thể kích hoạt qua normal means.
- `close()` kiểm tra server tồn tại trước khi đóng — an toàn khi gọi nhiều lần.
- Port được dùng để set `--mock-pcap-port=<port>` cho engine args.

## Giới hạn và điều kiện

- Chỉ hỗ trợ 2 lệnh binary (`0x01`, `0x07`).
- Server listen trên `127.0.0.1` (localhost) — không expose ra ngoài.
- Không liên quan đến PCAP network capture thật.

## Tài liệu kỹ thuật liên quan

- Spec: `docs/specs/pcap-server.spec.md`
- Design: `docs/designs/pcap-server.design.md`
- Source: `src/plugin/connector/pcapServer/index.ts`
