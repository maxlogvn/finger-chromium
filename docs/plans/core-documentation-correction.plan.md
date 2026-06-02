# Plan: Hiệu chỉnh tài liệu core theo code thực tế

## Các bước thực hiện

- [x] Bước 1: Audit source và docs của cụm BrowserEngine
    - Làm gì:
      - Đọc `src/adapter/playwright/chromium.ts` và `src/types/PWChromium.ts`.
      - Đọc các file docs hiện tại của BrowserEngine.
      - Ghi lại API có thật, API sai, luồng launch/newContext/quit, và các điểm cần giải thích "tại sao".
    - File liên quan:
      - `src/adapter/playwright/chromium.ts`
      - `src/types/PWChromium.ts`
      - `docs/designs/browser-engine.design.md`
      - `docs/specs/browser-engine.spec.md`
      - `docs/products/browser-engine.product.md`
      - `docs/overviews/browser-engine.overview.md`
    - Kiểm tra tại bước này:
      - `rg -n "usePrivateKey|launch\\(|newContext\\(|quit\\(" src/adapter/playwright/chromium.ts src/types/PWChromium.ts docs/designs/browser-engine.design.md docs/specs/browser-engine.spec.md docs/products/browser-engine.product.md docs/overviews/browser-engine.overview.md`
    - Ghi chú:
      - `usePrivateKey()` đang xuất hiện trong docs cũ nhưng không có trong `BrowserEngine`. Đây là sai lệch bắt buộc sửa.

- [x] Bước 2: Viết lại docs BrowserEngine
    - Làm gì:
      - Sửa design/spec/product/overview của BrowserEngine.
      - Product doc phải có ví dụ dùng `Chromium` không gọi `usePrivateKey()`.
      - Spec phải mô tả rõ `PRIVATE_KEY` lấy từ `BABLOSOFT_KEY`, `DEFAULT_CONTEXT_OPTIONS`, `BROWSER_RUNNING_DIR`, `ENGINE_WORKING_DIR`.
      - Mô tả rõ vì sao `useProfile()` map profile sang thư mục tạm và vì sao `quit()` cần `engine.cleanup()`.
    - File liên quan:
      - `docs/designs/browser-engine.design.md`
      - `docs/specs/browser-engine.spec.md`
      - `docs/products/browser-engine.product.md`
      - `docs/overviews/browser-engine.overview.md`
    - Phụ thuộc:
      - Yêu cầu bước 1 hoàn thành trước.
    - Kiểm tra tại bước này:
      - `rg -n "usePrivateKey" docs/designs/browser-engine.design.md docs/specs/browser-engine.spec.md docs/products/browser-engine.product.md docs/overviews/browser-engine.overview.md`
      - Kết quả mong đợi: không có dòng nào.

- [x] Bước 3: Audit source và docs của cụm Playwright Bridge
    - Làm gì:
      - Đọc `src/adapter/playwright/engine.ts`, `src/adapter/playwright/utils.ts`, và `src/adapter/playwright/loader.ts`.
      - Đọc các file docs hiện tại của Playwright Bridge.
      - Ghi lại luồng `launch()` fallback, `launchPersistentContext()`, validate unsupported options, filter args, configure viewport.
    - File liên quan:
      - `src/adapter/playwright/engine.ts`
      - `src/adapter/playwright/utils.ts`
      - `src/adapter/playwright/loader.ts`
      - `docs/designs/playwright-bridge.design.md`
      - `docs/specs/playwright-bridge.spec.md`
      - `docs/products/playwright-bridge.product.md`
      - `docs/overviews/playwright-bridge.overview.md`
    - Kiểm tra tại bước này:
      - `rg -n "LAUNCH_FALLBACK_WARNING|UNSUPPORTED_OPTIONS|IGNORED_ARGUMENTS|launchPersistentContext|configure\\(" src/adapter/playwright/engine.ts docs/designs/playwright-bridge.design.md docs/specs/playwright-bridge.spec.md docs/products/playwright-bridge.product.md docs/overviews/playwright-bridge.overview.md`

- [x] Bước 4: Viết lại docs Playwright Bridge
    - Làm gì:
      - Sửa design/spec/product/overview của Playwright Bridge.
      - Giải thích `launchPersistentContext`: Playwright mở browser với thư mục profile cố định.
      - Giải thích vì sao `launch()` fallback sang `launchPersistentContext()`.
      - Ghi rõ unsupported options: `proxy`, `channel`, `firefoxUserPrefs`.
      - Ghi rõ `--disable-extensions` được thêm vào `ignoreDefaultArgs`.
      - Mô tả `configure()` đăng ký cleanup, resize page đầu tiên, và bind hook cho page mới.
    - File liên quan:
      - `docs/designs/playwright-bridge.design.md`
      - `docs/specs/playwright-bridge.spec.md`
      - `docs/products/playwright-bridge.product.md`
      - `docs/overviews/playwright-bridge.overview.md`
    - Phụ thuộc:
      - Yêu cầu bước 3 hoàn thành trước.
    - Kiểm tra tại bước này:
      - `rg -n "proxy|channel|firefoxUserPrefs|launchPersistentContext|--disable-extensions" docs/designs/playwright-bridge.design.md docs/specs/playwright-bridge.spec.md docs/products/playwright-bridge.product.md docs/overviews/playwright-bridge.overview.md`
      - Kết quả mong đợi: các thuật ngữ này xuất hiện trong phần giải thích đúng ngữ cảnh.

- [x] Bước 5: Audit source và docs của cụm FingerprintPlugin
    - Làm gì:
      - Đọc `src/plugin/index.ts`, `src/plugin/utils.ts`, và `src/plugin/config.ts`.
      - Đọc các file docs hiện tại của FingerprintPlugin.
      - Ghi lại các method cấu hình, API service, `_launch()` 6 bước, và `cleanup()`.
    - File liên quan:
      - `src/plugin/index.ts`
      - `src/plugin/utils.ts`
      - `src/plugin/config.ts`
      - `docs/designs/fingerprint-plugin.design.md`
      - `docs/specs/fingerprint-plugin.spec.md`
      - `docs/products/fingerprint-plugin.product.md`
      - `docs/overviews/fingerprint-plugin.overview.md`
    - Kiểm tra tại bước này:
      - `rg -n "useFingerprint|useProxy|useProfile|useBrowserVersion|setProxyFromArguments|setWorkingFolder|setRequestTimeout|setEngineTimeout|setServiceKey|fetch\\(|versions\\(|spawn\\(|cleanup\\(|_launch" src/plugin/index.ts docs/designs/fingerprint-plugin.design.md docs/specs/fingerprint-plugin.spec.md docs/products/fingerprint-plugin.product.md docs/overviews/fingerprint-plugin.overview.md`

- [x] Bước 6: Viết lại docs FingerprintPlugin
    - Làm gì:
      - Sửa design/spec/product/overview của FingerprintPlugin.
      - Mô tả rõ `_launch()` theo 6 bước trong code:
        1. lấy proxy từ args nếu chưa có,
        2. gọi `api('setup')`,
        3. đăng ký cleaner và mutex,
        4. chọn launcher,
        5. spawn `worker.exe`,
        6. chạy configure/synchronize.
      - Giải thích vì sao `headless` bị ép về `false`.
      - Giải thích `serviceKey` là biến module-level, vì `fetch()`, `versions()`, và `setup` đều cần key.
      - Mô tả cleanup theo đúng code: `browser.close()`, `connectorCleanup()`, `mutex.release()`, `cleaner.stop()`.
    - File liên quan:
      - `docs/designs/fingerprint-plugin.design.md`
      - `docs/specs/fingerprint-plugin.spec.md`
      - `docs/products/fingerprint-plugin.product.md`
      - `docs/overviews/fingerprint-plugin.overview.md`
    - Phụ thuộc:
      - Yêu cầu bước 5 hoàn thành trước.
    - Kiểm tra tại bước này:
      - `rg -n "setProxyFromArguments|api\\('setup'\\)|worker\\.exe|headless|connectorCleanup|mutex\\.release|cleaner\\.stop" docs/designs/fingerprint-plugin.design.md docs/specs/fingerprint-plugin.spec.md docs/products/fingerprint-plugin.product.md docs/overviews/fingerprint-plugin.overview.md`

- [ ] Bước 7: Audit source và docs của cụm API Connector
    - Làm gì:
      - Đọc `src/plugin/connector/index.ts` và `src/plugin/connector/pcapServer/index.ts`.
      - Đọc các file docs hiện tại của API Connector.
      - Ghi lại singleton `engine`, `AsyncLock`, auto-start PCAP server, event log, `perfectCanvasRequest`, và cleanup.
    - File liên quan:
      - `src/plugin/connector/index.ts`
      - `src/plugin/connector/pcapServer/index.ts`
      - `docs/designs/api-connector.design.md`
      - `docs/specs/api-connector.spec.md`
      - `docs/products/api-connector.product.md`
      - `docs/overviews/api-connector.overview.md`
    - Kiểm tra tại bước này:
      - `rg -n "AsyncLock|perfectCanvasRequest|beforeDownload|beforeExtract|pcapServer|cleanup|export \\{ engine \\}" src/plugin/connector/index.ts docs/designs/api-connector.design.md docs/specs/api-connector.spec.md docs/products/api-connector.product.md docs/overviews/api-connector.overview.md`

- [ ] Bước 8: Viết lại docs API Connector
    - Làm gì:
      - Sửa design/spec/product/overview của API Connector.
      - Giải thích vì sao dùng `AsyncLock`: engine file IPC xử lý tuần tự, request chồng lên nhau dễ làm lẫn request/response.
      - Giải thích `perfectCanvasRequest` dùng request timeout `0` vì tác vụ này có thể lâu hơn request thường.
      - Ghi rõ `FINGERPRINT_CWD` và `FINGERPRINT_TIMEOUT`.
      - Ghi rõ `cleanup()` chỉ kill engine và close PCAP server; cleanup mutex/cleaner nằm ở `FingerprintPlugin.cleanup()`.
    - File liên quan:
      - `docs/designs/api-connector.design.md`
      - `docs/specs/api-connector.spec.md`
      - `docs/products/api-connector.product.md`
      - `docs/overviews/api-connector.overview.md`
    - Phụ thuộc:
      - Yêu cầu bước 7 hoàn thành trước.
    - Kiểm tra tại bước này:
      - `rg -n "AsyncLock|perfectCanvasRequest|FINGERPRINT_CWD|FINGERPRINT_TIMEOUT|engine\\.kill|pcapServer\\.close" docs/designs/api-connector.design.md docs/specs/api-connector.spec.md docs/products/api-connector.product.md docs/overviews/api-connector.overview.md`

- [ ] Bước 9: Audit source và docs của cụm RemoteEngine
    - Làm gì:
      - Đọc `src/plugin/connector/engine.ts` và `project.xml`.
      - Đọc các file docs hiện tại của RemoteEngine.
      - Ghi lại constants, package root resolution, metadata cache, checksum, download/extract, request file, watcher, timeout, kill.
    - File liên quan:
      - `src/plugin/connector/engine.ts`
      - `project.xml`
      - `docs/designs/remote-engine.design.md`
      - `docs/specs/remote-engine.spec.md`
      - `docs/products/remote-engine.product.md`
      - `docs/overviews/remote-engine.overview.md`
    - Kiểm tra tại bước này:
      - `rg -n "CLOSE_TIMEOUT|DEFAULT_TIMEOUT|ARCH|resolvePackageRoot|PROJECT_PATH|runFunction|beforeDownload|beforeExtract|checksum|extract|kill\\(" src/plugin/connector/engine.ts docs/designs/remote-engine.design.md docs/specs/remote-engine.spec.md docs/products/remote-engine.product.md docs/overviews/remote-engine.overview.md`

- [ ] Bước 10: Viết lại docs RemoteEngine
    - Làm gì:
      - Sửa design/spec/product/overview của RemoteEngine.
      - Giải thích file-based IPC: ghi JSON request file và watch cùng file để nhận response.
      - Giải thích vì sao cần dọn request file cũ dựa theo PID.
      - Ghi rõ `DEFAULT_TIMEOUT = 300_000`, `CLOSE_TIMEOUT = 60_000`, và `ARCH`.
      - Ghi rõ `resolvePackageRoot()` đi ngược thư mục để tìm package root, tránh sai đường dẫn sau khi bundle.
      - Mô tả event `beforeDownload`, `beforeExtract`, và `kill()`.
    - File liên quan:
      - `docs/designs/remote-engine.design.md`
      - `docs/specs/remote-engine.spec.md`
      - `docs/products/remote-engine.product.md`
      - `docs/overviews/remote-engine.overview.md`
    - Phụ thuộc:
      - Yêu cầu bước 9 hoàn thành trước.
    - Kiểm tra tại bước này:
      - `rg -n "file-based IPC|DEFAULT_TIMEOUT|CLOSE_TIMEOUT|ARCH|resolvePackageRoot|beforeDownload|beforeExtract|kill\\(\\)" docs/designs/remote-engine.design.md docs/specs/remote-engine.spec.md docs/products/remote-engine.product.md docs/overviews/remote-engine.overview.md`

- [ ] Bước 11: Rà soát luồng core xuyên suốt
    - Làm gì:
      - Đọc lại 20 file docs đã sửa của 5 cụm core.
      - Đảm bảo luồng launch và cleanup không mâu thuẫn giữa các cụm.
      - Sửa `docs/ROADMAP.md` nếu còn ghi API sai trong phần core, ví dụ `usePrivateKey`.
    - File liên quan:
      - `docs/designs/browser-engine.design.md`
      - `docs/specs/browser-engine.spec.md`
      - `docs/products/browser-engine.product.md`
      - `docs/overviews/browser-engine.overview.md`
      - `docs/designs/playwright-bridge.design.md`
      - `docs/specs/playwright-bridge.spec.md`
      - `docs/products/playwright-bridge.product.md`
      - `docs/overviews/playwright-bridge.overview.md`
      - `docs/designs/fingerprint-plugin.design.md`
      - `docs/specs/fingerprint-plugin.spec.md`
      - `docs/products/fingerprint-plugin.product.md`
      - `docs/overviews/fingerprint-plugin.overview.md`
      - `docs/designs/api-connector.design.md`
      - `docs/specs/api-connector.spec.md`
      - `docs/products/api-connector.product.md`
      - `docs/overviews/api-connector.overview.md`
      - `docs/designs/remote-engine.design.md`
      - `docs/specs/remote-engine.spec.md`
      - `docs/products/remote-engine.product.md`
      - `docs/overviews/remote-engine.overview.md`
      - `docs/ROADMAP.md`
    - Phụ thuộc:
      - Yêu cầu bước 2, 4, 6, 8, 10 hoàn thành trước.
    - Kiểm tra tại bước này:
      - `rg -n "usePrivateKey" docs/designs/browser-engine.design.md docs/specs/browser-engine.spec.md docs/products/browser-engine.product.md docs/overviews/browser-engine.overview.md docs/ROADMAP.md`
      - Kết quả mong đợi: không còn dòng nào mô tả `usePrivateKey` là API của BrowserEngine.
      - `rg -n "Chromium -> PlaywrightFingerprintPlugin -> FingerprintPlugin -> API Connector -> RemoteEngine|BrowserEngine\\.newContext\\(\\)|api\\('setup'\\)|RemoteEngine\\.runFunction" docs/designs docs/specs docs/products docs/overviews`
      - Kết quả mong đợi: luồng core xuất hiện trong docs task mới và các cụm liên quan.

- [ ] Bước 12: Viết overview cho task core-documentation-correction
    - Làm gì:
      - Tạo `docs/overviews/core-documentation-correction.overview.md`.
      - Ghi rõ file đã sửa, sai lệch đã phát hiện, phần đã cố ý không sửa, và kiểm tra đã chạy.
      - Ghi rõ đây là non-feature task nên không có product doc riêng cho task tổng.
    - File liên quan:
      - `docs/overviews/core-documentation-correction.overview.md`
    - Phụ thuộc:
      - Yêu cầu bước 11 hoàn thành trước.
    - Kiểm tra tại bước này:
      - `Test-Path docs/overviews/core-documentation-correction.overview.md`
      - Kết quả mong đợi: `True`.

- [ ] Bước 13: Cập nhật Roadmap hoàn thành task
    - Làm gì:
      - Cập nhật mục `Hiệu chỉnh tài liệu core theo code thực tế`.
      - Đổi trạng thái từ `[/] Đang làm` sang `[X] Hoàn thành`.
      - Thêm link Plan và Overview.
      - Ghi ngắn gọn các cụm đã xử lý và kiểm tra đã chạy.
    - File liên quan:
      - `docs/ROADMAP.md`
    - Phụ thuộc:
      - Yêu cầu bước 12 hoàn thành trước.
    - Kiểm tra tại bước này:
      - `rg -n "Hiệu chỉnh tài liệu core theo code thực tế|core-documentation-correction" docs/ROADMAP.md`
      - Kết quả mong đợi: mục roadmap có đủ Design, Spec, Plan, Overview.

- [ ] Bước 14: Kiểm tra cuối cùng
    - Làm gì:
      - Chạy các lệnh rà soát docs.
      - Đọc lại diff để đảm bảo không sửa ngoài phạm vi.
      - Không chạy test browser vì task không sửa code runtime.
    - File liên quan:
      - Toàn bộ file docs đã sửa trong task này.
    - Phụ thuộc:
      - Yêu cầu bước 13 hoàn thành trước.
    - Kiểm tra tại bước này:
      - `rg -n "TBD|TODO|\\.\\.\\.|<tên" docs/designs/core-documentation-correction.design.md docs/specs/core-documentation-correction.spec.md docs/plans/core-documentation-correction.plan.md docs/overviews/core-documentation-correction.overview.md`
      - Kết quả mong đợi: không có dòng nào.
      - `rg -n "usePrivateKey" docs/designs/browser-engine.design.md docs/specs/browser-engine.spec.md docs/products/browser-engine.product.md docs/overviews/browser-engine.overview.md docs/ROADMAP.md`
      - Kết quả mong đợi: không có dòng nào mô tả `usePrivateKey` là API hiện có.
      - `git diff -- docs/designs docs/specs docs/products docs/overviews docs/plans docs/ROADMAP.md`
      - Kết quả mong đợi: diff chỉ gồm tài liệu trong phạm vi đã duyệt hoặc các cập nhật roadmap/overview liên quan.

## Kiểm tra

Các lệnh cần chạy sau khi thực hiện xong plan:

- `rg -n "TBD|TODO|\\.\\.\\.|<tên" docs/designs/core-documentation-correction.design.md docs/specs/core-documentation-correction.spec.md docs/plans/core-documentation-correction.plan.md docs/overviews/core-documentation-correction.overview.md`
- `rg -n "usePrivateKey" docs/designs/browser-engine.design.md docs/specs/browser-engine.spec.md docs/products/browser-engine.product.md docs/overviews/browser-engine.overview.md docs/ROADMAP.md`
- `rg -n "BrowserEngine\\.newContext\\(\\)|PlaywrightFingerprintPlugin\\.launchPersistentContext\\(\\)|api\\('setup'\\)|RemoteEngine\\.runFunction" docs/designs docs/specs docs/products docs/overviews`
- `git diff -- docs/designs docs/specs docs/products docs/overviews docs/plans docs/ROADMAP.md`

Không cần chạy `npm test` vì task này không sửa code TypeScript. Nếu trong lúc thực hiện phát hiện cần sửa code, phải dừng lại và quay về bước spec/plan để người duyệt quyết định.

## Ghi chú

- Worktree hiện có nhiều thay đổi docs sẵn từ trước. Khi thực hiện plan, không được revert hoặc ghi đè thay đổi ngoài phạm vi.
- Nếu gặp nội dung docs ngoài 5 cụm core nhưng có liên quan, chỉ ghi lại trong overview để xử lý vòng sau.
- Mọi nội dung mới phải viết bằng tiếng Việt thân thiện, giải thích "tại sao", và tránh thuật ngữ khó nếu không có giải thích ngắn đi kèm.
