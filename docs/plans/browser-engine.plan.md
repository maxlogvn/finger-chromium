# Plan: BrowserEngine

- [x] Bước 1: Tạo class BrowserEngine implement PWChromium (singleton `Chromium`)
- [x] Bước 2: Constructor: khởi tạo engine, dataManager, đọc env
- [x] Bước 3: Implement fluent config methods (useFingerprint, useProxy, useProfile)
- [x] Bước 4: Implement repackChromium() -- custom launcher
- [x] Bước 5: Implement launch() -- merge options, config engine, 1 lần
- [x] Bước 6: Implement newContext() -- validate lifecycle, call engine
- [x] Bước 7: Implement quit() -- close context, save profile, cleanup
- [x] Bước 8: Implement newFingerprint() -- proxy tới engine.fetch()
