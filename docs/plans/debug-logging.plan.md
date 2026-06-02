# Plan: Debug Logging

## Các bước thực hiện

- [x] **Bước 1: Cài đặt thư viện debug** (file: `package.json`)

    **Signature:**
    ```json
    "debug": "^4.4.3"
    ```

    **Tại sao:** `debug` là thư viện logging nhẹ, theo namespace, kiểm soát qua biến môi trường `DEBUG`.

- [x] **Bước 2: Tạo logger cho từng module** (file: `src/plugin/connector/index.ts`, dòng 18-22)

    **Signatures:**
    ```ts
    import debug from 'debug';

    export const log = debug('browser-with-fingerprints:connector');
    export const logError = debug('browser-with-fingerprints:connector');
    ```

    **Chi tiết các namespace:**
    | Namespace | File | Mục đích |
    |---|---|---|
    | `browser-with-fingerprints:connector` | `src/plugin/connector/index.ts` | API connector chính |
    | `browser-with-fingerprints:connector:engine` | `src/plugin/connector/engine.ts` | RemoteEngine lifecycle |
    | `browser-with-fingerprints:connector:pcapServer` | `src/plugin/connector/pcapServer/index.ts` | PCAP server |
    | `browser-with-fingerprints:cleaner` | `src/plugin/cleaner.ts` | File cleanup daemon |

    **Tại sao:** Namespace theo module hierarchy — bật `browser-with-fingerprints:connector:*` log tất cả connector sub-modules.

- [x] **Bước 3: Sử dụng logger trong code** (file: các module tương ứng)

    **Pattern:**
    ```ts
    log('RemoteEngine: bắt đầu download từ %s', url);
    logError('cleaner: lỗi xoá file %s', filePath);
    ```

    **Bật log:**
    ```bash
    set DEBUG=browser-with-fingerprints:connector:*  # Windows CMD
    $env:DEBUG = 'browser-with-fingerprints:connector:*'  # PowerShell
    ```

    **Edge cases:**
    - `DEBUG=` rỗng → không log gì.
    - `DEBUG=*` → log tất cả.
    - `DEBUG=browser-with-fingerprints:*` → log tất cả module.

    **Tại sao:** Dùng `debug` thay `console.log` — user kiểm soát log level qua env, không log production.

## Kiểm tra

```bash
npm run lint      # ESLint check
```

## Ghi chú

- 4 namespace, tất cả prefix `browser-with-fingerprints:`.
- Không log secrets (key, IP proxy).
- `logError` tái sử dụng namespace — `.error()` tự thêm prefix `ERROR`.
