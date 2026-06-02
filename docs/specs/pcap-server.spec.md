# Spec: PCAP Server

## Mô tả

PCAP server là TCP server nhỏ (52 dòng) mô phỏng PCAP interface cho engine FastExecuteScript.exe. Nó xử lý request ID và heartbeat qua giao thức binary.

## API / Interfaces chính

### `listen(port, host)`

```ts
export const listen = once((port = 0, host = '127.0.0.1'): Promise<number>)
```

- `port`: Cổng TCP (0 = random).
- `host`: Địa chỉ lắng nghe (mặc định localhost).
- Returns: `Promise<number>` -- port đang lắng nghe.
- Dùng `once()` để chỉ gọi một lần.

## Luồng dữ liệu

### Request ID (0x01)

```
Engine → Server: [0x01]
Server → Engine: [0x01, 0x04, 0x00, 0x00, 0x00, 0x0a, id_lo, id_mid, id_hi]
  │
  ├── 0x01: loại response
  ├── 0x04: độ dài payload (4 bytes)
  ├── 0x00, 0x00, 0x00, 0x0a: magic number
  └── id (3 bytes, little-endian): ID tăng dần mỗi lần
```

### Heartbeat (0x07)

```
Engine → Server: [0x07]
Server → Engine: [0x07, 0x00, 0x00, 0x00, 0x00]
  │
  ├── 0x07: loại response
  └── 0x00, 0x00, 0x00, 0x00: payload rỗng
```

## File liên quan

| File | Vai trò |
|---|---|
| `src/plugin/connector/pcapServer/index.ts` | TCP server (52 dòng) |
| `src/plugin/connector/index.ts` | Gọi pcapServer.listen() khi import |

## Xử lý lỗi

| Lỗi | Xử lý |
|---|---|
| `EADDRINUSE` | Retry sau 1 giây (setTimeout.unref()) |
| Socket error (client disconnect) | Log bằng `debug` |

## Ghi chú kỹ thuật

- `net.createServer` tạo TCP server thuần Node.js, không cần thư viện bên ngoài.
- `once()` từ package `once` đảm bảo chỉ một server được khởi tạo.
- `setTimeout(...).unref()` -- không giữ process sống nếu không còn tác vụ nào khác.
- ID counter bắt đầu từ 0, tăng dần mỗi lần engine request.

---
