# Plan: Fix quit() không dọn dẹp hết handles

## Các bước thực hiện

- [x] Step 1: engine.ts -- Lưu process reference + thêm `kill()`
    - Field `#process`, gán sau spawn, method `kill()` kill process.

- [x] Step 2: pcapServer -- Lưu server reference + export `close()`
    - `server` module scope, `close()` set undefined sau callback.

- [x] Step 3: connector/index.ts -- Thêm `cleanup()`
    - Gọi `engine.kill()` + `pcapServer.close()`.

- [x] Step 4: cleaner.ts -- Thêm `stop()` + unlock files
    - Clear interval, unlock file còn locked, clear folders.

- [x] Step 5: mutex/index.ts -- Thêm `release()` export
    - Gọi `mutex.close` nếu native hỗ trợ, skip nếu không.

- [x] Step 6: plugin/index.ts -- Lưu Browser ref + thêm `cleanup()`
    - Field `browser`, `processId`. Method `cleanup()` gọi browser.close + connectorCleanup + mutexRelease + cleaner.stop.

- [x] Step 7: chromium.ts -- Mở rộng `quit()`
    - Guard `isLaunched = false` sớm, gọi `engine.cleanup()`.

## Kiểm tra

- `npm run lint` -- 0 errors.
- `npm run build` -- tsup build thành công.

## Ghi chú

- Non-feature task: chỉ cần overview, không cần product doc.
- Bỏ Step 7 trong plan gốc (PlaywrightFingerprintPlugin override) -- không cần.
- `isConnected()` không có trong Browser interface -- dùng try/catch thay thế.
