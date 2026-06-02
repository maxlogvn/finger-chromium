# Plan: PCAP Server

- [x] Bước 1: Tạo TCP server với net.createServer
- [x] Bước 2: Xử lý 2 lệnh binary (0x01, 0x07)
- [x] Bước 3: Counter increment cho request ID
- [x] Bước 4: Retry port khi EADDRINUSE
- [x] Bước 5: Wrap với once() để singleton
