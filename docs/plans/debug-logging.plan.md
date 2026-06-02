# Plan: Debug Logging

## Các bước thực hiện

- [x] **Bước 1: Cài đặt `debug` package** -- đã có trong dependencies.

- [x] **Bước 2: Tạo logger trong `connector/index.ts`**
  - Namespace: `browser-with-fingerprints:connector`.

- [x] **Bước 3: Tạo logger trong `connector/engine.ts`**
  - Namespace: `browser-with-fingerprints:connector:engine`.

- [x] **Bước 4: Tạo logger trong `connector/pcapServer/index.ts`**
  - Namespace: `browser-with-fingerprints:connector:pcapServer`.

- [x] **Bước 5: Tạo logger trong `plugin/cleaner.ts`**
  - Namespace: `browser-with-fingerprints:cleaner`.

- [x] **Bước 6: Thêm log statements vào các file tương ứng**
  - engine.ts: IPC request/response, download, extract, spawn, metadata.
  - index.ts: PCAP server listening.
  - cleaner.ts: lock compromised.

## File liên quan

| File | Namespace |
|---|---|
| `src/plugin/connector/index.ts` | `browser-with-fingerprints:connector` |
| `src/plugin/connector/engine.ts` | `browser-with-fingerprints:connector:engine` |
| `src/plugin/connector/pcapServer/index.ts` | `browser-with-fingerprints:connector:pcapServer` |
| `src/plugin/cleaner.ts` | `browser-with-fingerprints:cleaner` |

## Kiểm tra

- `npm run lint` -- 0 errors.
- Bật DEBUG để kiểm tra output.

---
