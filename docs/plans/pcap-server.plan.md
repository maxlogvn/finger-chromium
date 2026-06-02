# Plan: PCAP Server

- [x] Bước 1: Tạo TCP server với `net.createServer` trên 127.0.0.1:0 (OS assign port)
  - Chỉ accept connection, không validate client -- bất kỳ ai connect cũng được phục vụ

- [x] Bước 2: Xử lý lệnh binary 0x01 (Request ID)
  - Parse byte đầu tiên của buffer
  - Response 9 bytes: header (6 bytes) + id (3 bytes, little-endian)
  - Internal counter increment mỗi lần request

- [x] Bước 3: Xử lý lệnh binary 0x07 (Heartbeat)
  - Response 5 bytes cố định: `[0x07, 0x00, 0x00, 0x00, 0x00]`
  - Không cần tracking heartbeat state

- [x] Bước 4: Retry port khi EADDRINUSE
  - `setTimeout(1000).unref()` -- không block process exit
  - Retry vô hạn (không giới hạn số lần)

- [x] Bước 5: Wrap với `once()` package để singleton
  - `once()` cache kết quả Promise -- lần gọi thứ 2 trả về port cũ
  - Quan trọng vì connector/index.ts gọi listen() ở module level

## Edge cases

- Buffer có thể chứa nhiều hơn 1 byte (nhiều lệnh gộp) -- hiện tại chỉ xử lý byte đầu
- Socket close không được handle -- nếu client mất kết nối, server vẫn listen
- ID counter là số 24-bit (max 16,777,215) -- nếu vượt quá, overflow xảy ra (quay về 0)
- Không có rate limiting -- client có thể spam request ID
