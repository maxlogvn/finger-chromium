# Overview: PCAP Server

## Mục tiêu

Xây dựng TCP server nhỏ mô phỏng PCAP interface để engine FastExecuteScript.exe có thể kết nối và giao tiếp.

## Kết quả

- `src/plugin/connector/pcapServer/index.ts`: 52 dòng.
- Xử lý 2 lệnh: request ID (0x01) và heartbeat (0x07).
- Retry port khi EADDRINUSE.
- Dùng `once()` để đảm bảo singleton.
- Export `listen` function trả về Promise<number>.

## Kiểm tra

- `npm run lint` -- 0 errors.
- `net` module built-in, không cần dependencies bổ sung.

## Sai lệch so với kế hoạch

| Kế hoạch | Thực tế | Lý do |
|---|---|---|
| PCAP server start riêng biệt | Tự động start khi connector import | Đơn giản hoá, tránh quên start |

## Ghi chú kỹ thuật

- `once()` từ package `once` đảm bảo chỉ gọi `listen()` một lần -- an toàn khi nhiều module cùng import connector.
- ID tăng dần từ 0, dùng 3 byte (little-endian) -- đủ cho 16 triệu request.
- Magic number `0x0a` trong response ID có ý nghĩa với engine (không rõ).

---
