# Plan: PCAP Server

## Các bước thực hiện

- [x] **Bước 1: Tạo listen() function với once() wrapper** (file: `src/plugin/connector/pcapServer/index.ts`, dòng 14-54)

    **Signature:**
    ```ts
    export const listen = once((port = 0, host = '127.0.0.1'): Promise<number>)
    ```

    **Logic chi tiết:**
    1. Biến module-level `let server: net.Server | undefined`.
    2. `once()` wrap — function chỉ chạy một lần, các lần gọi sau return undefined.
    3. Bên trong:
       ```ts
       let id = 0;
       return new Promise<number>((resolve) => {
         server = net.createServer((socket) => {
           // socket handler
           socket.on('data', (data: Buffer) => {
             if (data.length === 0) return;
             const byte = data[0];
             if (byte === 1) {
               // Request ID: response 9 bytes
               socket.write(new Uint8Array([0x01, 0x04, 0x00, 0x00, 0x00, 0x0a, id & 0xff, (id >> 8) & 0xff, (id >> 16) & 0xff]));
               id++;
             }
             if (byte === 7) {
               // Heartbeat: response 5 bytes
               socket.write(new Uint8Array([0x07, 0x00, 0x00, 0x00, 0x00]));
             }
           });
           socket.on('error', (error: Error) => log(error));
         });
         server.on('error', (error: NodeJS.ErrnoException) => {
           if (error.code === 'EADDRINUSE') {
             setTimeout(() => server!.listen(port, host), 1000).unref();
           }
         });
         server.listen(port, host, () => {
           const address = server.address();
           if (address && typeof address === 'object') resolve(address.port);
         });
       });
       ```

    **Binary protocol detail:**
    ```
    [0x01] request ID:
    Request:  [0x01] (1 byte)
    Response: [0x01] [0x04, 0x00, 0x00, 0x00] [0x0a] [ID_byte0] [ID_byte1] [ID_byte2]
              type    length (4, LE)          status   id (3 bytes, LE)
              = 9 bytes total

    [0x07] heartbeat:
    Request:  [0x07] (1 byte)
    Response: [0x07] [0x00, 0x00, 0x00, 0x00]
              type    length (0)
              = 5 bytes total
    ```

    **Edge cases:**
    - `data.length = 0` → return (bỏ qua empty packet).
    - `data[0]` không phải 0x01 hoặc 0x07 → ignore (engine gửi lệnh không xác định).
    - Socket error → log bằng debug, không crash server.
    - ID overflow (sau 16 triệu request) → byte mask vẫn hoạt động (id & 0xff).
    - `server.listen(0)` → OS chọn port random.

    **Tại sao:** `once()` đảm bảo chỉ một server — nếu gọi lại, không tạo server mới. `port = 0` cho OS random port, tránh conflict. Binary protocol lightweight — không cần parse text.

- [x] **Bước 2: Xử lý EADDRINUSE** (file: `src/plugin/connector/pcapServer/index.ts`, dòng 42-46)

    **Logic:**
    ```ts
    server.on('error', (error: NodeJS.ErrnoException) => {
      if (error.code === 'EADDRINUSE') {
        setTimeout(() => server!.listen(port, host), 1000).unref();
      }
    });
    ```

    **Edge cases:**
    - EADDRINUSE vẫn tồn tại sau 1s → lỗi từ `server.listen` lần 2 không được bắt → uncaught exception → crash.
    - Port conflict với process khác → retry 1 lần.
    - EACCES (permission denied) → không retry, throw luôn → crash.

    **Tại sao:** Chỉ retry 1 lần — nếu port vẫn bận sau 1s, khả năng cao là conflict vĩnh viễn. `.unref()` không block process exit.

- [x] **Bước 3: Tạo close() function** (file: `src/plugin/connector/pcapServer/index.ts`, dòng 60-71)

    **Signature:**
    ```ts
    export const close = (): Promise<void>
    ```

    **Logic:**
    ```ts
    return new Promise((resolve) => {
      if (server) {
        server.close(() => { server = undefined; resolve(); });
      } else {
        resolve();
      }
    });
    ```

    **Edge cases:**
    - `server === undefined` (chưa listen) → resolve ngay.
    - `server.close()` callback gọi sau khi socket đã close — set undefined để nếu listen() được gọi lại, không reuse server cũ.
    - Gọi close nhiều lần → lần 2: server undefined → resolve ngay.

    **Tại sao:** Set `server = undefined` trong callback (không trước) tránh race — nếu listen() được gọi đồng thời, server.close() chưa xong thì server vẫn reference đến server cũ.

## Kiểm tra

```bash
npm run lint      # ESLint check
```

Test thủ công: launch engine, kiểm tra log `PCAP server đang lắng nghe tại port X`.

## Ghi chú

- Biến `server` module-level (let), không export — chỉ pcapServer module quản lý.
- Binary protocol: request 0x01 (9 bytes response), heartbeat 0x07 (5 bytes response).
- `once()` đảm bảo listen chỉ gọi một lần.
- Không authentication — chỉ localhost (127.0.0.1) nên an toàn.
- `server.listen(0)` → OS random port → engine nhận port qua `--mock-pcap-port`.
