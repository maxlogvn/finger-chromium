# Spec: Fix quit() không dọn dẹp hết handles

> Tuân thủ quy ước code tại [CONVENTIONS.md](../CONVENTIONS.md).

## Mô tả

Mở rộng `quit()` để dọn dẹp đầy đủ tất cả tài nguyên nền: worker.exe, engine process, PCAP server, cleaner timer, mutex. Mục tiêu: Node.js process có thể thoát tự nhiên sau quit.

## Yêu cầu

- `quit()` kill toàn bộ child processes (worker.exe + FastExecuteScript.exe).
- `quit()` close PCAP server (TCP listener).
- `quit()` stop cleaner timer + unlock files.
- `quit()` release Windows named mutex.
- An toàn khi gọi concurrent và nhiều lần (idempotent).
- Tránh double-close browser (try/catch swallow).

## Thiết kế

Cleanup flow:

```
quit()
  1. isLaunched = false
  2. BrowserContext.close()
  3. browser.close()          taskkill worker.exe
  4. engine.kill()            kill FastExecuteScript.exe
  5. pcapServer.close()       close TCP server
  6. mutex.release()          release BASProcess{pid}
  7. cleaner.stop()           clearInterval + unlock
  8. unmap profile
```

Xem [Design](../designs/quit-handle-cleanup.design.md).

## Components

| Component | Method | Chức năng |
|---|---|---|
| `FingerprintPlugin` | `cleanup()` | Dọn dẹp tổng thể |
| `BrowserEngine` | `quit()` | Set guard, gọi engine cleanup |
| `RemoteEngine` | `kill()` | Kill engine process |
| `pcapServer` | `close()` | Close TCP server |
| `connector/index.ts` | `cleanup()` | Gọi engine.kill + pcapServer.close |
| `SettingsCleaner` | `stop()` | Clear interval + unlock files |
| `mutex/index.ts` | `release()` | Gọi native close() |

## Xử lý lỗi

- `browser.close()` fail -> `.catch(() => {})` swallow.
- `engine.kill()` không process -> skip silently.
- `pcapServer.close()` chưa listen -> resolve ngay.
- `mutex.release()` native không có `close` -> skip.
- `quit()` concurrent -> guard `isLaunched = false` set sớm.

## Kiểm tra

- `npm run lint` -- 0 errors.
- `npm run build` -- tsup bundle thành công.
- Gọi `quit()` 2 lần -- không crash.
- Node.js process exit tự nhiên sau quit.
