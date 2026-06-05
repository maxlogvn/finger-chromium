
## Ghi chú kiến trúc

Các lưu ý quan trọng về thiết kế và rủi ro cần biết khi phát triển:

- **Phụ thuộc bablosoft engine:** Toàn bộ cơ chế inject fingerprint dựa vào binary engine của bablosoft (`FastExecuteScript.exe`) — closed-source, không audit được. Nếu bablosoft thay đổi API, checksum, hoặc ngừng service, thư viện ngừng hoạt động.
- **Chỉ hỗ trợ Windows:** Dự án giới hạn ở `win32` (native mutex C++ addon, engine binary chỉ chạy trên Windows). Không thể mở rộng sang macOS/Linux mà không viết lại toàn bộ tầng inject.
- **File-based IPC:** Engine giao tiếp qua file system (ghi JSON request file, chokidar watch phản hồi) thay vì pipe/socket. Đơn giản nhưng chậm hơn và dễ gặp vấn đề quyền truy cập file trên Windows.

---



## Engine Lifecycle

```
1. updateMeta() ── đọc project.xml → axios fetch metadata → so sánh checksum
2. download()   ── axios stream → pipeline → verify SHA1
3. extract()    ── extract-zip → copy config files
4. spawn()      ── execFile FastExecuteScript.exe → parse DevTools URL
5. IPC          ── write JSON → chokidar watch → read JSON response
6. cleanup()    ── fast-glob tìm file tạm → proper-lockfile check → xoá
```

## Hai đường CDP độc lập

```
Đường 1 (low-level, không cần Playwright):
  launcher/index.ts spawn worker.exe
    → parse DevTools URL
      → browser.ts: chrome-remote-interface connect(url)
        → Browser.setWindowBounds

Đường 2 (high-level, Playwright adapter):
  PlaywrightFingerprintPlugin → launchPersistentContext
    → utils.ts: page.context().newCDPSession(page)
      → CDPSession.send('Browser.setWindowBounds')
```

`chrome-remote-interface` dùng cho đường 1 vì kết nối trực tiếp đến raw DevTools URL, độc lập với Playwright.

## Tầng kiến trúc

```
┌─────────────────────────────────────────┐
│           Adapter Layer                 │
│  (adapter/playwright/)                  │
│  Bridge Playwright ↔ Plugin            │
├─────────────────────────────────────────┤
│           Plugin Layer                  │
│  (plugin/)                              │
│  Quản lý engine lifecycle + CDP + IPC  │
├─────────────────────────────────────────┤
│           Loader Layer                  │
│  (loader/)                              │
│  Dynamic import + version validation   │
├─────────────────────────────────────────┤
│           Types Layer                   │
│  (types/)                               │
│  Pure type definitions                 │
└─────────────────────────────────────────┘
```
