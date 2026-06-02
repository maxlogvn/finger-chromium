# Product: PCAP Server

## Tổng quan

PCAP Server là mock TCP server engine cần để giao tiếp. Chạy local, tự động retry port khi bận.

## Cách hoạt động

```ts
// Tự động khởi động khi import connector
pcapServer.listen().then((port) => {
  engine.setArgs([`--mock-pcap-port=${port}`]);
});
```

Server lắng nghe tại `127.0.0.1`, port ngẫu nhiên (0 = system assigned).
