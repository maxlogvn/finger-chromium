# Spec: PCAP Server

## Module: src/plugin/connector/pcapServer/index.ts

### Export

```ts
export const listen: (port?: number, host?: string) => Promise<number>;
```

Wrapped với `once()` -- chỉ một server duy nhất, gọi lần 2 trả về port cũ.

### Protocol

| Lệnh | Mã | Request | Response |
|---|---|---|---|
| Request ID | `0x01` | `[0x01]` | `[0x01, 0x04, 0x00, 0x00, 0x00, 0x0a, id, id>>8, id>>16]` |
| Heartbeat | `0x07` | `[0x07]` | `[0x07, 0x00, 0x00, 0x00, 0x00]` |

### Implementation

```ts
const server = net.createServer((socket) => {
  socket.on('data', (buffer) => {
    const cmd = buffer[0];
    if (cmd === 0x01) {
      const response = new Uint8Array([0x01, 0x04, 0x00, 0x00, 0x00, 0x0a, id, id>>8, id>>16]);
      id++;
      socket.write(response);
    } else if (cmd === 0x07) {
      socket.write(new Uint8Array([0x07, 0x00, 0x00, 0x00, 0x00]));
    }
  });
});
```

### Error handling

- `EADDRINUSE` -> retry sau 1s
- `.unref()` trên timer retry để không block process exit
