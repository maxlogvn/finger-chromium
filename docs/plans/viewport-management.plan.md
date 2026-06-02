# Plan: Quản lý Viewport

- [x] Bước 1: Kết nối CDP (chrome-remote-interface) tới browser
- [x] Bước 2: Implement setViewport() với delta correction, retry max 3
- [x] Bước 3: Implement waitForResize() -- CDP Runtime.evaluate
- [x] Bước 4: Implement getViewport() -- CDP Runtime.evaluate getViewport script
- [x] Bước 5: Implement synchronize() -- đọc/ghi .ini file với AsyncLock
- [x] Bước 6: Hai-phase reset (BAS_NOT_SET → action → real values)
