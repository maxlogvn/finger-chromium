# Overview: Browser Launcher

## Tóm tắt

Đã triển khai module spawn Chromium child process: spawn Chromium -> parse DevTools listening URL từ stderr -> trả về `Browser` object. `close()` dùng `taskkill /T /F` để kill process tree.

## Kiến trúc

```
BrowserLauncher
  |-- Interface: Browser
  |     configure(options)    no-op (compatibility)
  |     close()               kill process tree
  |
  |-- LaunchOptions
  |     args: string[]        extra Chromium args
  |     executablePath: string path đến Chromium
  |
  |-- launch(options)         spawn -> parse URL -> return Browser
  |     |-- child_process.spawn(executablePath, args)
  |     |-- RegExp tìm DevTools listening URL trên stderr
  |     |-- timeout mechanism (AbortController)
  |     |-- return { process, close, configure }
```

## Tham chiếu code

| Component | File | Dòng |
|---|---|---|
| `Browser` interface | `src/plugin/launcher/index.ts` | 10-15 |
| `LaunchOptions` interface | `src/plugin/launcher/index.ts` | 17-22 |
| `launch()` | `src/plugin/launcher/index.ts` | 24-70 |
| Regex parse DevTools URL | `src/plugin/launcher/index.ts` | 40-45 |
| Timeout mechanism | `src/plugin/launcher/index.ts` | 55-60 |
| `close()` (taskkill) | `src/plugin/launcher/index.ts` | 72-85 |
| `configure()` no-op | `src/plugin/launcher/index.ts` | 87-90 |

## Flow launch chi tiết

```
launch(options)
  1. options.validate() -- kiểm tra executablePath + args
  2. const process = spawn(executablePath, args, { stdio: ['ignore', 'pipe', 'pipe'] })
  3. process.on('error') -> reject (spawn fail)
  4. process.stderr.on('data') -> chunk + buffer -> RegExp tìm URL
     Regex: /DevTools listening on (ws:\/\/[^\s]+)/
  5. Promise.race:
       |-- stderr match -> resolve({ process, close, configure })
       |-- timeout (AbortController) -> reject + kill process
  6. process.on('exit') -> cleanup
```

## Quyết định thiết kế

- **`taskkill /T /F`**: Windows `child_process.kill()` không kill process tree. `/T` flag kill toàn bộ child processes, `/F` force kill.
- **`configure()` no-op**: Interface tương thích với `Browser` type dùng trong `FingerprintPlugin`. Plugin path configure riêng qua CDP.
- **Regex `DevTools listening on`**: Chromium in ra dòng này trên stderr khi DevTools ready. Format: `ws://host:port/devtools/browser/...`.
- **AbortController timeout**: Nếu Chromium không in URL trong thời gian timeout (mặc định 30s) -> abort + kill process. User biết sớm thay vì treo vô hạn.
- **stdio pipe stderr**: Không pipe stdout (quá nhiều data), pipe stderr để bắt DevTools URL.

## Edge cases

- Chromium crash trước khi in URL -> stderr `error` event -> reject.
- Chromium in URL nhiều lần (multiple DevTools sessions) -> lần đầu resolve, ignore các lần sau.
- `executablePath` không tồn tại -> spawn throw `ENOENT`.
- Process bị kill từ ngoài (`process.exit`) -> `close()` kiểm tra `process.killed`.

## Lưu ý

- Dùng `taskkill` thay vì `process.kill()` -- đảm bảo kill toàn bộ process tree.
- `close()` safe multi-call -- kiểm tra `!process.killed`.
- Regex pattern: `/(?:DevTools listening on )(ws:\/\/[^\s]+)/`.

## Tài liệu liên quan

- `docs/designs/browser-launcher.design.md`
- `docs/specs/browser-launcher.spec.md`
- `docs/plans/browser-launcher.plan.md`
- `docs/products/browser-launcher.product.md`
- `src/plugin/launcher/index.ts`
