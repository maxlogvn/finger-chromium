# Công nghệ sử dụng

> Giải thích vai trò và lý do chọn từng package trong dự án, giúp hiểu kiến trúc và quyết định thiết kế.

---

## Core

### `playwright-core` >=1.60.0 (peer dependency)

**Vai trò:** Cung cấp type định nghĩa (`BrowserContext`, `BrowserType`, `Page`, `CDPSession`) cho Playwright adapter. Runtime load động qua `Loader` class -- không import tĩnh ở top-level.

**Lý do chọn:**
- Là peer dependency thay vì direct dependency để thư viện hoạt động với bất kỳ phiên bản Playwright nào người dùng đã cài.
- Runtime loading cho phép `Loader` fallback: thử `require('playwright')` trước, nếu không có thì dùng `playwright-core`. Người dùng không cần cài Playwright nếu chỉ dùng module loader độc lập.
- Yêu cầu tối thiểu `>=1.27.1` (trong `loader.ts`) nhưng peer dependency khai báo `>=1.60.0` để đảm bảo API ổn định.

---

### `chrome-remote-interface` 0.34.0

**Vai trò:** Giao tiếp CDP (Chrome DevTools Protocol) trực tiếp với browser process, không qua Playwright. Dùng để resize viewport với độ chính xác cao (`Browser.getWindowForTarget` + `Browser.setWindowBounds`).

**Lý do chọn:**
- Hoạt động ở tầng **browser process**, không phải page context. Playwright `CDPSession` chỉ hoạt động sau khi có `Page`, không thể resize trước khi trang load.
- Chỉ phụ thuộc vào WebSocket -- không cần Playwright hay bất kỳ thư viện trình duyệt nào.
- Cơ chế retry với delta correction: resize → đo viewport thực tế qua `Runtime.evaluate` → điều chỉnh sai số → resize lại. Chính xác hơn Playwright `page.setViewportSize()` vì không bị block bởi anti-fingerprint checks.

---

## Concurrency & Locking

### `async-lock` 1.4.1

**Vai trò:** Lock trong cùng tiến trình (in-process) -- serialize các async operation trong cùng một Node.js instance. Dùng ở `connector` (đồng bộ API request đến engine) và `config` (đồng bộ ghi file `.ini`).

**Lý do chọn:**
- JavaScript đơn luồng nhưng `await` có thể interleave -- một boolean flag không thể ngăn hai async function chạy xen kẽ.
- Nhẹ (zero dependencies), mỗi instance có lock riêng (`#lock`), không gây contention global khi chạy nhiều browser session cùng lúc.
- Chỉ lock trong memory, không I/O -- nhanh hơn filesystem lock nhiều lần.

### `proper-lockfile` 4.1.2

**Vai trò:** Lock giữa các tiến trình khác nhau (cross-process) -- dùng trong `SettingsCleaner` để tránh xoá file tạm khi engine binary (`FastExecuteScript.exe`) đang dùng.

**Lý do chọn:**
- Engine binary là process C++ riêng biệt. `async-lock` không thể đồng bộ với một process ngoài Node.js.
- Cơ chế: tạo file `.lock` bên cạnh file cần bảo vệ. Engine không cần biết về lock -- cleaner tự kiểm tra `lock.check()` trước khi xoá.
- Xử lý tốt các edge case trên Windows: stale lock, retry trên EBUSY, atomic lock file creation, callback `onCompromised` khi lock file bị hỏng.

> **Tại sao cần cả 2?** Chúng giải quyết 2 vấn đề hoàn toàn khác nhau:
> | `async-lock` | `proper-lockfile` |
> |---|---|
> | Trong cùng Node.js process | Giữa Node.js và C++ process |
> | Queue promise trong memory | `.lock` file trên disk |
> | Đồng bộ API call, ghi `.ini` | Ngăn xoá file khi engine đang dùng |
> | Nhanh (không I/O) | Chậm hơn (có I/O) nhưng cross-process |

---

## I/O & File Operations

### `axios` 1.15.2

**Vai trò:** HTTP/HTTPS client -- tải engine ZIP và fetch metadata từ bablosoft server.

**Lý do chọn:**
- Cơ chế fallback HTTPS → HTTP khi gặp lỗi mạng (`ERR_NETWORK`, `ECONNREFUSED`, `ECONNRESET`). Rất quan trọng trong môi trường có SSL inspection hoặc proxy chặn HTTPS.
- `responseType: 'stream'` cho phép stream file xuống disk mà không cần buffer toàn bộ trong memory.
- Error handling chi tiết hơn `fetch` built-in: `err.code` cho network error, `err.response` cho HTTP error.

### `chokidar` ^5.0.0

**Vai trò:** Watch file thay đổi -- dùng trong file-based IPC với engine binary. Node.js ghi JSON request → engine xử lý → ghi response vào cùng file → chokidar báo hiệu.

**Lý do chọn:**
- `fs.watch()` không đáng tin cậy trên Windows (thiếu event, double fire). chokidar dùng polling fallback khi cần.
- `awaitWriteFinish: true` đợi file ngừng thay đổi trước khi fire event -- tránh đọc file chưa ghi xong.
- Nhẹ hơn polling `setInterval` + `fs.readFile` vì chỉ fire khi có thay đổi thật sự.

### `extract-zip` 2.0.1

**Vai trò:** Giải nén engine ZIP sau khi tải về.

**Lý do chọn:**
- Xử lý tốt edge case: long path trên Windows, file lớn, encoding issues.
- Dùng `yauzl` bên dưới -- thư viện ZIP streaming nổi tiếng về độ chính xác.
- API đơn giản: `extract(zipPath, { dir })` -- chỉ giải nén, không tạo, đúng nhu cầu.

### `fast-glob` 3.3.3

**Vai trò:** Liệt kê file tạm của engine (`t/<pid>`, `s/<id>.ini`) trong `SettingsCleaner`.

**Lý do chọn:**
- Dùng glob pattern thay vì gọi `fs.readdir` nhiều lần + filter thủ công.
- `stats: true` trả về `mtimeMs` để so sánh tuổi file -- tính năng cần thiết cho cleanup logic (chỉ xoá file > 15s).
- Nhanh hơn `glob` classic vì dùng `picomatch` và worker threads.

---

## Utilities

### `compare-versions` 6.1.1

**Vai trò:** So sánh version string -- kiểm tra playwright version có >= minimum requirement không.

**Lý do chọn:**
- Nhỏ hơn `semver` (không dependencies), chỉ làm đúng một việc: so sánh version string.
- API trực tiếp: `compare(current, minimum, '<')` -- không cần parse range hay complex pattern.

### `debug` 4.4.3

**Vai trò:** Debug logging namespaced theo module.

**Lý do chọn:**
- Cho phép bật/tắt log theo namespace qua `DEBUG` env var: `DEBUG=browser-with-fingerprints:*`.
- Là standard trong Node.js ecosystem (dùng bởi Express, Playwright, v.v.) -- developer đã quen.
- Zero dependencies, kích thước siêu nhỏ.

### `dedent` 1.7.2

**Vai trò:** Xoá indent thừa trong template literal -- dùng cho error message và notification text nhiều dòng.

**Lý do chọn:**
- Template literal giữ nguyên whitespace -- code có indent đẹp nhưng output bị thừa tab/space.
- `dedent` loại bỏ leading indent dựa trên dòng có indent thấp nhất.

### `once` 1.4.0

**Vai trò:** Đảm bảo function chỉ chạy một lần -- dùng cho upgrade notification (chỉ hiện "please upgrade" một lần duy nhất trong vòng đời process).

**Lý do chọn:**
- Clean hơn boolean flag `let notified = false` -- `once(fn)` self-documenting.
- Xử lý edge case: nếu function throw ở lần đầu, lần sau cũng throw (không silent skip như flag).
- Encapsulate "one-time" guarantee ở function level, không scatter state.

---