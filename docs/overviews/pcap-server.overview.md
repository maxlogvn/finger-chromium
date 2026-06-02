# Overview: PCAP Server

File: `src/plugin/connector/pcapServer/index.ts` (52 dòng).

## Lưu ý kỹ thuật

- `once()` wrapping: `once` package wrap function để chỉ gọi một lần. Lần gọi thứ 2 trả về Promise đã resolved từ lần đầu (cached result). Điều này quan trọng vì `connector/index.ts` gọi `pcapServer.listen()` ở module level -- nếu module được import nhiều lần, server chỉ được tạo một lần.
- Retry `EADDRINUSE` với `.unref()`: timer retry không giữ process alive. Nếu process muốn exit, timer sẽ không chặn.
- Response bytes cố định: request ID trả về 9 bytes, trong đó 3 byte cuối là ID (24-bit). Giới hạn 16 triệu request -- đủ dùng.
