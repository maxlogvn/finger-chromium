# Báo cáo đánh giá tính khả thi -- Phát triển phiên bản Linux

**Dự án**: fingerprint-chromium-engine
**Người thực hiện**: Solo developer (Node.js/TypeScript)
**Ngày**: 07/06/2026
**Kết luận**: **Không khả thi** trong điều kiện hiện tại.

---

## 1. Tóm tắt

Dự án `fingerprint-chromium-engine` là một thư viện Node.js dùng để inject fingerprint thiết bị thật vào Chromium ở tầng C++, nhằm vượt qua các hệ thống chống bot (Cloudflare, DataDome, Akamai). Hiện tại dự án **chỉ hoạt động trên Windows** vì phụ thuộc vào 2 thành phần C++ close-source chỉ có binary Windows:

1. `FastExecuteScript.exe` -- Engine script XML của BAS, chịu trách nhiệm quản lý vòng đời browser, cấu hình fingerprint/proxy/profile.
2. `worker.exe` -- Chromium đã được patch ở tầng C++ để inject fingerprint trước khi JavaScript chạy.

Sau khi phân tích toàn diện kiến trúc và các phương án kỹ thuật, kết luận là **việc phát triển phiên bản Linux là không khả thi** với một solo developer Node.js. Lý do chính: thiếu source code C++ của engine BAS, khối lượng công việc vượt quá khả năng của một cá nhân, và chi phí bảo trì hằng năm quá lớn.

---

## 2. Hiện trạng dự án và ràng buộc nền tảng

### 2.1 Các thành phần chỉ hoạt động trên Windows

| Thành phần | Vị trí | Vai trò | Vấn đề trên Linux |
|------------|--------|---------|-------------------|
| `FastExecuteScript.exe` | Tải về từ GitHub Releases | Trình thông dịch script XML, quản lý fingerprint/proxy/profile | Không có binary Linux |
| `worker.exe` | Trong thư mục engine | Chromium đã patch C++ để inject fingerprint | Không có binary Linux |
| `mutex.node` | `plugin/mutex/win32-*/` | Named mutex native (Windows API) để đồng bộ hoá process | Không có binary Linux |
| `taskkill` | `src/plugin/launcher/index.ts` dòng 105 | Dừng process tree bằng lệnh Windows | Lệnh này không tồn tại trên Linux |

### 2.2 Ràng buộc trong package.json

```json
"os": ["win32"]
```

Nguyên dòng này chặn `npm install` thực thi trên Linux.

### 2.3 Không có source code C++ trong repository

Toàn bộ repo này chỉ chứa code TypeScript/Node.js. Source code C++ của BAS engine (thư viện BrowserAutomationStudio) **không có trong repo** và không có quyền truy cập. Các file C++ chỉ tồn tại dưới dạng binary đã biên dịch sẵn.

---

## 3. Để có Linux, cần những gì?

### 3.1 Bảng tóm tắt công việc

| # | Công việc | Mô tả | Ước tính | Người thực hiện |
|---|-----------|-------|----------|-----------------|
| 1 | Engine Node.js | Viết lại logic của FastExecuteScript.exe bằng TypeScript (file-based IPC, parse project.xml, gọi API fetch fingerprint, quản lý profile) | 1-2 tuần | Solo dev hiện tại |
| 2 | Mutex cross-platform | Thay named mutex Windows bằng file lock hoặc Unix semaphore | 1-2 ngày | Solo dev hiện tại |
| 3 | Process kill Linux | Thay `taskkill` bằng `process.kill('SIGTERM')` hoặc `kill -9` | 1 ngày | Solo dev hiện tại |
| 4 | Package.json + docs | Mở rộng `"os"`, cập nhật tài liệu | 1 ngày | Solo dev hiện tại |
| **5** | **Chromium Linux đã patch C++** | **Can thiệp vào source code Chromium (~35 triệu dòng) để intercept canvas, WebGL, audio, navigator, font, screen API ở tầng C++** | **8-12 tháng** | **Cần C++ developer chuyên Chromium -- KHÔNG CÓ** |
| 6 | Bảo trì liên tục | Rebase patch mỗi 4 tuần khi Chromium release mới | 0.5-1 FTE/năm liên tục | Cần người toàn thời gian |

### 3.2 Phân tích mục 5: Chromium Linux đã patch C++

Đây là điểm nghẽn duy nhất nhưng cũng là điểm nghẽn không thể vượt qua. Để hiểu tại sao, cần nhìn vào các API cần can thiệp:

#### Nhóm A: API đơn giản (thay giá trị trả về) -- ~10 API, 2-3 tháng

| API | File Chromium cần sửa | Công việc |
|-----|----------------------|-----------|
| `navigator.userAgent` | `content/common/user_agent.cc` | Tìm đúng vị trí tạo chuỗi UA, thay bằng fingerprint |
| `navigator.platform` | `third_party/blink/renderer/core/frame/navigator_id.cc` | Tìm đúng vị trí trả về platform string |
| `navigator.hardwareConcurrency` | `third_party/blink/renderer/core/frame/navigator_id.cc` | Fake số lượng CPU core |
| `navigator.deviceMemory` | `third_party/blink/renderer/core/frame/navigator_device_memory.cc` | Fake dung lượng RAM |
| `navigator.language(s)` | `third_party/blink/renderer/core/frame/navigator_language.cc` | Fake danh sách ngôn ngữ |
| `screen.width/height` | `third_party/blink/renderer/core/frame/screen.cc` | Fake kích thước màn hình |
| `screen.colorDepth` | `third_party/blink/renderer/core/frame/screen.cc` | Fake độ sâu màu |
| Battery API | `third_party/blink/renderer/modules/battery/battery_manager.cc` | Fake pin level |
| Device Pixel Ratio | `chrome/browser/chrome_content_browser_client.cc` | Fake deviceScaleFactor |
| WebRTC IP | `third_party/webrtc/` | Fake ICE candidates |

#### Nhóm B: API phức tạp (can thiệp vào rendering pipeline) -- ~5 API, 4-6 tháng

| API | Độ khó | Lý do |
|-----|--------|------|
| **Canvas toDataURL** | Rất cao | Phải chặn ở tầng GPU command buffer hoặc Skia renderer. Font rendering khác nhau giữa Windows và Linux -- PerfectCanvas cần render giống hệt fingerprint gốc. Không có tài liệu, không có source tham khảo. Phải tự mò trong `third_party/blink/renderer/modules/canvas/` và `third_party/skia/` (hàng trăm nghìn dòng code). |
| **WebGL getParameter** | Cao | `RENDERER`, `VENDOR` đến từ driver GPU (`libGL.so` trên Linux), không dễ fake. Phải intercept ở tầng ANGLE (`third_party/angle/`) hoặc GPU command buffer (`gpu/command_buffer/`). |
| **AudioContext getChannelData** | Cao | Audio fingerprint dựa trên DSP rounding errors của phần cứng âm thanh. Phải thêm noise ở tầng `AudioBus` hoặc `IIRFilterNode` -- nơi không có API công khai để sửa đổi. |
| **Font enumeration** | Trung bình | Linux dùng fontconfig (`/etc/fonts/`), phải hook `SkFontMgr_fontconfig` hoặc Blink's `FontCacheLinux`. Danh sách font giống hệt fingerprint gốc. |
| **WebGL Noise** | Rất cao | Phải thêm noise vào shader compiler hoặc GPU output. Đụng đến GPU internals là điểm yếu của hầu hết C++ developer kể cả có kinh nghiệm. |

#### Nhóm C: Tính năng đặc biệt của engine BAS -- 2-3 tháng

| Tính năng | Mô tả |
|-----------|-------|
| Đọc file `.ini` để đồng bộ viewport | Thêm code đọc file trong Chromium main loop |
| `--parent-process-id`, `--unique-process-id` | Thêm CLI flag, gửi tín hiệu khi process cha chết |
| `--bas-force-visible-window` | Ép Chromium chạy ở non-headless mode với virtual display |

#### Sơ đồ thời gian phát triển Chromium Linux đã patch

```
Tháng 1        Tháng 2-3      Tháng 4-6      Tháng 7-9      Tháng 10-12
|-------------|--------------|--------------|--------------|--------------|
| Dựng môi    | Nhóm A        | Nhóm B        | Nhóm B (tt)  | Nhóm C       |
| trường build| 10 API đơn   | Canvas, WebGL | Audio, Font,  | .ini sync,    |
| Chromium    | giản          | cơ bản        | WebGL Noise   | CLI flags     |
| (2-4 tuần)  | (4-6 tuần)    | (6-8 tuần)   | (6-8 tuần)    | (4-6 tuần)    |
```

---

## 4. Chi phí bảo trì -- bài toán không có hồi kết

### 4.1 Chromium release mỗi 4 tuần

Chromium phát hành bản mới mỗi **4 tuần**, trung bình 3000-5000 commit mỗi tuần. Mỗi bản release mới có thể gây ra:

| Loại thay đổi | Tần suất | Ảnh hưởng |
|---------------|----------|-----------|
| Refactor nội bộ (đổi tên hàm, class) | Hằng tuần | Patch không compile |
| Di chuyển file giữa các thư mục | Vài tuần/lần | Patch không áp dụng được |
| Thay đổi API nội bộ (signature) | Mỗi release | Hàm hook bị sai tham số |
| Thay đổi rendering pipeline | Mỗi 2-3 release | Canvas/WebGL hook hỏng hoàn toàn |
| Thay đổi build system (`args.gn`, toolchain) | Mỗi 3-6 tháng | Không build nổi |

### 4.2 Chu kỳ bảo trì ước tính

| Công việc | Mỗi release (4 tuần) | Mỗi major (6 tháng) |
|-----------|---------------------|---------------------|
| Rebase patch lên Chromium mới | 2-4 ngày | 1-2 tuần |
| Build và fix lỗi compile | 1-2 ngày | 3-5 ngày |
| Test fingerprint (BrowserLeaks, F.vision, Pixelscan, CreepJS) | 1-2 ngày | 2-3 ngày |
| Fix API bị hỏng do refactor | 0-3 ngày | 1-2 tuần |
| **Tổng** | **4-11 ngày/release** | **2-5 tuần/major** |

### 4.3 Hệ quả nhân sự

- Với bản **tối thiểu** (chỉ Nhóm A): cần **10 giờ/tuần** để bảo trì (0.25 FTE).
- Với bản **đầy đủ** (toàn bộ A+B+C): cần **20-40 giờ/tuần** để bảo trì (0.5-1 FTE).

Không có khả năng tự động hoá việc rebase patch -- mỗi khi code upstream conflict, bắt buộc phải có người đọc code Chromium và hiểu nguyên nhân để sửa thủ công.

---

## 5. Dựa trên kinh nghiệm thực tế

Chính BAS (BrowserAutomationStudio) release engine mới rất thường xuyên. Trong repo này, `EngineVersion` trong `project.xml` là `29.9.2` -- đã có **29 phiên bản engine** được phát hành để theo kịp thay đổi của Chromium và các hệ thống chống bot. Một team C++ chuyên nghiệp của BAS phải duy trì việc này liên tục. Một solo dev không thể làm được.

---

## 6. So sánh nhanh các phương án thay thế

| Phương án | Stealth | Thời gian phát triển | Bảo trì | Khả thi với solo Node.js dev? |
|-----------|---------|---------------------|---------|-------------------------------|
| Build Chromium Linux từ source với patch C++ | Tối đa (tương đương Windows) | 8-12 tháng | 0.5-1 FTE liên tục | **Không** -- cần C++ dev chuyên Chromium |
| LD_PRELOAD injection | Cao (nhưng coi như Linux device) | 2-3 tháng | 0.25-0.5 FTE | **Không** -- vẫn cần C++ dev hiểu V8/Blink internal |
| CDP + JavaScript injection | Thấp (bị Cloudflare phát hiện) | 2-4 tuần | 1-2 ngày/release | **Có** -- nhưng không đạt mục tiêu stealth tầng C++ |
| Dùng Playwright CDP Emulation APIs | Rất thấp | 1 tuần | Tối thiểu | **Có** -- nhưng bị phát hiện bởi mọi fingerprint checker |

---

## 7. Kết luận

### 7.1 Không khả thi -- Lý do

1. **Không có người**: Solo Node.js/TypeScript developer không thể tự viết C++ patch cho Chromium. Kiến thức về Chromium internals (Blink, V8, Skia, ANGLE, GPU command buffer) là chuyên môn sâu, không phải kỹ năng có thể học trong vài tháng.

2. **Không có source**: Source code C++ của BAS engine là close-source. Tất cả những gì có được là binary Windows. Phải tự mò toàn bộ logic can thiệp Chromium từ con số 0.

3. **Khối lượng quá lớn**: Ước tính 8-12 tháng làm việc toàn thời gian để có bản đầy đủ. Đây là công việc cho một team 2-3 người, không phải solo dev.

4. **Bảo trì là gánh nặng**: Ngay cả khi hoàn thành ban đầu, chi phí bảo trì hằng năm (0.5-1 FTE) vượt quá khả năng của một cá nhân. Bản Linux sẽ nhanh chóng lỗi thời và không build được chỉ sau 1-2 release Chromium.

### 7.2 Khuyến nghị

Với điều kiện là solo Node.js developer, các phương án khả thi là:

- Tiếp tục sử dụng bản Windows trên máy chủ Windows hoặc VPS Windows.
- Sử dụng Windows container (Docker Windows) nếu cần chạy trong môi trường container hoá.
- Nếu bắt buộc phải có Linux, chấp nhận giải pháp CDP + JavaScript injection với mức stealth thấp hơn, phù hợp cho các trang web không có cơ chế chống bot nặng.

### 7.3 Phụ lục: Các file cần thay đổi nếu có đủ nguồn lực

Đây là danh sách file trong repo cần sửa đổi, giả sử đã có Chromium Linux và C++ developer:

| File | Thay đổi cần thiết | Mức độ |
|------|-------------------|--------|
| `src/plugin/connector/engine.ts` | Hard-coded `FastExecuteScript.exe` -> engine binary Linux; URL download thêm Linux variant | Cao |
| `src/plugin/index.ts` | Hard-coded `worker.exe` -> `chrome` binary Linux | Cao |
| `src/plugin/launcher/index.ts` | `taskkill` -> `kill -9` hoặc `process.kill('SIGKILL')` | Thấp |
| `src/plugin/mutex/index.ts` | Load native module Linux thay vì win32 | Cao |
| `plugin/mutex/` | Thêm `linux-x64/mutex.node` | Cao |
| `package.json` | `"os": ["win32"]` -> `"os": ["win32", "linux"]` | Thấp |
| `src/plugin/connector/engine.ts` | `ARCH` thêm arm64, linux paths | Thấp |
| `docs/faq.md` | Cập nhật câu hỏi về Linux | Thấp |
| `docs/engine-architecture.md` | Thêm thông tin về engine Linux | Thấp |

---

*Báo cáo được viết bởi phân tích tự động dựa trên kiến trúc thật của dự án fingerprint-chromium-engine. Mọi ước tính thời gian là dựa trên kinh nghiệm thực tế với Chromium development và không bao gồm thời gian học tập công nghệ mới.*
