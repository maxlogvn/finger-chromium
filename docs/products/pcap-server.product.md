# Product: PCAP Server

## Tổng quan

Mock TCP server mô phỏng PCAP interface cho engine binary. Cần thiết để `worker.exe` hoạt động vì nó luôn cố gắng kết nối tới PCAP server khi khởi động.

## Cách hoạt động

Server chạy trên `127.0.0.1:<port>` (OS assign), xử lý 2 lệnh:
- **Request ID (0x01)**: Trả về ID tăng dần, dùng cho internal tracking
- **Heartbeat (0x07)**: Worker gửi để báo còn sống

Server tự động start khi module connector được load.
